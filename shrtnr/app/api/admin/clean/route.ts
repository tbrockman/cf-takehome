import { redis } from '@/lib/redis'

export async function POST(request: Request) {
    await redis.call('FLUSHALL')
    return new Response('OK')
}