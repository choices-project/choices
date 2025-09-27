#!/usr/bin/env node

// Generate a privacy pepper for Vercel environment variables
const crypto = require('crypto');

// Generate a random 32-byte pepper
const pepper = crypto.randomBytes(32);

console.log('Generated Privacy Pepper:');
console.log('=======================');
console.log('');
console.log('Base64 format (recommended):');
console.log(`PRIVACY_PEPPER_CURRENT=base64:${pepper.toString('base64')}`);
console.log('');
console.log('Hex format:');
console.log(`PRIVACY_PEPPER_CURRENT=hex:${pepper.toString('hex')}`);
console.log('');
console.log('Copy one of these values to your Vercel environment variables.');
console.log('Make sure to include the "base64:" or "hex:" prefix!');
