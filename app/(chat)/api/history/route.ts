import { auth } from '@/app/(auth)/auth';
import { NextRequest } from 'next/server';
import { getChatsByUserId } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Security: Validate and limit parameters
  const limitParam = searchParams.get('limit') || '10';
  const limit = Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 100); // Between 1 and 100
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');
  const search = searchParams.get('search'); // New search parameter

  // Security: Sanitize search input
  const sanitizedSearch = search ? search.substring(0, 100).trim() : null;

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
    // Security: Validate UUIDs if provided
    if (startingAfter && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(startingAfter)) {
      return Response.json('Invalid starting_after UUID', { status: 400 });
    }
    if (endingBefore && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(endingBefore)) {
      return Response.json('Invalid ending_before UUID', { status: 400 });
    }

    const chats = await getChatsByUserId({
      id: session.user.id,
      limit: sanitizedSearch ? 100 : limit, // Get more results when searching
      startingAfter,
      endingBefore,
    });

    // Filter by search term if provided
    let filteredChats = chats.chats;
    if (sanitizedSearch) {
      const searchLower = sanitizedSearch.toLowerCase();
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
