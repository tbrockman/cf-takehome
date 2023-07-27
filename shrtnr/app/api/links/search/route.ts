import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { LinksHandler } from '@/lib/handlers/links'
import { Analytics } from '@/lib/analytics'
import { Shortener } from '@/lib/shortener'
import { newURLWithPathname } from '@/lib/util'
import { SearchQueryTooShort } from '@/lib/errors'

const analytics = new Analytics(redis)
const shortener = new Shortener(redis)
const handler = new LinksHandler(analytics, shortener)

/**
 * @swagger
 * /api/links/search:
 *   post:
 *     summary: Endpoint to search for short links
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              query:
 *                type: string
 *                description: Search query
 *            required:
 *              - url
 *     responses:
 *       200:
 *         description: Successful response for short link information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   description: List of short links matching the search query
 *                   items:
 *                     type: object
 *                     properties:
 *                       long:
 *                         type: string
 *                         description: Long URL
 *                       short:
 *                         type: string
 *                         description: Shortened URL
 *       500:
 *         description: Server error while searching
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *       400:
 *         description: Invalid search query
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
    const { query } = await request.json()
    const url = request.url

    if (!query) {
        return NextResponse.json({ error: 'Missing query' }, { status: 400 })
    }
    const result = await handler.search(query)
    if (result.err) {

        if (result.val instanceof SearchQueryTooShort) {
            return NextResponse.json({ error: result.val.message }, { status: 400 })
        }
        return NextResponse.json({ error: result.val.message }, { status: 500 })
    }
    const results = result.val.map((r) => {
        return {
            long: r.long,
            short: newURLWithPathname(url, r.short),
        }
    })
    return NextResponse.json({ results })
}

export const runtime = 'nodejs'