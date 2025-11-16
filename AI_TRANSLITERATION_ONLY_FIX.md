# AI Transliteration-Only Prompt Fix

## Problem Identified

When translation **already exists** in the database but **transliteration is missing**, the AI was generating English romanization instead of the mother language's native script.

### Example (Russian Native → Turkish Target):

**NPC's Phrase (Translation Exists in DB):**
- Turkish text: "Merhaba, benim adım Mark. Sizin adınız ne?" ✅ (from database)
- Transliteration: `[merhaba benim adim mark sizin adiniz ne]` ❌ (English letters!)
- Russian: "Привет, меня зовут Марк. Как ваше имя?" ✅

**User's Phrase (Fresh AI Generation):**
- Turkish text: "Merhaba, benim adım Ivan." ✅ (AI generated)
- Transliteration: `[мерхаба беним адым иван]` ✅ (Russian Cyrillic!)
- Russian: "Привет, меня зовут Иван." ✅

---

## Root Cause

There are **2 different code paths** for AI translation:

### Path 1: Fresh Translation (Works ✅)
When **both** translation AND transliteration are missing:
```typescript
// Lines 460-481
const aiResult = await translateWithAI({
  sourceText: phrase.en_text,
  sourceLanguage: 'en',
  targetLanguage: targetLanguage,  // Turkish
  motherLanguage: motherLanguage,  // Russian
  includeTransliteration: true
});
```
**Prompt:** "Translate from English to Turkish" + "transliterate using Russian script"
**Result:** Works perfectly! ✅

### Path 2: Transliteration Only (Was Broken ❌)
When translation **exists** but transliteration is **missing**:
```typescript
// Lines 497-515
const aiResult = await translateWithAI({
  sourceText: phrase[targetColumn],  // Turkish text from DB
  sourceLanguage: targetLanguage,    // Turkish
  targetLanguage: targetLanguage,    // Turkish (same!)
  motherLanguage: motherLanguage,    // Russian
  includeTransliteration: true
});
```

**Old Prompt (Confusing!):**
```
Translate the following text from Turkish to Turkish.

Text: "Merhaba, benim adım Mark..."

Return a JSON object with:
- "translation": the translated text in Turkish
- "transliteration": the translation written using Russian alphabet/script
```

**The Problem:**
- AI sees "from Turkish to Turkish" and gets confused
- "The translation" is ambiguous when there's no actual translation
- AI defaults to English romanization instead of Russian Cyrillic

---

## Solution Implemented

Added a **special case** for when `sourceLanguage === targetLanguage` (transliteration-only mode):

### Changes to `src/services/translationFallback.ts` (lines 293-352):

```typescript
function generateTranslationPrompt(
  text: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage,
  motherLanguage: SupportedLanguage | undefined,
  includeTransliteration: boolean
): string {
  const sourceLangName = getLanguageName(sourceLanguage);
  const targetLangName = getLanguageName(targetLanguage);
  const motherLangName = motherLanguage ? getLanguageName(motherLanguage) : sourceLangName;

  // ✅ NEW: Detect transliteration-only mode
  const isTransliterationOnly = sourceLanguage === targetLanguage;

  let prompt;
  
  if (isTransliterationOnly && includeTransliteration) {
    // ✅ NEW: Clear, specific prompt for transliteration-only
    prompt = `Transliterate the following ${sourceLangName} text into ${motherLangName} script.

Text: "${text}"

Return a JSON object with:
- "translation": keep the same text in ${sourceLangName} (no translation needed)
- "transliteration": the text written using ${motherLangName} alphabet/script (lowercase, no punctuation)

Example format:
{
  "translation": "original text here",
  "transliteration": "transliterated text here in ${motherLangName} script"
}

Be accurate and natural. Approximate the ${sourceLangName} sounds using the ${motherLangName} writing system (not English romanization).`;
  } else {
    // Normal translation mode (existing code)
    prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}...`;
  }

  return prompt;
}
```

### Key Improvements:

1. **Clear Intent:** "Transliterate... into Russian script" (not "Translate from Turkish to Turkish")
2. **Explicit Instructions:** "keep the same text" for translation field
3. **Prevents Confusion:** "(not English romanization)" explicitly stated
4. **Better Context:** "transliterated text here in Russian script"

---

## Expected Behavior After Fix

### Russian Native → Turkish Target:

**All Phrases (Both NPC and User):**
- Turkish text ✅
- **Russian Cyrillic transliteration** ✅ (not English!)
- Russian translation ✅

**Example:**
```
Merhaba, benim adım Mark. Sizin adınız ne?
[мерхаба беним адым марк сизин адынъз не]  ← Russian Cyrillic!
Привет, меня зовут Марк. Как ваше имя?
```

---

## When This Fix Applies

This fix only triggers when:
1. ✅ Target language translation **exists in database**
2. ✅ Transliteration column **doesn't exist** or is **empty**
3. ✅ `sourceLanguage === targetLanguage` (transliteration-only call)

Examples:
- Turkish text exists → Generate Russian Cyrillic transliteration
- Arabic text exists → Generate Chinese character transliteration
- Korean text exists → Generate Hindi Devanagari transliteration

---

## Files Modified

- ✅ `src/services/translationFallback.ts` (+30 lines, -5 lines)
  - Added `isTransliterationOnly` detection
  - Created separate prompt for transliteration-only mode
  - Explicitly prevents English romanization fallback

- ✅ No linter errors
- ✅ Build successful

---

## Deployment

- Commit: `4b48645`
- Message: "Fix transliteration-only prompt to explicitly request mother language script (not English romanization)"
- Pushed to: `main` branch
- Netlify: Auto-deploying now

---

## Testing Instructions

Wait 2-3 minutes for Netlify deployment, then:

### Test 1: Russian → Turkish (Original Issue)
1. Go to https://turispeak.com
2. Choose **Russian (RU)** as native
3. Choose **Turkish (TR)** as target
4. Click **Scenario 1**

**Expected:** ALL phrases (NPC and User) should have Russian Cyrillic transliteration:
```
Merhaba, benim adım Mark. Sizin adınız ne?
[мерхаба беним адым марк сизин адынъз не]  ← Russian!
```

### Test 2: Arabic → Spanish
Should show Arabic script transliteration (not English).

### Test 3: Chinese → French
Should show Chinese character transliteration (not English).

---

## Technical Details

### Why This Happened:

The AI model (Gemini) was receiving an ambiguous prompt:
- "Translate from X to X" is confusing
- "The translation" has no clear referent when source = target
- AI defaulted to safest option: English romanization

### Why This Fix Works:

The new prompt is **unambiguous**:
- Clear task: "Transliterate"
- Clear source: Turkish text
- Clear target: Russian script
- Explicit prevention: "(not English romanization)"

---

**Status:** 🚀 **Deployed - Ready to test!**

ALL transliterations (fresh or from existing translations) will now use the correct native script! 🌍

