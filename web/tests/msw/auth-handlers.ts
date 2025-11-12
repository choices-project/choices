import { http, HttpResponse } from 'msw';

type CredentialsPayload = {
  credential?: {
    id: string;
    rawId: number[];
    response: {
      authenticatorData: number[];
      clientDataJSON: number[];
      signature: number[];
      userHandle: number[] | null;
    };
    type: string;
  };
};

const base64Challenge = 'dGVzdC1jaGFsbGVuZ2U=';
const userIdBase64 = 'dGVzdC11c2VyLWlk';
const userEmail = 'user@example.com';

const defaultRegistrationOptions = {
  challenge: base64Challenge,
  rp: {
    id: 'localhost',
    name: 'Choices',
  },
  user: {
    id: userIdBase64,
    name: userEmail,
    displayName: 'Test User',
  },
  pubKeyCredParams: [
    { type: 'public-key', alg: -7 },
    { type: 'public-key', alg: -257 },
  ],
  timeout: 60_000,
  excludeCredentials: [],
  authenticatorSelection: {
    userVerification: 'required' as const,
    authenticatorAttachment: 'platform' as const,
  },
  attestation: 'none' as const,
  extensions: {},
};

const defaultAuthenticationOptions = {
  challenge: base64Challenge,
  allowCredentials: [
    {
      id: base64Challenge,
      type: 'public-key',
      transports: ['internal'],
    },
  ],
  timeout: 60_000,
  rpId: 'localhost',
  userVerification: 'required' as const,
  extensions: {},
};

const registrationSuccess = {
  success: true,
  credentialId: 'test-credential',
  publicKey: 'BASE64_PUBLIC_KEY',
  counter: 0,
  transports: ['internal'],
};

const authenticationSuccess = {
  success: true,
  credentialId: 'test-credential',
  newCounter: 1,
};

export const authHandlers = [
  http.post('/api/v1/auth/webauthn/native/register/options', async () => {
    return HttpResponse.json(defaultRegistrationOptions);
  }),
  http.post('/api/v1/auth/webauthn/native/register/verify', async () => {
    return HttpResponse.json(registrationSuccess);
  }),
  http.post('/api/v1/auth/webauthn/native/authenticate/options', async () => {
    return HttpResponse.json(defaultAuthenticationOptions);
  }),
  http.post('/api/v1/auth/webauthn/native/authenticate/verify', async ({ request }) => {
    const body = (await request.json()) as CredentialsPayload | undefined;
    if (!body?.credential) {
      return HttpResponse.json(
        { success: false, error: 'Missing credential payload' },
        { status: 400 },
      );
    }
    return HttpResponse.json(authenticationSuccess);
  }),
  http.post('/api/auth/login', async () => {
    return HttpResponse.json({
      token: 'mock-auth-token',
      user: {
        id: 'test-user',
        email: userEmail,
      },
    });
  }),
  http.post('/api/auth/register', async () => {
    return HttpResponse.json({
      success: true,
      user: {
        id: 'test-user',
        email: userEmail,
      },
    });
  }),
  http.get('/api/profile', async () => {
    return HttpResponse.json({
      profile: {
        id: 'test-profile',
        user_id: 'test-user',
        username: 'testuser',
      },
    });
  }),
];


