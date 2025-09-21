// Test script to verify backend URL configuration
require('dotenv').config();

console.log('Environment Variables:');
console.log('NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
console.log('BACKEND_URL:', process.env.BACKEND_URL);

// Simulate the getBackendUrl function
function getBackendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
}

console.log('\nGenerated backend URL:', getBackendUrl());
console.log('Test endpoint URL:', `${getBackendUrl()}/api/health`);