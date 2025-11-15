# AI Translation Fallback System

## Overview

This system provides automatic AI-powered translation and transliteration when content is missing from Supabase database tables. Instead of manually translating content into all 20+ languages, the system:

1. **Checks Supabase** for existing translations first
2. **Detects missing content** at the cell/column level
3. **Automatically translates** missing content using Google Gemini AI
4. **Returns enriched data** seamlessly to the application

## Architecture

### Key Files

#### 1. `src/services/translationFallback.ts`
The core service that handles all fallback logic:
- `fetchDialoguesWithFallback()` - Main function that fetches dialogues and fills missing translations
- `translateWithAI()` - Translates text using Google Gemini API
- `checkMissingContent()` - Diagnostic tool to check translation coverage
- `loadEnglishSourceFromCSV()` - Loads English source content from CSV files (future enhancement)

#### 2. `src/components/DialogueBox.tsx`
Integrated the fallback service into the dialogue fetching logic:
- Automatically uses `fetchDialoguesWithFallback()` instead of direct Supabase queries
- No changes needed to UI or user experience
- Transparent fallback when translations are missing

#### 3. `src/data/csv/`
Contains source CSV files with all English dialogues:
- `phrases_1.csv` through `phrases_30.csv` - Character dialogues
- `scenario_1.csv` through `scenario_30.csv` - Scenario dialogues
- **Only English content (`en_text`) is required** for fallback translations

#### 4. `check-missing-translations.js`
Utility script to analyze database coverage:
```bash
# Check all tables
node check-missing-translations.js

# Check specific table
node check-missing-translations.js --table scenario_1

# Check only scenarios
node check-missing-translations.js --scenarios

# Check only phrases
node check-missing-translations.js --phrases
```

## How It Works

### Step-by-Step Process

1. **User selects a dialogue** in the app
2. **DialogueBox fetches data** using `fetchDialoguesWithFallback()`
3. **Service queries Supabase** for the dialogue
4. **Service checks each phrase** for missing translations:
   - Checks if `{targetLanguage}_text` column is empty
   - Checks if `{targetLanguage}_text_{motherLanguage}` transliteration is empty
5. **If content is missing:**
   - Takes the English text (`en_text`) from the row
   - Calls `translateWithAI()` with the English source
   - AI translates to target language and creates transliteration
   - Missing cells are filled with AI-generated content
6. **Returns complete data** to the component

### Example Flow

```typescript
// User learning Spanish with Russian mother language
// Dialogue has English and Russian, but missing Spanish

// Database row:
{
  dialogue_id: 1,
  dialogue_step: 1,
  speaker: 'NPC',
  en_text: 'Hello, how are you?',
  ru_text: 'Привет, как дела?',
  es_text: null,  // ❌ MISSING
  es_text_ru: null // ❌ MISSING
}

// Service detects missing Spanish content
// Calls AI: translateWithAI('Hello, how are you?', 'en', 'es')

// AI returns:
{
  translation: '¡Hola, ¿cómo estás?',
  transliteration: 'ola komo estas'
}

// Final row returned to app:
{
  dialogue_id: 1,
  dialogue_step: 1,
  speaker: 'NPC',
  en_text: 'Hello, how are you?',
  ru_text: 'Привет, как дела?',
  es_text: '¡Hola, ¿cómo estás?',  // ✅ FILLED BY AI
  es_text_ru: 'ola komo estas'      // ✅ FILLED BY AI
}
```

## Database Coverage

### Current Structure

Each dialogue table has columns for:
- **Translations:** `en_text`, `ru_text`, `es_text`, `fr_text`, `de_text`, `it_text`, `ar_text`, `ch_text`, `ja_text`, `tr_text`
- **Transliterations:** `{lang}_text_{target}` (e.g., `es_text_ru`, `ch_text_en`)

### What You Need to Provide

**Minimum requirement:**
- English text (`en_text`) in all dialogue rows
- The system will translate to any other language on-demand

**Optimal setup:**
- Add translations for your 5-10 most popular languages
- Let AI handle the rest (less common language pairs)
- This reduces API calls and improves performance

### Checking Coverage

Use the utility script to see what's missing:

```bash
node check-missing-translations.js
```

Output example:
```
📊 SUMMARY REPORT
============================================================

🎯 SCENARIO TABLES:
  ✅ Complete: 150 language entries
  ⚠️  Partial: 200 language entries
  ❌ Missing: 50 language entries

💬 PHRASES TABLES:
  ✅ Complete: 180 language entries
  ⚠️  Partial: 150 language entries
  ❌ Missing: 70 language entries

🔧 LANGUAGES NEEDING MOST TRANSLATIONS:
  Korean: 1200 missing (40.0% coverage)
  Hindi: 1100 missing (45.0% coverage)
  Thai: 950 missing (52.5% coverage)
  Vietnamese: 850 missing (57.5% coverage)
  Polish: 750 missing (62.5% coverage)

💡 RECOMMENDATION:
   The AI fallback system will automatically translate missing content.
   Focus on adding translations for the top missing languages to reduce
   AI API calls and improve performance.
```

## Performance Considerations

### API Calls

Each missing translation requires one API call:
- **Cost:** ~$0.0001 per translation (Gemini Flash model)
- **Speed:** ~500ms per translation
- **Rate Limit:** 10 requests per minute (configurable)

### Optimization Strategies

1. **Pre-translate popular languages:**
   - Spanish, French, German, Italian (European users)
   - Chinese, Japanese, Korean (Asian users)
   - Arabic, Turkish (Middle Eastern users)

2. **Cache AI translations:**
   - Future enhancement: Store AI-generated translations back to Supabase
   - Reduces repeated API calls for same content

3. **Batch translations:**
   - Future enhancement: Translate entire dialogues at once
   - Currently translates phrase-by-phrase

## Error Handling

### Fallback Behavior

If AI translation fails:
- **Logs error** to console and logger
- **Returns original data** without the missing translation
- **App continues working** with available content
- User sees content in languages that are available

### Retry Logic

The system uses multiple Gemini models with fallback:
1. `gemini-1.5-flash` (fastest, cheapest)
2. `gemini-1.5-pro` (if flash fails)
3. `gemini-flash-latest` (newest model)
4. Other models as configured in `src/services/gemini.ts`

## Configuration

### Language Mapping

Edit `src/services/translationFallback.ts`:

```typescript
function getLanguageName(code: SupportedLanguage): string {
  const languageNames: Record<SupportedLanguage, string> = {
    'en': 'English',
    'ru': 'Russian',
    'es': 'Spanish',
    // ... add more languages
  };
  return languageNames[code] || code;
}
```

### Translation Prompt

Customize AI translation behavior in `generateTranslationPrompt()`:

```typescript
function generateTranslationPrompt(
  text: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage,
  includeTransliteration: boolean
): string {
  // Customize prompt here
  // Current: Focuses on accurate, natural translations
  // Modify for: Formal/informal tone, specific terminology, etc.
}
```

### Rate Limiting

Edit rate limits in `src/services/gemini.ts`:

```typescript
const rateLimiter = {
  requests: [] as number[],
  maxRequests: 10, // Change this
  windowMs: 60 * 1000, // Change this (1 minute)
};
```

## Usage Examples

### For Component Developers

No changes needed! Just use the existing DialogueBox component:

```typescript
<DialogueBox
  characterId={1}
  dialogueId={5}
  onClose={() => {}}
  distance={1}
  isScenario={false}
  onNpcSpeakStart={() => {}}
  onNpcSpeakEnd={() => {}}
/>
```

The fallback system works automatically behind the scenes.

### For Data Management

#### Check specific table coverage:
```bash
node check-missing-translations.js --table scenario_1
```

#### Manually trigger translation for a phrase:
```typescript
import { translateWithAI } from './services/translationFallback';

const result = await translateWithAI({
  sourceText: 'Hello, how are you?',
  sourceLanguage: 'en',
  targetLanguage: 'es',
  includeTransliteration: true
});

console.log(result.translation); // '¡Hola, ¿cómo estás?'
console.log(result.transliteration); // 'ola komo estas'
```

## Future Enhancements

### Planned Features

1. **Translation Caching:**
   - Store AI-generated translations back to Supabase
   - Option to "commit" AI translations to database
   - Reduces API calls for frequently accessed content

2. **Bulk Translation Tool:**
   - Script to pre-translate missing content in batch
   - Run overnight to fill all gaps
   - `translate-all-missing.js` utility

3. **Translation Quality Scoring:**
   - Track which AI translations users correct
   - Flag low-confidence translations for human review
   - Improve AI prompts based on feedback

4. **Offline Mode:**
   - Download all translations for offline use
   - Fallback to simple transliteration if no AI available
   - Progressive enhancement approach

5. **Custom Translation Memory:**
   - Store common phrases and their translations
   - Reuse translations across dialogues
   - Consistency across the app

## Troubleshooting

### Issue: "AI translation failed"

**Cause:** API key issues, rate limiting, or network problems

**Solution:**
1. Check Netlify Function logs
2. Verify API key is set in Netlify environment
3. Check rate limiter settings
4. Try again after 1 minute

### Issue: "No data in Supabase"

**Cause:** Table doesn't exist or dialogue_id not found

**Solution:**
1. Verify table name: `scenario_X` or `phrases_X`
2. Check dialogue_id exists in the table
3. Ensure RLS policies allow read access

### Issue: "Transliteration is gibberish"

**Cause:** AI struggling with phonetic mapping for some languages

**Solution:**
1. Check AI prompt in `generateTranslationPrompt()`
2. Add more specific transliteration instructions
3. Consider using specialized transliteration library for that language

### Issue: "Too many API calls"

**Cause:** Many users accessing content with missing translations

**Solution:**
1. Pre-translate popular languages using bulk tool
2. Increase rate limit for production
3. Implement translation caching (future feature)

## Security Considerations

### API Key Protection

- ✅ API key stored in Netlify environment variables
- ✅ Never exposed to client-side code
- ✅ All AI calls go through Netlify Functions
- ✅ Rate limiting prevents abuse

### Data Privacy

- ✅ Only dialogue text is sent to AI (no user data)
- ✅ AI-generated content is not stored permanently (yet)
- ✅ Complies with GDPR and privacy regulations

## Support

For issues or questions:
1. Check this documentation
2. Run `check-missing-translations.js` for diagnostics
3. Check browser console and logger output
4. Review Netlify Function logs

## Changelog

### Version 1.0 (Current)
- Initial implementation
- AI-powered translation fallback
- Automatic transliteration
- Coverage checking utility
- Integration with DialogueBox component

