import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { redis, ratelimit } from '../../lib/limiter';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    let identifier = ip;
    if (session?.user?.email) {
      identifier = session.user.email;
    }

    const { remaining, limit } = await ratelimit.getRemaining(identifier);

    return NextResponse.json({
      remaining,
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check rate limit' },
      { status: 500 }
    );
  }
}