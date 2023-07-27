import { getApiDocs } from '@/lib/swagger'
import { NextResponse } from 'next/server'

export async function GET() {
    const docs = await getApiDocs()
    return NextResponse.json(docs, { status: 200 })
}