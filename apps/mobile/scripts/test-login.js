/**
 * Test script to verify API login endpoint
 * Run with: node apps/mobile/scripts/test-login.js
 */

const LOCAL_IP = '10.162.125.124';
const API_PORT = '5001';
const API_URL = `http://${LOCAL_IP}:${API_PORT}/api/auth/login`;

async function testLogin() {
  console.log('Testing login endpoint...');
  console.log('URL:', API_URL);
  console.log('');

  const testCredentials = {
    email: 'test@example.com',
    password: 'test12345',
  };

  try {
    console.log('Sending request with credentials:', testCredentials.email);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCredentials),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    console.log('');

    const text = await response.text();
    console.log('Response body:', text);
    console.log('');

    if (response.ok) {
      const data = JSON.parse(text);
      console.log('✅ Login successful!');
      console.log('User:', data.data?.user);
    } else {
      console.log('❌ Login failed');
      try {
        const error = JSON.parse(text);
        console.log('Error message:', error.message);
      } catch (e) {
        console.log('Could not parse error response');
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    console.error('');
    console.error('Possible issues:');
    console.error('1. API server is not running (check port 5001)');
    console.error('2. IP address is incorrect (current:', LOCAL_IP, ')');
    console.error('3. Network/firewall blocking the connection');
    console.error('');
    console.error('To fix:');
    console.error('- Start API server: cd apps/api && npm run dev');
    console.error('- Check your IP: ipconfig (Windows) or ifconfig (Mac/Linux)');
    console.error('- Update LOCAL_IP in apps/mobile/config/api.ts');
  }
}

testLogin();
