import { setupServer } from 'msw/node';

import { authHandlers } from './auth-handlers';
import { apiHandlers } from './api-handlers';

const handlers = [...authHandlers, ...apiHandlers];

export const authServer = setupServer(...handlers);

export type AuthServer = typeof authServer;


