// File: app/page.tsx

import { auth } from './(auth)/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function HomePage() {
  const session = await auth();
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const origin = `${protocol}://${host}`;

  if (!session) {
    // If there's no session, trigger guest login flow with correct origin
    redirect(`${origin}/api/auth/guest?redirectUrl=${encodeURIComponent(`${origin}/chat`)}`);
  }

  // If there's a valid session, redirect to /chat
  redirect('/chat');
}
