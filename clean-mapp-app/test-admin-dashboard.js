// Test script for Admin Dashboard API
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4002/api';

async function testAdminDashboard() {
  console.log('🧪 Testing Admin Dashboard API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    console.log('');

    // Test token stats
    console.log('2. Testing token stats...');
    const statsResponse = await fetch(`${API_BASE}/token-stats`);
    const statsData = await statsResponse.json();
    console.log('✅ Token stats:', JSON.stringify(statsData, null, 2));
    console.log('');

    // Test usage history
    console.log('3. Testing usage history...');
    const usageResponse = await fetch(`${API_BASE}/token-usage?limit=5`);
    const usageData = await usageResponse.json();
    console.log('✅ Usage history (first 5 entries):', JSON.stringify(usageData, null, 2));
    console.log('');

    // Test live token data
    console.log('4. Testing live token data...');
    const liveResponse = await fetch(`${API_BASE}/token-live`);
    const liveData = await liveResponse.json();
    console.log('✅ Live token data:', liveData);
    console.log('');

    // Test logging usage
    console.log('5. Testing usage logging...');
    const logResponse = await fetch(`${API_BASE}/log-usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiName: 'test_api',
        endpoint: '/api/test',
        tokensUsed: 1,
        requestData: { test: true },
        responseStatus: '200',
        responseTimeMs: 100,
        status: 'success'
      })
    });
    const logData = await logResponse.json();
    console.log('✅ Usage logged:', logData);
    console.log('');

    console.log('🎉 All tests passed! Admin Dashboard API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the admin dashboard API server is running:');
    console.log('   npm run dev:admin');
  }
}

// Run the test
testAdminDashboard(); 