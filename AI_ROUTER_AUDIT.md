# AI Router Audit - Which Functions Use Router?

## ✅ Functions Using Router (GOOD)

These functions in `src/services/aiService.ts` properly use the router:

| Function | Task Type | Router Used | Status |
|----------|-----------|-------------|--------|
| `generateNPCResponse` | NPC Responses | ✅ `routeAIRequest` | ✅ Working |
| `generateTextExplanation` | Text Explanation | ✅ `routeAIRequest` | ✅ Working |
| `generateWordExplanation` | Word Explanation | ✅ `routeAIRequest` | ✅ Working |
| `checkUserSentence` | Helper Robot | ✅ `routeAIRequest` | ✅ Working |
| `generateHelpSuggestion` | Helper Robot | ✅ `routeAIRequest` | ✅ Working |
| `generateSpeech` | TTS | ✅ `routeTTSRequest` | ✅ Working |

**Result:** 6 main AI functions properly use the router with automatic fallbacks.

---

## ❌ Functions NOT Using Router (HARDCODED)

These functions bypass the router and directly call Netlify functions with hardcoded Gemini models:

### File: `src/services/gemini.ts`

| Function | What It Does | Problem |
|----------|--------------|---------|
| `generateAIDialogue` | Generates full dialogues | ❌ Hardcoded Gemini only, no Groq/DeepSeek fallback |
| `generateWordExplanation` | Word explanations | ❌ Duplicate of `aiService.ts` function |
| `translateWord` | Single word translation | ❌ Only tries Gemini models |
| `generateSpeechWithGemini` | TTS generation | ❌ Only Google TTS, marked as deprecated |

**Hardcoded Models:** `['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro']`

### File: `src/services/translationFallback.ts`

| Function | What It Does | Problem |
|----------|--------------|---------|
| `translateWithAI` | Translates dialogue text | ❌ Hardcoded Gemini only |

**Hardcoded Models:** `['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite']`

### File: `src/services/expressionExtraction.ts`

| Function | What It Does | Problem |
|----------|--------------|---------|
| `extractExpressions` | Extracts common phrases | ❌ Hardcoded Gemini only |

**Hardcoded Models:** `['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro']`

### File: `src/services/missionHelperRobot.ts`

| Function | What It Does | Problem |
|----------|--------------|---------|
| `checkUserSentence` | Checks user sentences | ❌ Duplicate of `aiService.ts` function |
| `generateHelpSuggestion` | Generates suggestions | ❌ Duplicate of `aiService.ts` function |

**Hardcoded Models:** `['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite']`

---

## Impact of Hardcoded Functions

### Why This Is Bad:

1. **No Multi-Provider Fallback:** If Gemini fails, they can't try Groq or DeepSeek
2. **Wrong Model Order:** Using old order, not your preferred order
3. **Code Duplication:** Multiple versions of same functions
4. **Inconsistent Behavior:** Some features use router, others don't
5. **Harder to Configure:** Can't change provider percentages in `aiConfig.ts`

### Where Are These Used?

Most of these **are NOT actively used** because the app prefers the router-based versions in `aiService.ts`. However, they're still in the codebase and could be accidentally called.

**Files that might call them:**
- `DialogueBox.tsx` - might have old imports
- Older components

---

## ✅ Fixes Applied

### 1. Updated Gemini Model Order
**File:** `src/config/aiConfig.ts`

**New order:**
```typescript
gemini: [
  'gemini-2.5-flash-lite',    // ← Try lite first (fastest)
  'gemini-2.5-flash',          // ← Standard model  
  'gemini-2.0-flash',          // ← Older stable
  'gemini-2.0-flash-lite',     // ← Older lite
  'gemini-2.0-flash-exp'       // ← Experimental (last resort)
]
```

This order is now used by ALL router-based functions.

### 2. Added Browser TTS Fallback
**File:** `src/services/aiRouter.ts`

**New TTS fallback chain:**
```
ElevenLabs → Google Cloud TTS → Browser TTS (Web Speech API)
```

If both API services fail, the app will use the browser's built-in text-to-speech as a last resort.

---

## Recommendations

### Option 1: Delete Old Services (Recommended)
**Delete these files:**
- `src/services/gemini.ts` (most functions duplicated in aiService.ts)
- `src/services/missionHelperRobot.ts` (fully duplicated)
- `src/services/expressionExtraction.ts` (can migrate to router)

**Keep only:**
- `src/services/aiService.ts` (uses router)
- `src/services/aiRouter.ts` (the router itself)
- `src/services/translationFallback.ts` (but fix it to use router)

### Option 2: Migrate to Router (More Work)
Update all hardcoded functions to use `routeAIRequest` instead of direct fetches.

**Example migration:**
```typescript
// OLD (hardcoded)
const response = await fetch('/.netlify/functions/gemini-dialogue', {
  method: 'POST',
  body: JSON.stringify({ modelName: 'gemini-2.5-flash', ... })
});

// NEW (uses router)
const data = await routeAIRequest({
  task: 'dialogue-generation',
  prompt: myPrompt,
  generationConfig: { ... }
});
```

### Option 3: Mark as Deprecated (Temporary)
Add warnings to these functions so developers know not to use them.

---

## Current Status

### Router-Based (Good) ✅
- Mission conversations
- Word explanations
- Text/sentence explanations  
- Helper robot checks
- TTS (with ElevenLabs → Google → Browser fallback)

### Hardcoded (Bad) ❌
- AI dialogue generation (`gemini.ts`)
- Translation fallback (`translationFallback.ts`)
- Expression extraction
- Some older imports that might still reference old functions

---

## Testing Recommendations

To verify router is being used:

1. Check console for these messages:
   ```
   🤖 [AI Router] Task: npc-response | Provider: GROQ | Model: llama-3.3-70b-versatile
   ✅ [AI Router] Success with GROQ
   ```

2. If you see direct Gemini calls without router logs, those functions are hardcoded

3. Enable `aiConfig.ts` to use 100% Groq for a task - if it still uses Gemini, it's hardcoded

---

## Summary

**Current Router Coverage:**
- ✅ 6/6 main AI functions in `aiService.ts` use router
- ❌ 4-5 files have hardcoded Gemini-only functions
- ❌ Most hardcoded functions are duplicates (not used)

**Recommended Action:**
Delete `gemini.ts`, `missionHelperRobot.ts`, and fix `translationFallback.ts` to use router.

**TTS Fallback:** ✅ Now complete (ElevenLabs → Google → Browser)

**Gemini Model Order:** ✅ Updated to your preferred order


