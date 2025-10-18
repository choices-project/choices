/**
 * Database Test Utilities
 * 
 * Comprehensive utilities for testing database operations with proper
 * setup, teardown, and realistic test scenarios.
 */

/**
 * Setup test database with proper configuration
 */
export const setupTestDatabase = async () => {
  // Mock Supabase client for testing
  const mockSupabaseClient = {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn()
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null
          }),
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        }),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }),
      insert: jest.fn().mockResolvedValue({
        data: [{ id: 'test-id' }],
        error: null
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ id: 'test-id' }],
          error: null
        })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })
    })
  };

  // Mock environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

  return mockSupabaseClient;
};

/**
 * Create test user with proper credentials
 */
export const createTestUser = async () => {
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'test-password',
    profile: {
      id: 'test-profile-id',
      user_id: 'test-user-id',
      username: 'testuser',
      display_name: 'Test User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };

  return testUser;
};

/**
 * Create test poll data
 */
export const createTestPoll = () => ({
  id: 'test-poll-id',
  title: 'Test Poll',
  description: 'This is a test poll',
  options: [
    { id: 'option-1', text: 'Option 1' },
    { id: 'option-2', text: 'Option 2' }
  ],
  voting_method: 'single-choice',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'test-user-id'
});

/**
 * Create test vote data
 */
export const createTestVote = () => ({
  id: 'test-vote-id',
  poll_id: 'test-poll-id',
  user_id: 'test-user-id',
  choice: 'option-1',
  created_at: new Date().toISOString()
});

/**
 * Mock authentication for tests
 */
export const mockAuthentication = async (supabaseClient: any, testUser: any) => {
  // Mock successful authentication
  supabaseClient.auth.signInWithPassword.mockResolvedValue({
    data: {
      user: testUser,
      session: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        user: testUser
      }
    },
    error: null
  });

  // Mock get user
  supabaseClient.auth.getUser.mockResolvedValue({
    data: { user: testUser },
    error: null
  });

  // Mock get session
  supabaseClient.auth.getSession.mockResolvedValue({
    data: {
      session: {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        user: testUser
      }
    },
    error: null
  });

  return testUser;
};

/**
 * Mock database operations for polls
 */
export const mockPollOperations = (supabaseClient: any) => {
  const pollsTable = supabaseClient.from('polls');
  
  // Mock poll creation
  pollsTable.insert.mockResolvedValue({
    data: [{ id: 'test-poll-id' }],
    error: null
  });

  // Mock poll retrieval
  pollsTable.select.mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'test-poll-id',
          title: 'Test Poll',
          status: 'active'
        },
        error: null
      }),
      limit: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'test-poll-id',
            title: 'Test Poll',
            status: 'active'
          }
        ],
        error: null
      })
    })
  });

  return pollsTable;
};

/**
 * Mock database operations for votes
 */
export const mockVoteOperations = (supabaseClient: any) => {
  const votesTable = supabaseClient.from('votes');
  
  // Mock vote creation
  votesTable.insert.mockResolvedValue({
    data: [{ id: 'test-vote-id' }],
    error: null
  });

  // Mock vote retrieval
  votesTable.select.mockReturnValue({
    eq: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'test-vote-id',
            poll_id: 'test-poll-id',
            user_id: 'test-user-id',
            choice: 'option-1'
          }
        ],
        error: null
      })
    })
  });

  return votesTable;
};

/**
 * Mock database errors for testing error handling
 */
export const mockDatabaseError = (supabaseClient: any, errorType: 'connection' | 'auth' | 'permission' | 'validation') => {
  const errorMessages = {
    connection: 'Database connection failed',
    auth: 'Authentication failed',
    permission: 'Insufficient permissions',
    validation: 'Validation failed'
  };

  const error = new Error(errorMessages[errorType]);
  
  // Mock error for all operations
  supabaseClient.from.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error
        }),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error
        })
      })
    }),
    insert: jest.fn().mockResolvedValue({
      data: null,
      error
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: null,
        error
      })
    }),
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: null,
        error
      })
    })
  });

  return error;
};

/**
 * Clean up test database after tests
 */
export const cleanupTestDatabase = async () => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset environment variables
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
};

/**
 * Test database connection
 */
export const testDatabaseConnection = async (supabaseClient: any) => {
  try {
    // Test basic connection
    const result = await supabaseClient.from('polls').select('id').limit(1);
    return result.error === null;
  } catch (error) {
    return false;
  }
};

/**
 * Test authentication flow
 */
export const testAuthenticationFlow = async (supabaseClient: any, testUser: any) => {
  try {
    // Test sign in
    const signInResult = await supabaseClient.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });
    
    if (signInResult.error) {
      return false;
    }
    
    // Test get user
    const userResult = await supabaseClient.auth.getUser();
    
    if (userResult.error) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};
