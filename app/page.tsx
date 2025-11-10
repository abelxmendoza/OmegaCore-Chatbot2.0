// File: app/page.tsx

import { auth } from './(auth)/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    // If there's no session, trigger guest login flow
    // Use relative path to avoid redirect loops
    redirect('/api/auth/guest?redirectUrl=/chat');
  }

  // If there's a valid session, redirect to /chat
  redirect('/chat');
}
