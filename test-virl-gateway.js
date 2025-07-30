const axios = require('axios');

async function testVIRLGateway() {
  console.log('🧪 Testing VIRL Gateway...');
  
  try {
    // Test 1: Basic request
    console.log('\n🔍 Test 1: Basic VIRL request');
    const response1 = await axios.post('http://localhost:3000/api/virl-gateway', {
      query: 'What is the latest news about AI?'
    });
    
    console.log('✅ Response 1:', {
      success: response1.data.success,
      cached: response1.data.cached,
      answerLength: response1.data.data?.answer?.length || 0
    });
    
    // Test 2: Metrics endpoint
    console.log('\n📊 Test 2: VIRL metrics');
    const metricsResponse = await axios.get('http://localhost:3000/api/virl-metrics');
    
    console.log('✅ Metrics:', {
      requests: metricsResponse.data.metrics.requests,
      failures: metricsResponse.data.metrics.failures,
      successRate: metricsResponse.data.metrics.successRate,
      avgLatency: metricsResponse.data.metrics.avgLatency
    });
    
    // Test 3: Rate limiting
    console.log('\n🛡️ Test 3: Rate limiting (should fail after 10 requests)');
    const promises = [];
    for (let i = 0; i < 12; i++) {
      promises.push(
        axios.post('http://localhost:3000/api/virl-gateway', {
          query: `Test query ${i}`
        }).catch(err => ({ error: err.response?.data || err.message }))
      );
    }
    
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    console.log(`✅ Rate limiting test: ${errors.length} requests blocked`);
    
    console.log('\n🎉 VIRL Gateway tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testVIRLGateway(); 