import { redis } from '@/lib/redis'

export async function POST(request: Request) {
    await redis.call('FLUSHALL')
    await redis.call('FT.CREATE', 'urn:shrtnr:search:short_urls', 'ON', 'HASH', 'PREFIX', 1, 'urn:shrtnr:short_url:', 'SCHEMA', 'long', 'TAG', 'SORTABLE', 'protocol', 'TAG', 'SORTABLE')
    return new Response('OK')
}