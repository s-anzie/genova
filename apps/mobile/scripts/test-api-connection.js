#!/usr/bin/env node

/**
 * Script de test de connexion à l'API
 * 
 * Usage: node scripts/test-api-connection.js
 */

const LOCAL_IP = '192.168.1.149';
const API_PORT = '5001';
const API_BASE_URL = `http://${LOCAL_IP}:${API_PORT}`;

async function testConnection() {
  console.log('🔍 Test de connexion à l\'API...\n');
  console.log(`URL de base: ${API_BASE_URL}`);
  console.log('─'.repeat(50));

  // Test 1: Health check
  try {
    console.log('\n1️⃣  Test du endpoint /health...');
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health check réussi:', data);
  } catch (error) {
    console.error('❌ Health check échoué:', error.message);
    console.log('\n💡 Vérifiez que:');
    console.log('   - L\'API est démarrée (cd apps/api && npm run dev)');
    console.log('   - Votre PC et téléphone sont sur le même réseau WiFi');
    console.log(`   - L'adresse IP ${LOCAL_IP} est correcte`);
    console.log('   - Le pare-feu ne bloque pas le port 5001');
    process.exit(1);
  }

  // Test 2: API root
  try {
    console.log('\n2️⃣  Test du endpoint /api...');
    const response = await fetch(`${API_BASE_URL}/api`);
    const data = await response.json();
    console.log('✅ API root réussi:', data);
  } catch (error) {
    console.error('❌ API root échoué:', error.message);
  }

  // Test 3: Auth endpoints (should return 400/401 but not network error)
  try {
    console.log('\n3️⃣  Test du endpoint /api/auth/login...');
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
    });
    console.log(`✅ Endpoint accessible (status: ${response.status})`);
  } catch (error) {
    console.error('❌ Auth endpoint échoué:', error.message);
  }

  console.log('\n' + '─'.repeat(50));
  console.log('✨ Tests terminés!\n');
  console.log('📱 Vous pouvez maintenant tester depuis votre téléphone:');
  console.log(`   Ouvrez un navigateur et allez sur: ${API_BASE_URL}/health\n`);
}

testConnection();
