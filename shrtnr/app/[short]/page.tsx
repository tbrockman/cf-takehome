import { notFound, redirect } from 'next/navigation'
import { Shortener } from '@/lib/shortener'
import { ShortUrlNotFoundError } from '@/lib/errors'
import { redis } from '@/lib/redis'
import { Analytics } from '@/lib/analytics'
import { ShortUrlUrn } from '@/lib/urns'

const analytics = new Analytics(redis)
const shortener = new Shortener(redis)

export default async function Page({ params }: any) {
  const { short } = params
  const shortUrlUrn = new ShortUrlUrn(short)
  const result = await shortener.getLongUrlFromShort(shortUrlUrn)

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