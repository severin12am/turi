// Script to extract non-English translations from translations.ts
// and prepare them for Supabase import

const fs = require('fs');
const path = require('path');

// Read the translations file
const translationsPath = path.join(__dirname, 'src', 'constants', 'translations.ts');
const content = fs.readFileSync(translationsPath, 'utf8');

// Extract the translations object
const startIdx = content.indexOf('export const translations');
const endIdx = content.lastIndexOf('};') + 2;
const translationsCode = content.substring(startIdx, endIdx);

// Write to a temporary file and require it (after some modifications)
const tempFile = path.join(__dirname, 'temp-translations.js');

// Convert TypeScript to JavaScript
let jsCode = translationsCode
  .replace('export const translations: Partial<Record<SupportedLanguage, TranslationStrings>> & Record<\'en\' | \'ru\', TranslationStrings> = ', 'module.exports = ')
  .replace(/: TranslationStrings/g, '')
  .replace(/: Partial<Record<SupportedLanguage, TranslationStrings>>/g, '');

fs.writeFileSync(tempFile, jsCode);

// Load the translations
const translations = require('./temp-translations.js');

// Clean up temp file
fs.unlinkSync(tempFile);

// Prepare data for Supabase
const supabaseData = [];

// List of all languages except English
const languages = Object.keys(translations).filter(lang => lang !== 'en');

console.log(`Found ${languages.length} non-English languages to extract`);

// Flatten translations for each language
languages.forEach(language => {
  const langTranslations = translations[language];
  
  Object.keys(langTranslations).forEach(key => {
    const value = langTranslations[key];
    
    // Handle nested characterNames
    if (key === 'characterNames' && typeof value === 'object') {
      Object.keys(value).forEach(characterId => {
        supabaseData.push({
          language_code: language,
          translation_key: `characterNames.${characterId}`,
          translation_value: value[characterId]
        });
      });
    } else if (typeof value === 'string') {
      supabaseData.push({
        language_code: language,
        translation_key: key,
        translation_value: value
      });
    }
  });
});

console.log(`Extracted ${supabaseData.length} translation entries`);

// Write to JSON file
const outputPath = path.join(__dirname, 'translations-for-supabase.json');
fs.writeFileSync(outputPath, JSON.stringify(supabaseData, null, 2));

console.log(`\nTranslations exported to: ${outputPath}`);
console.log(`\nTo import to Supabase, you can:`);
console.log(`1. Use the Supabase Dashboard to import this JSON file`);
console.log(`2. Or use the generated SQL file: translations-import.sql`);

// Also generate SQL insert statements
const sqlPath = path.join(__dirname, 'translations-import.sql');
let sql = '-- Import translations to Supabase\n\n';

supabaseData.forEach(row => {
  const escapedValue = row.translation_value.replace(/'/g, "''");
  sql += `INSERT INTO translations (language_code, translation_key, translation_value) VALUES ('${row.language_code}', '${row.translation_key}', '${escapedValue}') ON CONFLICT (language_code, translation_key) DO UPDATE SET translation_value = EXCLUDED.translation_value;\n`;
});

fs.writeFileSync(sqlPath, sql);
console.log(`SQL import file generated: ${sqlPath}`);

