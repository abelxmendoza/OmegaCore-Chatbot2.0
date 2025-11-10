import { auth } from '@/app/(auth)/auth';
import { NextRequest } from 'next/server';
import { getChatsByUserId } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = parseInt(searchParams.get('limit') || '10');
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');
  const search = searchParams.get('search'); // New search parameter

  if (startingAfter && endingBefore) {
    return Response.json(
      'Only one of starting_after or ending_before can be provided!',
      { status: 400 },
    );
  }

  const session = await auth();

  if (!session?.user?.id) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  try {
    const chats = await getChatsByUserId({
      id: session.user.id,
      limit: search ? 100 : limit, // Get more results when searching
      startingAfter,
      endingBefore,
    });

    // Filter by search term if provided
    let filteredChats = chats.chats;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredChats = chats.chats.filter((chat) =>
        chat.title.toLowerCase().includes(searchLower)
      );
      // Limit search results
      filteredChats = filteredChats.slice(0, limit);
    }

    return Response.json({
      chats: filteredChats,
      hasMore: search ? false : chats.hasMore, // Don't paginate search results
    });
  } catch (_) {
    return Response.json('Failed to fetch chats!', { status: 500 });
  }
}
