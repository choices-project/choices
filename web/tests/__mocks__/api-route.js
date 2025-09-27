// Mock for API routes to prevent privacy-utils imports during tests
module.exports = {
  GET: jest.fn(),
  POST: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
  PATCH: jest.fn(),
};
