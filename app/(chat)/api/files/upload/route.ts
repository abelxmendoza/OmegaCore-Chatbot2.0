import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { sanitizeFileName } from '@/lib/security/sanitize';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'File size should be less than 5MB',
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
      message: 'File type should be JPEG or PNG',
    }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.issues
        .map((issue: { message: string }) => issue.message)
        .join(', ');

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const originalFilename = (formData.get('file') as File).name;
    const sanitizedFilename = sanitizeFileName(originalFilename);
    const fileBuffer = await file.arrayBuffer();

    // Additional security: Verify file type by magic bytes
    const fileHeader = new Uint8Array(fileBuffer.slice(0, 4));
    const isJPEG = fileHeader[0] === 0xff && fileHeader[1] === 0xd8;
    const isPNG =
      fileHeader[0] === 0x89 &&
      fileHeader[1] === 0x50 &&
      fileHeader[2] === 0x4e &&
      fileHeader[3] === 0x47;

    if (!isJPEG && !isPNG) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG and PNG are allowed.' },
        { status: 400 },
      );
    }

    try {
      // Use sanitized filename with user ID prefix for isolation
      const userId = session.user?.id || 'guest';
      const safeFilename = `${userId}/${Date.now()}-${sanitizedFilename}`;
      
      const data = await put(safeFilename, fileBuffer, {
        access: 'public',
      });

      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
