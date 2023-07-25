import { LinkTooLongError, LinkTooShortError, LongUrlNotFoundError, ShortLinkAlreadyExists, ShortLinkNotValidURL, ShortUrlNotFoundError } from "@/lib/errors"
import { Shortener } from "@/lib/shortener"
import { LongUrlUrn, ShortUrlUrn } from "@/lib/urns"
import Redis from "ioredis"
jest.mock('ioredis')

describe('Shortener', () => {
    const redis = jest.mocked(new Redis())
    const shortener = new Shortener(redis)

    describe('createShortLink', () => {
        it('Returns an error if given a link that is too short', async () => {
            const result = await shortener.createShortLink(new LongUrlUrn('a'))
            expect(result.err).toEqual(true)
            expect(result.val).toBeInstanceOf(LinkTooShortError)
        })
        it('Returns an error if given a link that is too long', async () => {
            const result = await shortener.createShortLink(new LongUrlUrn('https://' + 'a'.repeat(2048) + '.com'))
            expect(result.err).toEqual(true)
            expect(result.val).toBeInstanceOf(LinkTooLongError)
        })
        it('Returns an error if given a link that not a URL', async () => {
            const result = await shortener.createShortLink(new LongUrlUrn('hahahanotaurl'))
            expect(result.err).toEqual(true)
            expect(result.val).toBeInstanceOf(ShortLinkNotValidURL)
        })
        it('Returns an error if given a link that already exists', async () => {
            const url = 'https://google.com'
            redis.hget.mockResolvedValue(url)
            const result = await shortener.createShortLink(new LongUrlUrn(url))
            expect(result.err).toEqual(true)
            expect(result.val).toBeInstanceOf(ShortLinkAlreadyExists)
        })
        it('Returns a short link if given a valid link', async () => {
            const url = 'https://google.com'
            redis.hget.mockResolvedValue(null)
            redis.incr.mockResolvedValue(1)
            const result = await shortener.createShortLink(new LongUrlUrn(url))
            expect(result.err).toEqual(false)
            expect((result.val as ShortUrlUrn).getResource()).toEqual('b')
        })
    })

    describe('getLongUrlFromShort', () => {
        it('Returns an error attempting to retrieve a long URL from a short link that does not exist', async () => {
            redis.hget.mockResolvedValue(null)
            const result = await shortener.getLongUrlFromShort(new ShortUrlUrn('https://google.com'))
            expect(result.err).toEqual(true)
            expect(result.val).toBeInstanceOf(ShortUrlNotFoundError)
        })

        it('Returns a long URL if given a valid short link', async () => {
            const url = 'https://google.com'
            redis.hget.mockResolvedValue(url)
            const result = await shortener.getLongUrlFromShort(new ShortUrlUrn(url))
            expect(result.err).toEqual(false)
            expect((result.val as LongUrlUrn).getResource()).toEqual(url)
        })
    })

    describe('getShortLink', () => {
        it('Returns an error attempting to retrieve a short link from a long URL that does not exist', async () => {
            redis.hget.mockResolvedValue(null)
            const result = await shortener.getShortLink(new LongUrlUrn('https://google.com'))
            expect(result.err).toEqual(true)
            expect(result.val).toBeInstanceOf(LongUrlNotFoundError)
        })

        it('Returns a short link if given a valid long URL', async () => {
            const url = 'https://google.com'
            redis.hget.mockResolvedValue(url)
            const result = await shortener.getShortLink(new LongUrlUrn(url))
            expect(result.err).toEqual(false)
            expect((result.val as ShortUrlUrn).getResource()).toEqual(url)
        })
    })

    describe('delete', () => {
        it('Returns an error attempting to delete a short link that does not exist', async () => {
            redis.hget.mockResolvedValue(null)
            const result = await shortener.delete(new ShortUrlUrn('https://google.com'))
            expect(result.err).toEqual(true)
            expect(result.val).toBeInstanceOf(ShortUrlNotFoundError)
        })

        it('Returns no errors if attempting to delete a short link that exists', async () => {
            const url = 'https://google.com'
            redis.hget.mockResolvedValue(url)
            const result = await shortener.delete(new ShortUrlUrn(url))
            expect(result.err).toEqual(false)
        })
    })
})