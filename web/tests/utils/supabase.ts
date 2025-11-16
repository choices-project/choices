type SupabaseSession = {
  access_token: string;
  user: {
    id: string;
    email?: string;
  };
};

type SupabaseClientOverrides = Partial<{
  session: SupabaseSession | null;
  signInWithOtp: () => Promise<{ error: null | Error }>;
  signInWithOAuth: () => Promise<{ error: null | Error }>;
}>;

export function mockSupabaseClient(overrides: SupabaseClientOverrides = {}) {
  const session =
    overrides.session ??
    ({
      access_token: 'mock-token',
      user: { id: 'mock-user', email: 'mock@example.com' },
    } as SupabaseSession);

  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session },
      }),
      signInWithOtp:
        overrides.signInWithOtp ??
        jest.fn().mockResolvedValue({
          error: null,
        }),
      signInWithOAuth:
        overrides.signInWithOAuth ??
        jest.fn().mockResolvedValue({
          error: null,
        }),
    },
  };
}

type WebAuthnStubs = {
  createCredential?: () => Promise<PublicKeyCredential>;
  getCredential?: () => Promise<PublicKeyCredential>;
};

export function mockWebAuthn({ createCredential, getCredential }: WebAuthnStubs = {}) {
  const encoder = new TextEncoder();

  class MockAttestationResponse {
    attestationObject = new ArrayBuffer(0);
    clientDataJSON = encoder.encode('{"type":"webauthn.create"}').buffer;
  }

  class MockAssertionResponse {
    authenticatorData = encoder.encode('authenticator-data').buffer;
    clientDataJSON = encoder.encode('{"type":"webauthn.get"}').buffer;
    signature = encoder.encode('signature').buffer;
    userHandle = encoder.encode('user-handle').buffer;
  }

  class MockCredential {
    id = 'mock-credential';
    rawId = encoder.encode('mock-credential').buffer;
    type: PublicKeyCredential['type'] = 'public-key';
    response: MockAttestationResponse | MockAssertionResponse;

    constructor(kind: 'register' | 'authenticate') {
      this.response = kind === 'register' ? new MockAttestationResponse() : new MockAssertionResponse();
    }

    getClientExtensionResults() {
      return {};
    }
  }

  const defaultCreate = () => Promise.resolve(new MockCredential('register') as unknown as PublicKeyCredential);
  const defaultGet = () => Promise.resolve(new MockCredential('authenticate') as unknown as PublicKeyCredential);

  const navigatorCredentials = {
    create: createCredential ?? defaultCreate,
    get: getCredential ?? defaultGet,
  };

  Object.defineProperty(window, 'PublicKeyCredential', {
    configurable: true,
    value: class extends MockCredential {
      static async isUserVerifyingPlatformAuthenticatorAvailable() {
        return true;
      }
    },
  });

  if (!navigator.credentials) {
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: navigatorCredentials,
    });
  } else {
    Object.assign(navigator.credentials, navigatorCredentials);
  }
}

