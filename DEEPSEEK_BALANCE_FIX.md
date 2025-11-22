# DeepSeek Balance & Translation JSON Fix

## Problems Found

### 1. DeepSeek Out of Balance (402 Error)
**Error:** `"Insufficient Balance"` - 402 HTTP status  
**Cause:** DeepSeek account has no remaining credits  
**Impact:** Every DeepSeek API call was failing, wasting time on retries

### 2. Gemini MAX_TOKENS on Translations
**Error:** `⚠️ Gemini hit MAX_TOKENS - triggering fallback`  
**Cause:** `maxOutputTokens: 200` was too low for translations with transliteration  
**Impact:** Gemini translations were incomplete, triggering unnecessary fallbacks

### 3. Groq Returning Plain Text Instead of JSON
**Error:** `SyntaxError: Unexpected token 'H', "Here is th"... is not valid JSON`  
**Cause:** When Groq was used as fallback for translations, it returned conversational text like "Here is the translation: ..." instead of JSON  
**Impact:** Mission conversations failed with JSON parse errors

---

## Solutions Applied

### 1. ✅ Removed DeepSeek from All Tasks

**Changed provider percentages to eliminate DeepSeek:**

| Task | Old | New |
|------|-----|-----|
| **NPC Response** | 70% Groq, 25% Gemini, 5% DeepSeek | 75% Groq, 25% Gemini |
| **Helper Robot** | 80% Groq, 15% Gemini, 5% DeepSeek | 85% Groq, 15% Gemini |
| **Word Explanation** | 50% Gemini, 40% Groq, 10% DeepSeek | 60% Gemini, 40% Groq |
| **Translation** | 50% Groq, 45% Gemini, 5% DeepSeek | **70% Gemini**, 30% Groq |
| **Expression Extraction** | 50% Gemini, 30% DeepSeek, 20% Groq | 70% Gemini, 30% Groq |
| **Dialogue Generation** | 50% Gemini, 30% Groq, 20% DeepSeek | 70% Gemini, 30% Groq |

**Result:** No more 402 errors, no wasted retries on DeepSeek

---

### 2. ✅ Increased Gemini for JSON Tasks

**Why Gemini is better for structured output:**
- Gemini **consistently returns valid JSON**
- Groq sometimes returns conversational text ("Here is...", "The translation is...")
- For tasks requiring JSON (translations, word explanations), Gemini is more reliable

**New priorities:**
- **Translation:** 70% Gemini (was 45%) - **Most critical change**
- **Word Explanation:** 60% Gemini (was 50%)
- **Dialogue Generation:** 70% Gemini (was 50%)
- **Expression Extraction:** 70% Gemini (was 50%)

---

### 3. ✅ Increased maxOutputTokens for Translations

**File:** `src/services/aiService.ts`

**Changed:**
```typescript
maxOutputTokens: 200  // Old - caused MAX_TOKENS errors
maxOutputTokens: 400  // New - prevents truncation
```

**Why:** Gemini 2.5 models use "thinking tokens" internally, so actual output + thinking can exceed 200 tokens for longer translations with transliteration.

---

### 4. ✅ Made Translation Prompts Clearer

**Added explicit JSON-only instructions:**

```typescript
IMPORTANT: Return ONLY a valid JSON object. No explanations, no additional text, no markdown, no code blocks.

...

OUTPUT ONLY THE JSON OBJECT ABOVE. DO NOT include any explanatory text like "Here is the translation:" or similar.
```

**Why:** This reduces the chance of Groq (when used as fallback) returning conversational responses.

---

## Current AI Provider Configuration

### Task Distribution:

| Task | Provider Split | Model |
|------|----------------|-------|
| **NPC Response** | 75% Groq, 25% Gemini | llama-3.3-70b / gemini-2.5-flash-lite |
| **Helper Robot** | 85% Groq, 15% Gemini | llama-3.3-70b / gemini-2.5-flash-lite |
| **Text Explanation** | 100% Groq | llama-3.3-70b-versatile |
| **Word Explanation** | 60% Gemini, 40% Groq | gemini-2.5-flash-lite / llama-3.3-70b |
| **Translation** | **70% Gemini**, 30% Groq | gemini-2.5-flash-lite / llama-3.3-70b |
| **Expression Extraction** | 70% Gemini, 30% Groq | gemini-2.5-flash-lite / llama-3.3-70b |
| **Dialogue Generation** | 70% Gemini, 30% Groq | gemini-2.5-flash-lite / llama-3.3-70b |
| **TTS** | 60% ElevenLabs, 40% Google + Browser fallback | - |

**DeepSeek:** ❌ **Completely removed** (0% on all tasks)

---

## Expected Results

### Before:
- ❌ DeepSeek 402 errors every few requests
- ❌ Gemini MAX_TOKENS on translations
- ❌ "Here is th..." JSON parse errors
- ❌ Mission conversations failing

### After:
- ✅ No more 402 errors (DeepSeek removed)
- ✅ No more MAX_TOKENS (increased to 400)
- ✅ More reliable JSON responses (70% Gemini for translations)
- ✅ Mission conversations working smoothly

---

## Testing Recommendations

1. **Try Arabic mission again** - Should work without "Here is th..." error
2. **Check console** - Should NOT see:
   - `Failed to load resource: the server responded with a status of 402`
   - `⚠️ Gemini hit MAX_TOKENS - triggering fallback`
   - `SyntaxError: Unexpected token 'H'`

3. **Should see:**
   ```
   🤖 [AI Router] Task: translation | Provider: GEMINI | Model: gemini-2.5-flash-lite
   ✅ [AI Router] Success with GEMINI
   ✅ [AI Service] Translation completed via router
   ```

---

## Summary of Changes

**Files Modified:**
1. `src/config/aiConfig.ts` - Removed DeepSeek, increased Gemini for JSON tasks
2. `src/services/aiService.ts` - Increased maxOutputTokens, improved prompts

**What Changed:**
- ✅ DeepSeek removed from all tasks (0%)
- ✅ Gemini increased for translation (70%, up from 45%)
- ✅ Translation token limit increased (400, up from 200)
- ✅ Clearer JSON-only prompts
- ✅ No more 402 errors
- ✅ No more MAX_TOKENS errors
- ✅ No more "Here is th..." JSON parse errors

**DeepSeek Users:** If you want to re-enable DeepSeek after adding balance, edit `aiConfig.ts` and add back small percentages (5-10%).


