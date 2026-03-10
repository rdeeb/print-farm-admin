import { NextResponse } from 'next/server'

/**
 * Returns a JSON error response with standardized shape { error, code }.
 */
export function apiError(
  code: string,
  message: string,
  status: number = 500
): NextResponse {
  return NextResponse.json({ error: message, code }, { status })
}

/**
 * Returns a JSON success response. By default status is 200.
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}
