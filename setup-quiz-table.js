/**
 * Quiz Table Setup & Verification Script
 * 
 * This script helps you:
 * 1. Verify the quiz table structure
 * 2. Check if data exists
 * 3. Get sample data to verify columns
 * 
 * Usage: node setup-quiz-table.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.log('Make sure .env contains:');
  console.log('  VITE_SUPABASE_URL');
  console.log('  VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuizTable() {
  console.log('\n🔍 Checking quiz table...\n');

  try {
    // Check if table exists and get row count
    const { data: allRows, error: countError, count } = await supabase
      .from('quiz')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error accessing quiz table:', countError.message);
      console.log('\n📋 You need to create the quiz table in Supabase:');
      console.log(`
CREATE TABLE quiz (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  spanish TEXT,
  english TEXT,
  russian TEXT,
  french TEXT,
  german TEXT,
  italian TEXT,
  portuguese TEXT,
  arabic TEXT,
  chinese TEXT,
  japanese TEXT,
  turkish TEXT
);
      `);
      return;
    }

    console.log(`✅ Quiz table exists with ${count} rows`);

    // Get a few sample rows
    const { data: samples, error: sampleError } = await supabase
      .from('quiz')
      .select('*')
      .limit(5);

    if (sampleError) {
      console.error('❌ Error fetching samples:', sampleError.message);
      return;
    }

    if (!samples || samples.length === 0) {
      console.log('\n⚠️  Quiz table is empty!');
      console.log('You need to populate it with common words.');
      console.log('\nExample data structure:');
      console.log(JSON.stringify({
        id: 1,
        spanish: 'hola',
        english: 'hello',
        russian: 'привет',
        french: 'bonjour',
        german: 'hallo'
      }, null, 2));
      return;
    }

    console.log('\n📊 Sample data from quiz table:\n');
    samples.forEach((row, i) => {
      console.log(`Row ${i + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Spanish: ${row.spanish || '(empty)'}`);
      console.log(`  English: ${row.english || '(empty)'}`);
      console.log(`  Russian: ${row.russian || '(empty)'}`);
      console.log(`  French: ${row.french || '(empty)'}`);
      console.log('');
    });

    // Check for nulls/empties in key columns
    const { data: nullCheck } = await supabase
      .from('quiz')
      .select('id')
      .or('spanish.is.null,english.is.null');

    if (nullCheck && nullCheck.length > 0) {
      console.log(`⚠️  Found ${nullCheck.length} rows with missing Spanish or English translations`);
    } else {
      console.log('✅ All rows have Spanish and English translations');
    }

    // Test word matching (simulating scenario quiz)
    console.log('\n🧪 Testing word matching...\n');
    const testWords = ['hola', 'casa', 'mundo', 'comer', 'agua', 'tiempo'];
    
    const { data: matches, error: matchError } = await supabase
      .from('quiz')
      .select('*')
      .in('spanish', testWords)
      .limit(5);

    if (matchError) {
      console.error('❌ Error testing matches:', matchError.message);
      return;
    }

    console.log(`Testing with words: ${testWords.join(', ')}`);
    console.log(`✅ Found ${matches?.length || 0} matches in quiz table`);
    
    if (matches && matches.length > 0) {
      console.log('\nMatched words:');
      matches.forEach(m => {
        console.log(`  - ${m.spanish} (${m.english})`);
      });
    } else {
      console.log('⚠️  No matches found. Your quiz table might not have common Spanish words yet.');
    }

    console.log('\n✅ Quiz table check complete!\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

async function showTableSchema() {
  console.log('\n📋 Expected Quiz Table Schema:\n');
  console.log('Column Name       | Type   | Purpose');
  console.log('------------------|--------|---------------------------');
  console.log('id                | BIGINT | Primary key (auto)');
  console.log('spanish           | TEXT   | Spanish word');
  console.log('english           | TEXT   | English translation');
  console.log('russian           | TEXT   | Russian translation');
  console.log('french            | TEXT   | French translation');
  console.log('german            | TEXT   | German translation');
  console.log('italian           | TEXT   | Italian translation');
  console.log('portuguese        | TEXT   | Portuguese translation');
  console.log('arabic            | TEXT   | Arabic translation');
  console.log('chinese           | TEXT   | Chinese translation');
  console.log('japanese          | TEXT   | Japanese translation');
  console.log('turkish           | TEXT   | Turkish translation');
  console.log('');
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Quiz Table Setup & Verification');
  console.log('═══════════════════════════════════════');
  
  await showTableSchema();
  await checkQuizTable();
  
  console.log('═══════════════════════════════════════\n');
}

main().catch(console.error);

