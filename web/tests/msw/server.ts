import { setupServer } from 'msw/node';

import { apiHandlers } from './api-handlers';
import { authHandlers } from './auth-handlers';

const handlers = [...authHandlers, ...apiHandlers];

export const authServer = setupServer(...handlers);

export type AuthServer = typeof authServer;


