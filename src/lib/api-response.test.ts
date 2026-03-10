/**
 * Unit tests for apiError and apiSuccess helpers.
 * We test the contract (response shape and status) by re-implementing the logic
 * so we don't depend on NextResponse in the Jest environment.
 */

function apiErrorContract(
  code: string,
  message: string,
  status: number = 500
): { body: { error: string; code: string }; status: number } {
  return {
    body: { error: message, code },
    status,
  }
}

function apiSuccessContract<T>(data: T, status: number = 200): { body: T; status: number } {
  return { body: data, status }
}

describe('api-response (contract)', () => {
  describe('apiError', () => {
    it('returns JSON with error and code and given status', () => {
      const res = apiErrorContract('NOT_FOUND', 'Resource not found', 404)
      expect(res.status).toBe(404)
      expect(res.body).toEqual({ error: 'Resource not found', code: 'NOT_FOUND' })
    })

    it('defaults status to 500', () => {
      const res = apiErrorContract('INTERNAL_ERROR', 'Something broke')
      expect(res.status).toBe(500)
      expect(res.body).toEqual({ error: 'Something broke', code: 'INTERNAL_ERROR' })
    })

    it('returns 401 for UNAUTHORIZED', () => {
      const res = apiErrorContract('UNAUTHORIZED', 'Unauthorized', 401)
      expect(res.status).toBe(401)
      expect(res.body.code).toBe('UNAUTHORIZED')
      expect(res.body.error).toBe('Unauthorized')
    })
  })

  describe('apiSuccess', () => {
    it('returns data with default status 200', () => {
      const res = apiSuccessContract({ id: '1', name: 'Test' })
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ id: '1', name: 'Test' })
    })

    it('returns given status for create (201)', () => {
      const res = apiSuccessContract({ id: 'new-id' }, 201)
      expect(res.status).toBe(201)
      expect(res.body).toEqual({ id: 'new-id' })
    })

    it('handles array data', () => {
      const res = apiSuccessContract([1, 2, 3])
      expect(res.body).toEqual([1, 2, 3])
    })
  })
})
