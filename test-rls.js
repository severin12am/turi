const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Validate environment configuration
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLS() {
  console.log('🔍 Testing RLS Policies...\n');
  
  // Test 1: Check current session
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  console.log('1. Current Session:');
  console.log('   User ID:', session?.session?.user?.id || 'NO SESSION');
  console.log('   Email:', session?.session?.user?.email || 'NO EMAIL');
  console.log('   Error:', sessionError?.message || 'None');
  console.log('');
  
  // Test 2: Try to read language_levels without auth
  console.log('2. Testing language_levels access (no auth):');
  const { data: noAuthData, error: noAuthError } = await supabase
    .from('language_levels')
    .select('*')
    .limit(1);
  console.log('   Data:', noAuthData?.length || 0, 'rows');
  console.log('   Error:', noAuthError?.message || 'None');
  console.log('');
  
  // Test 3: Try to sign in the user
  console.log('3. Attempting to sign in user...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'marksew@yandex.ru',
    password: 'test123456'
  });
  console.log('   Sign in success:', !!signInData.user);
  console.log('   User ID after sign in:', signInData.user?.id || 'None');
  console.log('   Error:', signInError?.message || 'None');
  console.log('');
  
  // Test 4: Try to read language_levels with auth
  if (signInData.user) {
    console.log('4. Testing language_levels access (with auth):');
    const { data: authData, error: authError } = await supabase
      .from('language_levels')
      .select('*')
      .eq('user_id', signInData.user.id);
    console.log('   Data:', authData?.length || 0, 'rows');
    console.log('   Error:', authError?.message || 'None');
    console.log('');
    
    // Test 5: Try to insert a language level
    console.log('5. Testing language_levels insert:');
    const { data: insertData, error: insertError } = await supabase
      .from('language_levels')
      .insert([{
        user_id: signInData.user.id,
        target_language: 'ru',
        mother_language: 'en',
        level: 1,
        word_progress: 3,
        dialogue_number: 1
      }])
      .select();
    console.log('   Insert success:', !!insertData?.length);
    console.log('   Error:', insertError?.message || 'None');
  }
}

testRLS().catch(console.error); 