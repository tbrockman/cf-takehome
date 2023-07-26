import { Analytics } from '@/lib/analytics'
import { redis } from '@/lib/redis'
import { NextResponse } from 'next/server'
import { Shortener } from '@/lib/shortener'
import { ShortLinkAlreadyExists, ShortLinkValidationError } from '@/lib/errors'
import { LinksHandler } from '@/lib/handlers/links'

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
    const newUrl = new URL(request.url)
    const { url, ttl }: { url: string, ttl: undefined | number } = await request.json()
    const result = await handler.post(url, ttl)

    if (result.ok) {
        newUrl.pathname = result.val.short?.toString() || ''
        result.val.short = newUrl.toString()

        return NextResponse.json(result.val, { status: 201, headers: { Location: newUrl.toString() } })
    }
    else {
        if (result.val instanceof ShortLinkAlreadyExists) {
            newUrl.pathname = result.val.short?.toString()
            return NextResponse.json({ short: result.val.short.getResource(), long: result.val.long.getResource(), views: {} }, { status: 200 })
        }
        else if (result.val instanceof ShortLinkValidationError) {
            return NextResponse.json({ error: result.val.message }, { status: 400 })
        }
        else {
            return NextResponse.json({ error: result.val.message }, { status: 500 })
        }
    }
}

export const runtime = 'nodejs'
