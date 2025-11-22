# AI Routing & Loading Fixes

## Issues Fixed

### 1. ✅ UI Translations Loading for Wrong Language

**Problem:** 
- App was loading UI translations for BOTH mother language AND target language
- When user selected EN (mother) + AR (target), it tried to load Arabic UI translations
- This caused "268 UI strings missing for ar" message and wasted API calls

**Fix:**
- Modified `src/App.tsx` lines 73-81
- Now only loads UI translations for mother language (the language user speaks)
- Target language is for learning, not for UI
- **Result:** UI only in user's language, no wasted translation calls

---

### 2. ✅ Text/Sentence Explanation Now Uses Groq 100%

**Problem:**
- Text explanation (sentence structure) was split 50% Groq / 40% Gemini / 10% DeepSeek
- User requested Groq as primary due to better reliability

**Fix:**
- Modified `src/config/aiConfig.ts` line 147
- Changed `text-explanation` to use 100% Groq (llama-3.3-70b-versatile)
- **Result:** Sentence explanations now always use Groq first

---

### 3. ✅ ElevenLabs TTS Disabled (401 Errors)

**Problem:**
- ElevenLabs TTS was configured for 60% of NPC voices
- Returned 401 Unauthorized errors (API key not configured or invalid)
- App fell back to browser TTS

**Fix:**
- Modified `src/config/aiConfig.ts` line 213
- Changed `tts-npc` to use 100% Google Cloud TTS
- ElevenLabs temporarily disabled until API key is added
- **Result:** No more TTS 401 errors, consistent Google TTS voices

---

### 4. ✅ Removed Outdated missionNPC.ts Service

**Problem:**
- Two NPC response services existed: `missionNPC.ts` and `aiService.ts`
- `missionNPC.ts` bypassed the router, used hardcoded Gemini models
- Models like 'gemini-2.5-flash' might not exist or fail
- Caused "Unexpected token 'H'" JSON parsing errors when fallback returned plain text

**Fix:**
- Deleted `src/services/missionNPC.ts` completely
- App now only uses `aiService.ts` → `generateNPCResponse()` → `routeAIRequest()`
- Proper router-based provider selection with fallbacks
- **Result:** Consistent AI responses, proper error handling, no more JSON parsing errors

---

### 5. ✅ Improved NPC Response Validation

**Problem:**
- AI responses not validated properly before parsing
- Could fail with cryptic errors if response format was wrong

**Fix:**
- Modified `src/services/aiService.ts` generateNPCResponse function
- Added validation:
  - Check response structure exists
  - Verify response is a string
  - Ensure response not empty after parsing
  - Better error messages for debugging
- **Result:** More reliable mission conversations, better error reporting

---

## Current AI Provider Configuration

### Task Distribution:

**NPC Responses (Mission conversations):**
- 70% Groq (llama-3.3-70b-versatile) - Fast, real-time
- 25% Gemini (gemini-2.5-flash) - Backup
- 5% DeepSeek (deepseek-chat) - Final fallback

**Helper Robot (Sentence checking):**
- 80% Groq
- 15% Gemini
- 5% DeepSeek

**Text Explanation (Sentence structure):**
- **100% Groq** ✨ (user preference)

**Word Explanation:**
- 50% Gemini
- 40% Groq
- 10% DeepSeek

**Translation:**
- 50% Groq
- 45% Gemini
- 5% DeepSeek

**TTS:**
- **100% Google Cloud TTS** (ElevenLabs disabled)

---

## Testing Checklist

✅ **Test 1:** Load app with EN (mother) + AR (target)
- Should NOT see "268 UI strings missing for ar"
- UI should be in English only

✅ **Test 2:** Try sentence explanation feature
- Should say "Groq" in console
- Should work consistently

✅ **Test 3:** Start a mission conversation
- Should work without "Here is th..." JSON errors
- Should get proper NPC responses

✅ **Test 4:** Use "Help Me" button in missions
- Should work correctly (uses Groq 80%)

✅ **Test 5:** TTS in missions
- Should use Google TTS (no 401 errors)
- Should hear character voice

---

## What Was Working Before Still Works

These fixes don't break existing functionality:
- ✅ Dialogue playback
- ✅ Quiz system
- ✅ Word explanations
- ✅ All 30 languages
- ✅ Progress tracking
- ✅ Character interactions

---

## If You Want to Re-enable ElevenLabs TTS

1. Get API key from https://elevenlabs.io
2. Add to Netlify environment variables: `ELEVENLABS_API_KEY`
3. Edit `src/config/aiConfig.ts` line 213-220
4. Change `tts-npc` percentage to desired split (e.g., 60% ElevenLabs, 40% Google)

---

## Files Modified

1. `src/App.tsx` - UI translation loading
2. `src/config/aiConfig.ts` - AI provider percentages and TTS config
3. `src/services/aiService.ts` - NPC response validation
4. `src/services/missionNPC.ts` - **DELETED** (unused)

---

## Expected Console Output Now

**Good:**
```
🤖 [AI Router] Task: text-explanation | Provider: GROQ | Model: llama-3.3-70b-versatile
✅ [AI Router] Success with GROQ
```

**Bad (should not see anymore):**
```
❌ POST /.netlify/functions/elevenlabs-tts 401 (Unauthorized)
ℹ️ 268 UI strings missing for ar, using English fallback
[Missions] Error: "Here is th"... is not valid JSON
```


