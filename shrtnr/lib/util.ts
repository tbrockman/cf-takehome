import { Err, Ok, Result } from "ts-results-es"


const base = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789"

function toBase58(id: number): string {
	let result = ""
	while (id > 0) {
		result = base[id % base.length] + result
		id = Math.floor(id / base.length)
	}
	return result
}

function newURLWithPathname(base: string, short: string,): URL {
	const clone = new URL(base)
	clone.pathname = short
	return clone
}

async function tryResultAsync<T, E = Error>(
	func: () => Promise<T>
): Promise<Result<T, E>> {
	try {
		const result = await func()
		return Ok(result)
	} catch (error: any) {
		return Err(error instanceof Error ? error : new Error(error)) as Result<T, E>
	}
}

export { toBase58, tryResultAsync, newURLWithPathname }
