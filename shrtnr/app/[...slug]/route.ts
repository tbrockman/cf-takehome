import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { redirect } from 'next/navigation'
import redis from '../../lib/redis';

class Analytics {

  async track(resource: string, metadata: any = {}) {
    return
  }
}

const analytics = new Analytics();

// This function can be marked `async` if using `await` inside
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const { pathname } = request.nextUrl

  // Attempt to fetch URL matching shortlink from Redis  
  const resource = 'urn:shrtnr:url:' + pathname
  const fullUrl = await redis.get(resource);

  // Re-direct to URL if found

  if (fullUrl) {
    analytics.track(fullUrl)

    return NextResponse.redirect(new URL(fullUrl))
  }

  // Increment count of URLs fetched in Redis

  // Otherwise, redirect to 404 page
  return NextResponse.json({}, { status: 404 })
}

export const runtime = 'nodejs'