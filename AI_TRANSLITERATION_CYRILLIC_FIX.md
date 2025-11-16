# AI Transliteration Mother Language Script Fix

## Problems Identified

### 1. ❌ Transliteration in Wrong Alphabet
The AI was generating transliterations in **English romanization** instead of the **mother language's native script**.

#### Example (Russian as Mother Language, Korean as Target):
- **Target:** 실례합니다, 성함이 어떻게 되세요? (Korean)
- **Current Transliteration:** [sillyehamnida seonghami eotteoke doeseyo] ❌ (English letters)
- **Expected Transliteration:** [силлиеханнида сонхами оттоке доесейо] ✅ (Russian Cyrillic)

### 2. ❌ Missing Russian UI Translations
Some scenario-related UI elements were showing English instead of Russian:
- `scenarioDescription` - missing
- `dialoguesCompleted` - missing
- `regularDialogues` - missing

### 3. ⏱️ Slower Loading (Expected)
Dialogues now load slower because AI makes 2 translation calls per phrase:
- English → Target language (Korean)
- English → Mother language (Russian)

Each call takes ~2-3 seconds, so 2 phrases = ~8-12 seconds total.

---

## Root Cause

### Transliteration Issue:

The `generateTranslationPrompt` function was asking the AI to transliterate using the **source language** (English) instead of the **mother language** (Russian):

```typescript
// BEFORE (WRONG):
prompt += `"transliteration": the translation written in ${sourceLangName} letters`
// sourceLangName = "English" ❌

// AFTER (CORRECT):
prompt += `"transliteration": the translation written using ${motherLangName} alphabet/script`
// motherLangName = "Russian" ✅
```

**The Problem:** The `translateWithAI` function didn't receive the `motherLanguage` parameter, so it couldn't tell the AI which script to use for transliteration.

---

## Solution Implemented

### Changes to `src/services/translationFallback.ts`:

#### 1. Updated `TranslationRequest` Interface (line 35)
```typescript
export interface TranslationRequest {
  sourceText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  motherLanguage?: SupportedLanguage;  // ✅ Added for transliteration
  includeTransliteration?: boolean;
}
```

#### 2. Updated `translateWithAI` Function (line 151)
```typescript
// Now extracts and logs motherLanguage
const { sourceText, sourceLanguage, targetLanguage, motherLanguage, includeTransliteration } = request;

logger.info('AI translation requested', { 
  sourceLanguage, 
  targetLanguage,
  motherLanguage,  // ✅ Added
  textLength: sourceText.length 
});
```

#### 3. Updated `generateTranslationPrompt` Function (line 297)
```typescript
function generateTranslationPrompt(
  text: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage,
  motherLanguage: SupportedLanguage | undefined,  // ✅ Added parameter
  includeTransliteration: boolean
): string {
  const motherLangName = motherLanguage ? getLanguageName(motherLanguage) : sourceLangName;
  
  // New prompt text:
  if (includeTransliteration) {
    prompt += `
- "transliteration": the translation written using ${motherLangName} alphabet/script (lowercase, no punctuation)`;
  }
  
  // ...
  
  prompt += `
Be accurate and natural. For transliteration, approximate the ${targetLangName} sounds using the ${motherLangName} writing system.`;
}
```

#### 4. Updated Calls to `translateWithAI` (lines 466, 503)
```typescript
// Now passes motherLanguage parameter
const aiResult = await translateWithAI({
  sourceText: phrase.en_text,
  sourceLanguage: 'en',
  targetLanguage: targetLanguage,
  motherLanguage: motherLanguage,  // ✅ Added
  includeTransliteration: needsTransliteration
});
```

### Changes to `src/constants/translations.ts`:

#### Added Missing Russian Scenario Keys (lines 333-336)
```typescript
ru: {
  // ... existing translations ...
  
  // Scenario-related
  scenarioDescription: 'Практикуйте сценарии реальных разговоров',
  dialoguesCompleted: 'диалогов завершено',
  regularDialogues: 'Обычные Диалоги'
}
```

---

## Expected Behavior Now

### For Russian Native → Korean Target:

The AI will generate:
1. **English → Korean** (target phrase)
   - Example: "Excuse me, what is your name?" → "실례합니다, 성함이 어떻게 되세요?"

2. **Korean → Russian Cyrillic** (transliteration in Russian script)
   - Example: "실례합니다..." → "силлиеханнида сонхами оттоке доесейо"

3. **English → Russian** (translation/mother language)
   - Example: "Excuse me, what is your name?" → "Простите, как вас зовут?"

### UI Display Will Show:
```
실례합니다, 성함이 어떻게 되세요?
[силлиеханнида сонхами оттоке доесейо]
Простите, как вас зовут?
```

- **Top line:** Korean text (target) ✅
- **Middle line:** Russian Cyrillic transliteration ✅
- **Bottom line:** Russian translation ✅

### Russian UI:
- ✅ "Практикуйте сценарии реальных разговоров" (scenario description)
- ✅ "Обычные Диалоги" (regular dialogues)
- ✅ "X диалогов завершено" (dialogues completed)

---

## Files Modified

- ✅ `src/services/translationFallback.ts` (+12 lines, -5 lines)
  - Updated TranslationRequest interface
  - Updated translateWithAI to pass motherLanguage
  - Updated generateTranslationPrompt to use mother language for transliteration
  - Updated all translateWithAI calls

- ✅ `src/constants/translations.ts` (+4 lines)
  - Added missing Russian scenario translations

- ✅ No linter errors
- ✅ Build successful

---

## Deployment

- Commit: `12a6eae`
- Message: "Fix transliteration to use mother language script (Cyrillic for Russian) + add missing Russian scenario UI translations"
- Pushed to: `main` branch
- Netlify: Auto-deploying now

---

## Testing Instructions

Wait 2-3 minutes for Netlify deployment, then:

### Test 1: Russian → Korean
1. Go to https://turispeak.com
2. Choose **Russian (RU)** as native language
3. Choose **Korean (KO)** as target language
4. Click **Scenario 1**

**Expected Result:**
- Korean text (target)
- **Russian Cyrillic transliteration** (not English romanization)
- Russian translation

### Test 2: Turkish → German (Previous Fix)
Should still work with Turkish script transliteration.

### Test 3: Russian UI
All UI elements should now be in Russian, including:
- Scenario descriptions
- "Обычные Диалоги" (Regular Dialogues)
- "X диалогов завершено" (dialogues completed)

---

## About Loading Time

⏱️ **Yes, it's slower now!** This is expected behavior:

- **Before:** Only 1 call per phrase (if translation missing)
- **Now:** 2 calls per phrase (target + mother language)
- **Time:** ~2-3 seconds per call = ~8-12 seconds for 2 phrases

This is the cost of having AI generate both translations on-demand. Once generated, they're cached in memory for the session.

**Future optimization options:**
1. Cache translations in local storage
2. Pre-generate common language pairs
3. Use faster AI models for translation
4. Add loading indicator with progress

---

**Status:** 🚀 **Deployed - Ready to test!**

The transliteration now uses the correct native script for each mother language! 🌍

