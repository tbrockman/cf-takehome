import { Analytics } from '@/lib/analytics'
import { redis } from '@/lib/redis'
import { NextResponse } from 'next/server'
import { Shortener } from '@/lib/shortener'
import { ShortLinkAlreadyExists, ShortLinkValidationError } from '@/lib/errors'
import { LinksHandler } from '@/lib/handlers/links'
import { newURLWithPathname } from '@/lib/util'
import { ShortLink, ShortLinkData } from '@/lib/models/short-link'

const analytics = new Analytics(redis)
const shortener = new Shortener(redis)
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
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
    const { url, ttl }: { url: string, ttl: undefined | number } = await request.json()
    const result = await handler.post(url, ttl)

    if (result.ok || result.val instanceof ShortLinkAlreadyExists) {
        const data = result.val as ShortLinkData
        const location = newURLWithPathname(request.url, `api/links/${data.short}}`)
        const body = {
            short: newURLWithPathname(request.url, data.short),
            long: new URL(data.long),
            views: data.views
        }
        return NextResponse.json(body, { status: result.ok ? 201 : 200, headers: { Location: location.toString() } })
    }
    else {
        if (result.val instanceof ShortLinkValidationError) {
            return NextResponse.json({ error: result.val.message }, { status: 400 })
        }
        else {
            return NextResponse.json({ error: result.val.message }, { status: 500 })
        }
    }
}

export const runtime = 'nodejs'
