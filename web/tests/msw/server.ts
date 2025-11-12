import { setupServer } from 'msw/node';

import { authHandlers } from './auth-handlers';

export const authServer = setupServer(...authHandlers);

export type AuthServer = typeof authServer;


