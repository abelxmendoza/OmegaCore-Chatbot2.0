import { auth } from '@/app/(auth)/auth';
import type { ArtifactKind } from '@/components/artifact';
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
} from '@/lib/db/queries';
import { isValidUUID, sanitizeString } from '@/lib/security/sanitize';
import { z } from 'zod';

const documentSchema = z.object({
  content: z.string().max(10 * 1024 * 1024), // 10MB max content
  title: z.string().min(1).max(500),
  kind: z.enum(['text', 'code', 'image', 'sheet']),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id || !isValidUUID(id)) {
    return new Response('Invalid or missing id', { status: 400 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (!document) {
    return new Response('Not found', { status: 404 });
  }

  if (document.userId !== session.user.id) {
    return new Response('Forbidden', { status: 403 });
  }

  return Response.json(documents, { status: 200 });
}

export async function POST(request: Request) {
  // Security: Limit request body size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
    return new Response('Request body too large', { status: 413 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id || !isValidUUID(id)) {
    return new Response('Invalid or missing id', { status: 400 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Validate and sanitize input
  const validation = documentSchema.safeParse(body);
  if (!validation.success) {
    return new Response('Invalid request body', { status: 400 });
  }

  const { content, title, kind } = validation.data;

  // Sanitize content and title
  const sanitizedContent = sanitizeString(content, 10 * 1024 * 1024);
  const sanitizedTitle = sanitizeString(title, 500);

  const documents = await getDocumentsById({ id });

  if (documents.length > 0) {
    const [document] = documents;

    if (document.userId !== session.user.id) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  const document = await saveDocument({
    id,
    content: sanitizedContent,
    title: sanitizedTitle,
    kind,
    userId: session.user.id,
  });

  return Response.json(document, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const timestamp = searchParams.get('timestamp');

  if (!id || !isValidUUID(id)) {
    return new Response('Invalid or missing id', { status: 400 });
  }

  if (!timestamp) {
    return new Response('Missing timestamp', { status: 400 });
  }

  // Validate timestamp format
  const timestampDate = new Date(timestamp);
  if (isNaN(timestampDate.getTime())) {
    return new Response('Invalid timestamp format', { status: 400 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (document.userId !== session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const documentsDeleted = await deleteDocumentsByIdAfterTimestamp({
    id,
    timestamp: timestampDate,
  });

  return Response.json(documentsDeleted, { status: 200 });
}
