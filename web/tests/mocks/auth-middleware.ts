export const requireAdmin = jest.fn(async () => undefined);
export const getAdminUser = jest.fn(async () => ({ id: 'admin-id', email: 'admin@example.com' }));
export const withAuth = jest.fn((handler: any) => handler);
export const createRateLimitMiddleware = jest.fn();
export const combineMiddleware = jest.fn();

export default { requireAdmin, getAdminUser, withAuth, createRateLimitMiddleware, combineMiddleware };
