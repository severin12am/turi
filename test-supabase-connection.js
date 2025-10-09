#!/usr/bin/env node

/**
 * Test Supabase Connection with New API Key Format (October 2025)
 * Run this script to verify your Supabase configuration is working
 * 
 * Usage: node test-supabase-connection.js
 */

import { createClient } from '@supabase/supabase-js';

console.log('\n🔍 Testing Supabase Connection...\n');
console.log('=' .repeat(60));

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fjvltffpcafcbbpwzyml.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
                    process.env.VITE_SUPABASE_ANON_KEY ||
                    'sb_publishable_1xJsmAztvoDl8Qgz1B9mFg_g_qWGYrT';

console.log('\n1️⃣ Configuration Check');
console.log('-'.repeat(60));
console.log(`URL: ${supabaseUrl}`);
console.log(`Key Format: ${supabaseKey.substring(0, 20)}...`);

// Detect key format
const isNewFormat = supabaseKey.startsWith('sb_publishable_');
const isLegacyFormat = supabaseKey.startsWith('eyJ');

if (isNewFormat) {
  console.log('✅ Using NEW publishable key format (October 2025)');
} else if (isLegacyFormat) {
  console.log('⚠️  Using LEGACY JWT key format (being phased out)');
  console.log('   Consider upgrading to new format');
} else {
  console.log('❌ Unknown key format');
}

// Create client
console.log('\n2️⃣ Creating Supabase Client');
console.log('-'.repeat(60));

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

console.log('✅ Client created successfully');

// Test database connection
console.log('\n3️⃣ Testing Database Connection');
console.log('-'.repeat(60));

async function testConnection() {
  try {
    // Try to fetch from a common table
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('⚠️  Table "users" not found, but connection works!');
        console.log('   Create the table in Supabase dashboard');
      } else if (error.code === 'PGRST301') {
        console.log('❌ JWT validation error (PGRST301)');
        console.log('   This is the October 2025 issue - update your key!');
      } else {
        console.log(`❌ Database error: ${error.message}`);
        console.log(`   Code: ${error.code}`);
      }
      return false;
    }
    
    console.log('✅ Database connection successful!');
    console.log(`   Found users table`);
    return true;
  } catch (err) {
    console.log(`❌ Connection failed: ${err.message}`);
    return false;
  }
}

// Test auth system
console.log('\n4️⃣ Testing Authentication System');
console.log('-'.repeat(60));

async function testAuth() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log(`❌ Auth error: ${error.message}`);
      return false;
    }
    
    console.log('✅ Auth system responding');
    console.log(`   Session: ${data.session ? 'Active' : 'No active session (expected)'}`);
    return true;
  } catch (err) {
    console.log(`❌ Auth test failed: ${err.message}`);
    return false;
  }
}

// Run tests
(async () => {
  const dbTest = await testConnection();
  const authTest = await testAuth();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary');
  console.log('-'.repeat(60));
  console.log(`Database Connection: ${dbTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Authentication System: ${authTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Key Format: ${isNewFormat ? '✅ NEW' : '⚠️  LEGACY'}`);
  
  console.log('\n' + '='.repeat(60));
  
  if (dbTest && authTest) {
    console.log('\n✅ All tests passed! Your Supabase connection is working.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Check the errors above.\n');
    console.log('💡 Troubleshooting:');
    console.log('   1. Verify your API key is correct');
    console.log('   2. Check if your Supabase project is active');
    console.log('   3. Ensure RLS policies allow access');
    console.log('   4. See SUPABASE_API_KEY_MIGRATION_2025.md for help\n');
    process.exit(1);
  }
})();

