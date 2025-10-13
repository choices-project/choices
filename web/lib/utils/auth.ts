// Mock auth utilities for testing
export const getUser = jest.fn().mockResolvedValue({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  error: null,
})

export const requireAuth = jest.fn().mockImplementation((handler) => {
  return async (req: any, res: any) => {
    const user = await getUser()
    if (!user.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    return handler(req, res)
  }
})

export const checkPermissions = jest.fn().mockResolvedValue(true)

export const validateSession = jest.fn().mockResolvedValue({
  valid: true,
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
  },
})
