import { Analytics } from '@/lib/analytics';
import { Redis } from 'ioredis'
import { NextResponse } from 'next/server'
import { LinkShortener } from '@/lib/link-shortener'
import { ShortLinkAlreadyExists } from '@/lib/errors'
import { LinksHandler } from '@/lib/handlers/links';

const redis = new Redis()
const analytics = new Analytics(redis)
const shortener = new LinkShortener(redis)
const handler = new LinksHandler(analytics, shortener)

/**
 * @swagger
 * /api/links:
 *   post:
 *     summary: Endpoint to generate a short link
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              url:
 *                type: string
 *                description: URL to generate a short link for
 *              ttl:
 *                type: number
 *                description: Time to live in seconds
 *            required:
 *              - url
 *     responses:
 *       201:
 *         description: Successful response for short link creation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL of the resulting short link
 *         headers: 
 *           Location:
 *             schema:
 *               type: string
 *             description: URL of the resulting short link
 *       304:
 *         description: Successful response for short link creation, but the short link already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL of the existing short link
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *             description: URL to the existing short link
 *       500:
 *         description: Server error experienced during short link creation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
export async function POST(request: Request) {
    const newUrl = new URL(request.url)
    const { url, ttl }: { url: string, ttl: undefined | number } = await request.json()
    const result = await handler.post(url, ttl)

    if (result.ok) {
        newUrl.pathname = result.val.getResource()
        return NextResponse.json({ url: newUrl.toString() }, { status: 201, headers: { Location: newUrl.toString() } })
    }
    else {
        
        if (result.val instanceof ShortLinkAlreadyExists) {
            newUrl.pathname = result.val.link
            return new Response(null, { status: 304, headers: { Location: newUrl.toString() } })
        }
        else {
            return NextResponse.json({ error: result.val.message }, { status: 500 })
        }
    }
}

export const runtime = 'nodejs'
