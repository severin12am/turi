// Diagnostic script to help debug login and dialogue loading issues
// Run this in the browser console when experiencing issues

console.log('🔍 Starting Turi App Diagnostics...\n');

// 1. Check Supabase Configuration
console.group('1️⃣ Supabase Configuration');
try {
  const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL || 'Using fallback URL';
  const hasAnonKey = !!import.meta?.env?.VITE_SUPABASE_ANON_KEY;
  console.log('Supabase URL:', supabaseUrl);
  console.log('Has Anon Key:', hasAnonKey ? '✅ Yes' : '❌ No (using fallback)');
} catch (e) {
  console.log('⚠️ Cannot check env vars (expected in production)');
}
console.groupEnd();

// 2. Check LocalStorage
console.group('2️⃣ LocalStorage Data');
const turiUser = localStorage.getItem('turi_user');
const authToken = localStorage.getItem('turi-auth-token');
const anonymousUser = localStorage.getItem('turi_anonymous_user');

console.log('User Data:', turiUser ? '✅ Found' : '❌ Not found');
if (turiUser) {
  try {
    const userData = JSON.parse(turiUser);
    console.log('  - User ID:', userData.id);
    console.log('  - Email:', userData.email);
    console.log('  - Languages:', userData.mother_language, '→', userData.target_language);
  } catch (e) {
    console.error('  - Error parsing user data:', e);
  }
}

console.log('Auth Token:', authToken ? '✅ Found' : '❌ Not found');
console.log('Anonymous User:', anonymousUser ? '✅ Found' : '❌ Not found');
console.groupEnd();

// 3. Check Network Requests
console.group('3️⃣ Network Check');
console.log('Open Network tab and filter by:');
console.log('  - "supabase.co" - to see all Supabase API calls');
console.log('  - Status codes: 400, 401, 403, 500 - to see errors');
console.log('\nCommon issues:');
console.log('  - 401: Authentication failed (check credentials)');
console.log('  - 403: Forbidden (check RLS policies)');
console.log('  - 404: Resource not found (check table names)');
console.log('  - CORS errors: Supabase project settings');
console.groupEnd();

// 4. Check Database Tables
console.group('4️⃣ Database Tables to Verify');
console.log('Required tables in Supabase:');
console.log('  - users');
console.log('  - language_levels');
console.log('  - user_progress');
console.log('  - phrases_1, phrases_2, ... phrases_30');
console.log('  - words_quiz');
console.log('\nVerify these exist in your Supabase project.');
console.groupEnd();

// 5. Check Console Errors
console.group('5️⃣ Console Error Check');
console.log('Look for errors containing:');
console.log('  - "Error fetching dialogues"');
console.log('  - "Error logging in"');
console.log('  - "Supabase auth"');
console.log('  - "Failed to fetch"');
console.log('  - CORS policy errors');
console.groupEnd();

// 6. Quick Tests
console.group('6️⃣ Quick Tests');
console.log('Run these in console:');
console.log('\n// Test if window has access to app state:');
console.log('window.useStore?.getState()');
console.log('\n// Check session state:');
console.log('window.debugSession()');
console.log('\n// Refresh session:');
console.log('window.refreshSession()');
console.groupEnd();

console.log('\n✅ Diagnostics complete. Check the groups above for issues.\n');
console.log('📝 Next steps:');
console.log('1. Check Network tab for failed requests');
console.log('2. Try logging in and note any error messages');
console.log('3. Check if tables exist in Supabase dashboard');
console.log('4. Verify RLS policies are configured correctly');

