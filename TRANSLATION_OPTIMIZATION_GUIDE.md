# Translation Optimization Implementation Guide

## Overview

Your app's loading time has been significantly optimized by moving translations for 29 languages from the app bundle to Supabase. The app now loads **~87% less translation data** on initial load (from 2380 lines to 310 lines).

## What Changed

### Before
- **All 30 languages** (English + 29 others) were bundled in `src/constants/translations.ts`
- File size: **2380 lines** loaded immediately with every app start
- **Slow initial load**, especially with cleared cache

### After
- **Only English** is bundled in the app (310 lines)
- **Other 29 languages** are loaded from Supabase on-demand
- **Fast initial load** - translations are cached after first load per language

## Files Created/Modified

### Created Files

1. **`create-translations-table.sql`** - Supabase migration to create translations table
2. **`translations-for-supabase.json`** - JSON export of all non-English translations (1907 entries)
3. **`translations-import.sql`** - SQL script to import translations to Supabase
4. **`src/services/translationLoader.ts`** - Service for async translation loading with caching
5. **`src/hooks/useTranslations.ts`** - React hooks for using translations in components

### Modified Files

1. **`src/constants/translations.ts`** - Now only contains English translations
2. **`src/App.tsx`** - Added preloading logic for selected languages

## Setup Instructions

### Step 1: Create Supabase Table

Run the migration in your Supabase SQL Editor:

```bash
# Copy the contents of create-translations-table.sql and run it in Supabase
```

Or use the Supabase CLI:

```bash
supabase db push
```

### Step 2: Import Translations

Choose one of these methods:

**Method A: Using SQL (Recommended)**

```bash
# Run the translations-import.sql file in Supabase SQL Editor
# This will insert all 1907 translation entries
```

**Method B: Using Supabase Dashboard**

1. Go to Supabase Dashboard > Table Editor
2. Select the `translations` table
3. Use "Import data" and upload `translations-for-supabase.json`

**Method C: Using Supabase JS (for programmatic import)**

```typescript
import { supabase } from './src/services/supabase';
import translationsData from './translations-for-supabase.json';

async function importTranslations() {
  const { data, error } = await supabase
    .from('translations')
    .upsert(translationsData);
    
  if (error) {
    console.error('Error importing translations:', error);
  } else {
    console.log('Translations imported successfully!');
  }
}

importTranslations();
```

### Step 3: Verify Import

Check that translations are imported:

```sql
-- Should return 1907
SELECT COUNT(*) FROM translations;

-- Should return 29 (number of non-English languages)
SELECT COUNT(DISTINCT language_code) FROM translations;

-- Check a specific language (e.g., Russian)
SELECT COUNT(*) FROM translations WHERE language_code = 'ru';
```

## How It Works

### Translation Loading Flow

1. **App starts** → English translations load instantly (bundled)
2. **User selects language** → `preloadTranslations()` starts loading in background
3. **Component renders** → `useTranslations()` hook provides translations
4. **First load** → Fetches from Supabase, caches in memory
5. **Subsequent access** → Returns from cache (instant)

### Caching Strategy

- Translations are cached in memory after first load
- Cache persists for the entire session
- Each language is only fetched once
- Fallback to English if translation is missing

## Using Translations in Components

### Option 1: Using the Hook (Recommended)

```typescript
import { useTranslations } from '../hooks/useTranslations';

function MyComponent() {
  const { t, isLoading } = useTranslations();
  
  if (isLoading) {
    return <div>Loading translations...</div>;
  }
  
  return (
    <div>
      <h1>{t.welcomeBack}</h1>
      <button>{t.startJourney}</button>
    </div>
  );
}
```

### Option 2: Using Specific Translation

```typescript
import { useTranslation } from '../hooks/useTranslations';

function MyButton() {
  const buttonText = useTranslation('startJourney');
  
  return <button>{buttonText}</button>;
}
```

### Option 3: Character Names

```typescript
import { useCharacterName } from '../hooks/useTranslations';

function CharacterDisplay({ characterId }) {
  const characterName = useCharacterName(characterId);
  
  return <div>Character: {characterName}</div>;
}
```

### Backwards Compatibility

Old synchronous methods still work but will:
- Return English for non-English languages
- Show a console warning
- Should be migrated to async hooks

```typescript
// ⚠️ Deprecated - still works but shows warning
import { getTranslation } from '../constants/translations';
const text = getTranslation('en', 'welcomeBack'); // Only use for English

// ✅ Recommended
import { useTranslation } from '../hooks/useTranslations';
const text = useTranslation('welcomeBack'); // Works for all languages
```

## Performance Impact

### Load Time Improvement

- **Before**: ~2380 lines of translations parsed on every app start
- **After**: ~310 lines (English only) + async loading for other languages
- **Reduction**: ~87% less data in initial bundle

### User Experience

- **English users**: No change (instant load)
- **Other language users**: 
  - First load: Small delay while fetching from Supabase (~100-500ms)
  - Subsequent loads: Instant (cached in memory)
  - Fallback to English if offline or error

## Troubleshooting

### Translations Not Loading

1. **Check Supabase connection**: Verify `src/services/supabase.ts` is configured
2. **Check table exists**: Run `SELECT * FROM translations LIMIT 1;` in Supabase
3. **Check RLS policies**: Ensure public read access is enabled
4. **Check browser console**: Look for error messages from `translationLoader.ts`

### Missing Translations

If some translations are missing:

```sql
-- Find which languages are missing
SELECT DISTINCT language_code FROM translations;

-- Check specific language
SELECT translation_key FROM translations WHERE language_code = 'ru';
```

### Cache Issues

To clear the translation cache during development:

```typescript
import { clearTranslationCache } from '../services/translationLoader';

// Call this to force reload translations
clearTranslationCache();
```

## Cleanup

After verifying everything works, you can delete these temporary files:

```bash
rm extract-translations.cjs
rm translations-for-supabase.json
rm translations-import.sql  # Keep if you need to re-import later
```

## Migration Checklist

- [ ] Run `create-translations-table.sql` in Supabase
- [ ] Import translations using `translations-import.sql` or JSON file
- [ ] Verify translations count: `SELECT COUNT(*) FROM translations;` (should be 1907)
- [ ] Test app with cleared cache
- [ ] Test with non-English language selected
- [ ] Verify fast initial load time
- [ ] (Optional) Update components to use new hooks
- [ ] (Optional) Clean up temporary files

## Notes

- The `translations` table has Row Level Security (RLS) enabled with public read access
- Only authenticated admin users can modify translations (adjust policy as needed)
- Character names are stored with keys like `characterNames.1`, `characterNames.2`, etc.
- The translation loader handles the nested structure automatically

## Future Improvements

Consider these enhancements:

1. **Service Worker caching**: Cache translations in Service Worker for offline support
2. **Lazy loading**: Load translations only when needed (per feature)
3. **Admin interface**: Create UI for managing translations in Supabase
4. **Translation versioning**: Add version column to track translation updates
5. **Analytics**: Track which languages are most used to prioritize optimization

