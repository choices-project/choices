const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Create a test session token
const testUser = {
  id: 'test-user-id',
  stableId: 'test_user',
  username: 'test_user',
  email: 'test@example.com',
  verificationTier: 'T0',
  isActive: true,
  twoFactorEnabled: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

const payload = {
  userId: testUser.id,
  stableId: testUser.stableId,
  username: testUser.username
}

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: 7 * 24 * 60 * 60 })

console.log('Test session token:')
console.log(token)
console.log('\nToken payload:')
console.log(JSON.stringify(payload, null, 2))

// Verify the token
try {
  const decoded = jwt.verify(token, JWT_SECRET)
  console.log('\nToken verification successful:')
  console.log(JSON.stringify(decoded, null, 2))
} catch (error) {
  console.error('Token verification failed:', error.message)
}
















