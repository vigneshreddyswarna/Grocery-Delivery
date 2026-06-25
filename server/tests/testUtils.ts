import type { Request, Response } from "express"
import { vi } from "vitest"

export const createReq = (body: Record<string, unknown> = {}, params: Record<string, string> = {}) =>
    ({ body, params } as Request)

export const createRes = () => {
    const res = {
        status: vi.fn(),
        json: vi.fn(),
    } as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> }

    res.status.mockReturnValue(res)
    res.json.mockReturnValue(res)
    return res
}

export const getJson = (res: ReturnType<typeof createRes>) => res.json.mock.calls.at(-1)?.[0]
