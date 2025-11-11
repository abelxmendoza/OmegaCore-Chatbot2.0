import {
  appendClientMessage,
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import type { UserType } from '@/lib/ai/entitlements';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import type { DBMessage } from '@/lib/db/schema';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { calculator } from '@/lib/ai/tools/calculator';
import { getTime } from '@/lib/ai/tools/get-time';
import { webBrowser } from '@/lib/ai/tools/web-browser';
import { shellExec } from '@/lib/ai/tools/shell-exec';
import { createRemember } from '@/lib/ai/tools/remember';
import { createForget } from '@/lib/ai/tools/forget';
import { createListMemories } from '@/lib/ai/tools/list-memories';
import { email, readEmails } from '@/lib/ai/tools/email';
import { calendar } from '@/lib/ai/tools/calendar';
import { systemSecurity } from '@/lib/ai/tools/system-security';
import { searchMemories } from '@/lib/db/memory';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';

export const maxDuration = 60;

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new Response('Invalid request body', { status: 400 });
  }

  try {
    const { id, message, selectedChatModel } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check if database is available
    const hasDatabase = !!process.env.POSTGRES_URL;
    
    if (!hasDatabase) {
      console.warn('[Chat API] POSTGRES_URL not set - chat history will not be saved');
    }

    const userType: UserType = session.user.type as UserType;

    // Skip rate limiting and chat persistence if no database
    let previousMessages: Array<DBMessage> = [];
    if (hasDatabase) {
      try {
        const messageCount = await getMessageCountByUserId({
          id: session.user.id as string,
          differenceInHours: 24,
        });

        if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
          return new Response(
            'You have exceeded your maximum number of messages for the day! Please try again later.',
            { status: 429 },
          );
        }

        const chat = await getChatById({ id });

        if (!chat) {
          const title = await generateTitleFromUserMessage({ message });
          console.log('[CREATE CHAT]', id, title);
          await saveChat({ id, userId: session.user.id as string, title });
        } else {
          if (chat.userId !== (session.user.id as string)) {
            return new Response('Forbidden', { status: 403 });
          }
        }

        previousMessages = await getMessagesByChatId({ id });
      } catch (error) {
        console.error('[Chat API] Database error, continuing without persistence:', error);
      }
    }

    const messages = appendClientMessage({
      // @ts-expect-error: todo add type conversion from DBMessage[] to UIMessage[]
      messages: previousMessages,
      message,
    });

    const location = await geolocation(request);
    const { longitude, latitude, city = '', country = '' } = location ?? {};

    const requestHints: RequestHints = {
      longitude: (longitude ?? 0) as RequestHints['longitude'],
      latitude: (latitude ?? 0) as RequestHints['latitude'],
      city: (city ?? '') as RequestHints['city'],
      country: (country ?? '') as RequestHints['country'],
    };

    // Retrieve relevant memories for context
    let memoryContext = '';
    if (hasDatabase && session.user?.id) {
      try {
        // Extract text from user message for memory search
        const userMessageText = typeof message === 'string' 
          ? message 
          : message.parts?.map((p: any) => (typeof p === 'string' ? p : p.text || '')).join(' ') || '';
        
        if (userMessageText) {
          const relevantMemories = await searchMemories({
            userId: session.user.id as string,
            query: userMessageText,
            limit: 3,
            threshold: 0.7,
          });

          if (relevantMemories.length > 0) {
            memoryContext = `\n\nRelevant context from memory:\n${relevantMemories
              .map((m, i) => `${i + 1}. ${m.content}`)
              .join('\n')}\n`;
          }
        }
      } catch (error) {
        console.error('[Chat API] Failed to retrieve memories:', error);
        // Continue without memory context if retrieval fails
      }
    }

    // Only save user message if database is available
    if (hasDatabase) {
      try {
        await saveMessages({
          messages: [
            {
              chatId: id,
              id: message.id,
              role: 'user',
              parts: message.parts,
              attachments: message.experimental_attachments ?? [],
              createdAt: new Date(),
            },
          ],
        });
      } catch (error) {
        console.error('[Chat API] Failed to save user message:', error);
      }
    }

    return createDataStreamResponse({
      execute: (dataStream) => {
        const userId = session.user?.id as string;
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }) + memoryContext,
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : ['getWeather', 'calculator', 'getTime', 'createDocument', 'updateDocument', 'requestSuggestions', 'webBrowser', 'shellExec', 'remember', 'forget', 'listMemories', 'email', 'readEmails', 'calendar', 'systemSecurity'],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            calculator,
            getTime,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({ session, dataStream }),
            webBrowser,
            shellExec,
            ...(hasDatabase && userId
              ? {
                  remember: createRemember({ userId }),
                  forget: createForget({ userId }),
                  listMemories: createListMemories({ userId }),
                }
              : {}),
            email,
            readEmails,
            calendar,
            systemSecurity,
          },
          onFinish: async ({ response }) => {
            if (session.user?.id && hasDatabase) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) throw new Error('No assistant message found!');

                const [, assistantMessage] = appendResponseMessages({
                  messages: [message],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments: assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (err) {
                console.error('Failed to save chat', err);
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });
  } catch (err) {
    console.error('[POST ERROR]', err);
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check if database is available
  if (!process.env.POSTGRES_URL) {
    return new Response('Database not configured', { status: 503 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== (session.user.id as string)) {
      return new Response('Forbidden', { status: 403 });
    }

    const deletedChat = await deleteChatById({ id });

    return Response.json(deletedChat, { status: 200 });
  } catch (error) {
    console.error('[DELETE ERROR]', error);
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
