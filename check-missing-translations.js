/**
 * Utility script to check which translations are missing in Supabase tables
 * Run with: node check-missing-translations.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fjvltffpcafcbbpwzyml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdmx0ZmZwY2FmY2JicHd6eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MjUxNTQsImV4cCI6MjA1ODAwMTE1NH0.uuhJLxTJL26r2jfD9Cb5IMKYaScDNsJeHYJue4pfWRk';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

// Languages to check
const LANGUAGES = ['en', 'ru', 'es', 'fr', 'de', 'it', 'ar', 'ch', 'ja', 'tr'];

// Language names for display
const LANGUAGE_NAMES = {
  'en': 'English',
  'ru': 'Russian',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'ar': 'Arabic',
  'ch': 'Chinese',
  'ja': 'Japanese',
  'tr': 'Turkish'
};

/**
 * Check missing translations in a specific table
 */
async function checkTable(tableName) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Checking table: ${tableName}`);
    console.log('='.repeat(60));

    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) {
      console.error(`❌ Error fetching ${tableName}:`, error.message);
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`⚠️  Table ${tableName} is empty`);
      return null;
    }

    console.log(`📊 Total rows: ${data.length}`);
    console.log('');

    const results = {};

    // Check each language
    for (const lang of LANGUAGES) {
      const textColumn = `${lang}_text`;
      let missing = 0;
      let present = 0;

      for (const row of data) {
        if (!row[textColumn] || row[textColumn].trim() === '') {
          missing++;
        } else {
          present++;
        }
      }

      const coverage = data.length > 0 
        ? ((present / data.length) * 100).toFixed(1)
        : 0;

      results[lang] = {
        missing,
        present,
        coverage,
        total: data.length
      };

      // Display result
      const icon = missing === 0 ? '✅' : missing < data.length / 2 ? '⚠️' : '❌';
      const langName = LANGUAGE_NAMES[lang].padEnd(10);
      console.log(
        `${icon} ${langName}: ${present}/${data.length} (${coverage}% coverage) - ${missing} missing`
      );
    }

    // Check transliterations for Russian speakers (common case)
    console.log('\n📝 Transliterations (to Russian letters):');
    for (const lang of LANGUAGES) {
      if (lang === 'ru') continue; // Skip Russian itself
      
      const translitColumn = `${lang}_text_ru`;
      let missing = 0;
      let present = 0;

      for (const row of data) {
        if (!row[translitColumn] || row[translitColumn].trim() === '') {
          missing++;
        } else {
          present++;
        }
      }

      const coverage = data.length > 0 
        ? ((present / data.length) * 100).toFixed(1)
        : 0;

      const icon = missing === 0 ? '✅' : missing < data.length / 2 ? '⚠️' : '❌';
      const langName = LANGUAGE_NAMES[lang].padEnd(10);
      console.log(
        `${icon} ${langName} → RU: ${present}/${data.length} (${coverage}% coverage) - ${missing} missing`
      );
    }

    return results;
  } catch (error) {
    console.error(`❌ Error checking ${tableName}:`, error.message);
    return null;
  }
}

/**
 * Check all scenario tables
 */
async function checkAllScenarios() {
  console.log('\n');
  console.log('🌍 CHECKING ALL SCENARIO TABLES');
  console.log('='.repeat(60));

  const allResults = {};

  for (let i = 1; i <= 30; i++) {
    const tableName = `scenario_${i}`;
    const results = await checkTable(tableName);
    if (results) {
      allResults[tableName] = results;
    }
  }

  return allResults;
}

/**
 * Check all phrases tables
 */
async function checkAllPhrases() {
  console.log('\n');
  console.log('💬 CHECKING ALL PHRASES TABLES');
  console.log('='.repeat(60));

  const allResults = {};

  for (let i = 1; i <= 30; i++) {
    const tableName = `phrases_${i}`;
    const results = await checkTable(tableName);
    if (results) {
      allResults[tableName] = results;
    }
  }

  return allResults;
}

/**
 * Generate summary report
 */
function generateSummary(scenarioResults, phrasesResults) {
  console.log('\n');
  console.log('📊 SUMMARY REPORT');
  console.log('='.repeat(60));

  // Count tables by coverage
  const categorize = (results) => {
    const categories = {
      complete: [],
      partial: [],
      missing: []
    };

    for (const [table, langResults] of Object.entries(results)) {
      for (const [lang, stats] of Object.entries(langResults)) {
        const coverage = parseFloat(stats.coverage);
        const key = `${table}:${lang}`;
        
        if (coverage === 100) {
          categories.complete.push(key);
        } else if (coverage > 0) {
          categories.partial.push({ key, coverage });
        } else {
          categories.missing.push(key);
        }
      }
    }

    return categories;
  };

  const scenarioCategories = categorize(scenarioResults);
  const phrasesCategories = categorize(phrasesResults);

  console.log('\n🎯 SCENARIO TABLES:');
  console.log(`  ✅ Complete: ${scenarioCategories.complete.length} language entries`);
  console.log(`  ⚠️  Partial: ${scenarioCategories.partial.length} language entries`);
  console.log(`  ❌ Missing: ${scenarioCategories.missing.length} language entries`);

  console.log('\n💬 PHRASES TABLES:');
  console.log(`  ✅ Complete: ${phrasesCategories.complete.length} language entries`);
  console.log(`  ⚠️  Partial: ${phrasesCategories.partial.length} language entries`);
  console.log(`  ❌ Missing: ${phrasesCategories.missing.length} language entries`);

  // Show which languages need the most work
  console.log('\n🔧 LANGUAGES NEEDING MOST TRANSLATIONS:');
  
  const langStats = {};
  for (const lang of LANGUAGES) {
    langStats[lang] = { missing: 0, total: 0 };
  }

  // Count missing across all tables
  for (const results of [scenarioResults, phrasesResults]) {
    for (const langResults of Object.values(results)) {
      for (const [lang, stats] of Object.entries(langResults)) {
        langStats[lang].missing += stats.missing;
        langStats[lang].total += stats.total;
      }
    }
  }

  // Sort by most missing
  const sortedLangs = Object.entries(langStats)
    .sort((a, b) => b[1].missing - a[1].missing)
    .slice(0, 5);

  sortedLangs.forEach(([lang, stats]) => {
    const coverage = ((1 - stats.missing / stats.total) * 100).toFixed(1);
    console.log(`  ${LANGUAGE_NAMES[lang]}: ${stats.missing} missing (${coverage}% coverage)`);
  });

  console.log('\n💡 RECOMMENDATION:');
  console.log('   The AI fallback system will automatically translate missing content.');
  console.log('   Focus on adding translations for the top missing languages to reduce');
  console.log('   AI API calls and improve performance.');
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Translation Coverage Checker');
  console.log('================================\n');
  console.log('This script checks which translations are missing in your Supabase tables.');
  console.log('The AI fallback system will automatically handle missing translations.');
  console.log('');

  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === '--table') {
    // Check specific table
    const tableName = args[1];
    if (!tableName) {
      console.error('❌ Please specify a table name: --table scenario_1');
      process.exit(1);
    }
    await checkTable(tableName);
  } else if (args.length > 0 && args[0] === '--scenarios') {
    // Check only scenarios
    await checkAllScenarios();
  } else if (args.length > 0 && args[0] === '--phrases') {
    // Check only phrases
    await checkAllPhrases();
  } else {
    // Check everything
    const scenarioResults = await checkAllScenarios();
    const phrasesResults = await checkAllPhrases();
    generateSummary(scenarioResults, phrasesResults);
  }

  console.log('\n✨ Check complete!\n');
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

