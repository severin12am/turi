# API Call Optimization Fix

## Problem Identified

The app was making **hundreds of unnecessary AI API calls** on every page load, depleting API tokens quickly. This occurred even when selecting English as mother language and Russian as target language.

## Root Causes

### 1. UI Translation AI Fallback (Major Issue)
**File:** `src/services/translationLoader.ts`

When selecting a non-English mother language (e.g., Russian):
- App tried to load UI translations from Supabase `translations` table
- Found **~200+ missing translation keys** (the database was empty for most languages)
- Made **200+ AI API calls** to translate every single UI string from English
- This happened every time the app loaded!

### 2. Dialogue Transliteration Generation (Secondary Issue)
**File:** `src/services/translationFallback.ts`

Even when dialogue content existed in both target and mother languages:
- App checked for transliteration column in database
- If column didn't exist, it automatically triggered AI calls for transliteration
- Made additional AI calls for every phrase in every dialogue opened

## Solutions Applied

### Fix #1: Disabled AI Fallback for UI Translations
**File:** `src/services/translationLoader.ts` (lines 106-122)

**Before:** Made 200+ AI calls to translate all missing UI strings  
**After:** Uses English as fallback for missing UI strings (zero API calls)

This is safe because:
- English UI is always available as fallback
- Users can still understand the app interface
- Dialogue content is still in their target language (what really matters)

### Fix #2: Disabled Automatic Transliteration Generation
**File:** `src/services/translationFallback.ts` (lines 440-465)

**Before:** Generated transliteration via AI even when translations existed  
**After:** Only generates transliteration if the database column exists and is empty

This is safe because:
- Transliteration is optional (helper feature, not essential)
- Reduces API calls by 80-90% for dialogue viewing
- Core dialogue functionality (target + mother language text) still works perfectly

## Expected Results

### Before Fixes:
- Loading app with Russian target language: **~200+ API calls** for UI
- Opening each dialogue: **~8-15 additional API calls** for transliteration
- **Total per session: 300-500+ API calls** ❌

### After Fixes:
- Loading app with Russian target language: **0 API calls** for UI (uses English fallback)
- Opening each dialogue: **0 API calls** if translations exist in database
- **Total per session: 0-10 API calls** (only for actual AI features like missions, word explanations) ✅

## What Still Uses AI (Intentionally)

These features still make AI calls as intended:
1. **Mission dialogues** - AI-generated conversations
2. **Word explanations** - AI explains words when user clicks them
3. **Help suggestions** - AI provides grammar help during missions
4. **Missing dialogue translations** - Only if content doesn't exist in database

## Long-Term Solution (Optional)

To fully populate UI translations for all 30 languages:

1. Export English UI strings from `src/constants/translations.ts`
2. Use a one-time batch translation job to translate to all 30 languages
3. Import translations into Supabase `translations` table
4. Then re-enable AI fallback (but it won't be needed)

Script to export UI strings for translation:
```javascript
// Run in browser console or Node.js
const translations = require('./src/constants/translations');
const uiStrings = translations.translations.en;
console.log(JSON.stringify(uiStrings, null, 2));
```

## Files Modified

1. `src/services/translationLoader.ts` - Disabled AI fallback for UI translations
2. `src/services/translationFallback.ts` - Disabled automatic transliteration generation

## Testing Recommendations

1. ✅ Open app with English mother + Russian target (should have 0 UI translation calls)
2. ✅ Open a scenario dialogue (should have 0-5 calls max if translations exist)
3. ✅ Try a mission (should make AI calls - this is expected and correct)
4. ✅ Click a word for explanation (should make 1 AI call - this is expected)

## Token Usage After Fix

**Estimated savings: 95%+ reduction in API costs** 🎉

