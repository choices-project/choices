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
  credentialId: 'test-credential',
  publicKey: 'BASE64_PUBLIC_KEY',
  counter: 0,
  transports: ['internal'],
};

const authenticationSuccess = {
  credentialId: 'test-credential',
  newCounter: 1,
};

const successEnvelope = (data: unknown, metadata?: Record<string, unknown>) => ({
  success: true as const,
  data,
  metadata: {
    timestamp: new Date().toISOString(),
    ...(metadata ?? {}),
  },
});

const errorEnvelope = (error: string, metadata?: Record<string, unknown>) => ({
  success: false as const,
  error,
  metadata: {
    timestamp: new Date().toISOString(),
    ...(metadata ?? {}),
  },
});

export const authHandlers = [
  http.post('/api/v1/auth/webauthn/native/register/options', async () => {
    return HttpResponse.json(successEnvelope(defaultRegistrationOptions));
  }),
  http.post('/api/v1/auth/webauthn/native/register/verify', async () => {
    return HttpResponse.json(successEnvelope(registrationSuccess));
  }),
  http.post('/api/v1/auth/webauthn/native/authenticate/options', async () => {
    return HttpResponse.json(successEnvelope(defaultAuthenticationOptions));
  }),
  http.post('/api/v1/auth/webauthn/native/authenticate/verify', async ({ request }) => {
    const body = (await request.json()) as CredentialsPayload | undefined;
    if (!body?.credential) {
      return HttpResponse.json(errorEnvelope('Missing credential payload'), { status: 400 });
    }
    return HttpResponse.json(successEnvelope(authenticationSuccess));
  }),
  http.post('/api/auth/login', async () => {
    return HttpResponse.json(
      successEnvelope({
        token: 'mock-auth-token',
        user: {
          id: 'test-user',
          email: userEmail,
        },
      }),
    );
  }),
  http.post('/api/auth/register', async () => {
    return HttpResponse.json(
      successEnvelope({
        user: {
          id: 'test-user',
          email: userEmail,
        },
      }),
    );
  }),
  http.get('/api/profile', async () => {
    return HttpResponse.json(
      successEnvelope({
        profile: {
          id: 'test-profile',
          user_id: 'test-user',
          username: 'testuser',
        },
      }),
    );
  }),
];


