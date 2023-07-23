import { notFound, redirect } from 'next/navigation'
import { LinkShortener } from '@/lib/link-shortener';
import { ShortUrlNotFoundError } from '@/lib/errors';
import { Redis } from 'ioredis';
import { Analytics } from '@/lib/analytics';
import { ShortUrlUrn } from '@/lib/urns';

const redis = new Redis();
const analytics = new Analytics(redis);
const shortener = new LinkShortener(redis);

export default async function Page({ params }: any) {
  const { short } = params
  const shortUrlUrn = new ShortUrlUrn(short)
  const result = await shortener.getLongUrl(shortUrlUrn)

  if (result.ok) {
    analytics.track(shortUrlUrn)
    return redirect(result.val.getResource())
  }
  else {
    
    if (result.val instanceof ShortUrlNotFoundError) {
      return notFound()
    }
    return result.unwrap() // trigger error boundary
  }
}

export const runtime = 'nodejs'