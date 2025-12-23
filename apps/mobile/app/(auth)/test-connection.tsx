import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { Colors } from '@/constants/colors';

export default function TestConnectionScreen() {
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setTesting(true);
    setResults([]);

    addResult('🔍 Starting connection test...');
    addResult(`📍 API Base URL: ${API_BASE_URL}`);
    addResult('');

    // Test 1: Basic connectivity
    addResult('Test 1: Basic API connectivity');
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
      });
      addResult(`✅ API reachable - Status: ${response.status}`);
    } catch (error: any) {
      addResult(`❌ Cannot reach API: ${error.message}`);
      addResult('💡 Check if API server is running on port 5001');
    }

    addResult('');

    // Test 2: Login endpoint
    addResult('Test 2: Login endpoint structure');
    addResult(`📍 Login URL: ${API_ENDPOINTS.auth.login}`);
    
    try {
      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });

      addResult(`Response status: ${response.status}`);
      
      const text = await response.text();
      addResult(`Response body: ${text.substring(0, 200)}...`);

      if (response.status === 401) {
        addResult('✅ Login endpoint is working (401 = wrong credentials)');
      } else if (response.status === 200) {
        addResult('✅ Login endpoint is working (test user exists!)');
      } else {
        addResult(`⚠️ Unexpected status: ${response.status}`);
      }
    } catch (error: any) {
      addResult(`❌ Login endpoint error: ${error.message}`);
    }

    addResult('');
    addResult('🏁 Test complete!');
    setTesting(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connection Test</Text>
        <Text style={styles.subtitle}>
          Test API connectivity and endpoints
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={testConnection}
        disabled={testing}
      >
        {testing ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>Run Test</Text>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.results}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  backButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
