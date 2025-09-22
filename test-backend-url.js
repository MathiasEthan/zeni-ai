// Test script to verify backend URL configuration
// Note: This doesn't load .env file - use this to test production config

console.log('=== Environment Variables ===');
#!/usr/bin/env node

/**
 * Test Backend URL Configuration
 * This script helps debug environment variable issues by showing
 * what backend URL would be used in different scenarios.
 */

// Simulate the same logic as in lib/api-config.ts
function getBackendUrl() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  if (!backendUrl) {
    console.warn('⚠️  NEXT_PUBLIC_BACKEND_URL is not set. Using localhost fallback. This will fail in production!');
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.error('❌ Backend URL not configured for production deployment!');
    }
  }
  
  return backendUrl || 'http://localhost:5000';
}

console.log('🔍 Backend URL Configuration Test');
console.log('==================================');
console.log('');

// Show current environment
console.log('📋 Current Environment:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`NEXT_PUBLIC_BACKEND_URL: ${process.env.NEXT_PUBLIC_BACKEND_URL || 'not set'}`);
console.log(`NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || 'not set'}`);
console.log('');

// Test the backend URL function
console.log('🧪 Backend URL Test:');
const backendUrl = getBackendUrl();
console.log(`Result: ${backendUrl}`);
console.log('');

// Provide guidance
if (backendUrl === 'http://localhost:5000') {
  console.log('❌ ISSUE DETECTED: Using localhost fallback');
  console.log('');
  console.log('🛠️  Solutions:');
  console.log('1. Set environment variable locally:');
  console.log('   export NEXT_PUBLIC_BACKEND_URL=https://zeni-agent-backend-service-gen-lang-client-0966393611.asia-south1.run.app');
  console.log('');
  console.log('2. For production deployment, ensure build args are passed:');
  console.log('   docker build --build-arg NEXT_PUBLIC_BACKEND_URL=https://zeni-agent-backend-service-gen-lang-client-0966393611.asia-south1.run.app ...');
  console.log('');
  console.log('3. Use the automated deployment script:');
  console.log('   ./deploy.sh');
} else {
  console.log('✅ SUCCESS: Backend URL is properly configured');
  console.log('');
  console.log('🧪 Testing connectivity to backend...');
  
  // Test if the backend is reachable
  const https = require('https');
  const http = require('http');
  const url = require('url');
  
  const parsedUrl = url.parse(backendUrl);
  const client = parsedUrl.protocol === 'https:' ? https : http;
  
  const req = client.get(backendUrl, (res) => {
    console.log(`✅ Backend is reachable: ${res.statusCode} ${res.statusMessage}`);
  });
  
  req.on('error', (err) => {
    console.log(`❌ Backend connection failed: ${err.message}`);
    console.log('🔧 Check if the backend service is running and accessible');
  });
  
  req.setTimeout(5000, () => {
    console.log('⏰ Backend connection timeout (5s)');
    req.destroy();
  });
}

console.log('');
console.log('📚 For more help, see DEPLOYMENT_ENV_SETUP.md');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Simulate the getBackendUrl function
function getBackendUrl() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  if (!backendUrl) {
    console.warn('⚠️  NEXT_PUBLIC_BACKEND_URL is not set. Using localhost fallback. This will fail in production!');
  }
  
  return backendUrl || 'http://localhost:5000';
}

console.log('\n=== Generated URLs ===');
console.log('Backend URL:', getBackendUrl());
console.log('Test debate endpoint:', `${getBackendUrl()}/api/debate`);
console.log('Test health endpoint:', `${getBackendUrl()}/api/health`);

// Check if we're likely in production
const hostname = process.env.HOSTNAME || 'unknown';
const isProduction = hostname !== 'localhost' && !hostname.includes('local');

if (isProduction && !process.env.NEXT_PUBLIC_BACKEND_URL) {
  console.error('\n❌ ERROR: In production environment but NEXT_PUBLIC_BACKEND_URL is not set!');
  console.error('This will cause the frontend to try connecting to localhost:5000');
  process.exit(1);
} else if (process.env.NEXT_PUBLIC_BACKEND_URL) {
  console.log('\n✅ Backend URL is properly configured');
} else {
  console.log('\n⚠️  Using localhost fallback (OK for local development)');
}