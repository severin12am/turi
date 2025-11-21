# AI Router Status

## ✅ Services Using Router (Correct Implementation)

### Text-to-Speech (TTS)
- **Service**: `generateSpeech()` in `src/services/aiService.ts`
- **Uses**: `routeTTSRequest()` in `src/services/aiRouter.ts`
- **Providers**: Google TTS (40%) → ElevenLabs (60%)
- **Logging**: ✅ Console + file logging
- **Used in**: 
  - DialogueBox.tsx
  - VocalQuizComponent.tsx
  - VocabularyBook.tsx

### Structure Explanation
- **Service**: `generateTextExplanation()` in `src/services/aiService.ts`
- **Uses**: `routeAIRequest()` in `src/services/aiRouter.ts`
- **Providers**: Deepseek (60%) → Groq (30%) → Gemini (10%)
- **Logging**: ✅ Console + file logging
- **Used in**: DialogueBox.tsx

---

## ❌ Services Still Bypassing Router (Need Migration)

### 1. NPC Response Generation
- **Current**: `generateNPCResponse()` in `src/services/missionNPC.ts`
- **Directly calls**: Gemini API via Netlify function
- **Should use**: `routeAIRequest()` with task: 'npc-response'
- **Used in**: 
  - DialogueBox.tsx (mission dialogues)

### 2. Sentence Checking (Helper Robot)
- **Current**: `checkUserSentence()` in `src/services/missionHelperRobot.ts`
- **Directly calls**: Gemini API via Netlify function
- **Should use**: `routeAIRequest()` with task: 'sentence-check'
- **Used in**: 
  - DialogueBox.tsx (mission dialogues)

### 3. Help Suggestions (Helper Robot)
- **Current**: `generateHelpSuggestion()` in `src/services/missionHelperRobot.ts`
- **Directly calls**: Gemini API via Netlify function
- **Should use**: `routeAIRequest()` with task: 'help-suggestion'
- **Used in**: 
  - DialogueBox.tsx (mission dialogues)

### 4. Translation
- **Current**: `translateWithAI()` in `src/services/translationFallback.ts`
- **Directly calls**: Gemini API via Netlify function
- **Should use**: `routeAIRequest()` with task: 'translation'
- **Used in**: 
  - DialogueBox.tsx (all dialogue types)
  - VocabularyBook.tsx

### 5. Transliteration
- **Current**: `generateTransliteration()` in `src/services/translationFallback.ts`
- **Directly calls**: Gemini API via Netlify function
- **Should use**: `routeAIRequest()` with task: 'translation' (same as translation)
- **Used in**: 
  - DialogueBox.tsx (all dialogue types)

### 6. Word Explanation
- **Current**: `generateWordExplanation()` in `src/services/gemini.ts`
- **Directly calls**: Gemini API via Netlify function
- **Should use**: `routeAIRequest()` with task: 'word-explanation'
- **Used in**: 
  - DialogueBox.tsx

### 7. Expression Extraction
- **Current**: `extractKeyExpressionsWithGemini()` in `src/services/expressionExtraction.ts`
- **Directly calls**: Gemini API via Netlify function
- **Should use**: `routeAIRequest()` with task: 'expression-extraction'
- **Used in**: 
  - ScenarioView.tsx

### 8. Scenario Dialogue Generation
- **Current**: `generateDialogue()` in `src/services/gemini.ts`
- **Directly calls**: Gemini API via Netlify function
- **Should use**: `routeAIRequest()` with task: 'dialogue-generation'
- **Used in**: 
  - ScenarioView.tsx

---

## 📊 Migration Priority

**HIGH PRIORITY** (used frequently in missions):
1. ✅ ~~Structure Explanation~~ (DONE - now using router with Deepseek)
2. Translation
3. Transliteration
4. NPC Response Generation
5. Sentence Checking

**MEDIUM PRIORITY**:
6. Word Explanation
7. Help Suggestions

**LOW PRIORITY**:
8. Expression Extraction
9. Scenario Dialogue Generation

---

## 🎯 Migration Template

For each service, follow this pattern:

1. **Create wrapper in aiService.ts** (if doesn't exist):
```typescript
export const generateNPCResponse = async (
  userText: string,
  context: any,
  targetLanguage: SupportedLanguage
): Promise<string> => {
  const prompt = `...`; // Build prompt
  
  const request: AIRequest = {
    task: 'npc-response',
    prompt,
    generationConfig: { ... }
  };
  
  console.log(`🤖 [AI Service] Generating NPC response via router`);
  const data = await routeAIRequest(request);
  
  // Extract and return response
  return data.candidates[0].content.parts[0].text;
};
```

2. **Update aiConfig.ts** (if task not configured):
```typescript
'npc-response': [
  { provider: 'deepseek', percentage: 60, model: 'deepseek-chat' },
  { provider: 'groq', percentage: 30, model: 'mixtral-8x7b-32768' },
  { provider: 'gemini', percentage: 10, model: 'gemini-2.5-flash' }
]
```

3. **Update component imports**:
```typescript
// OLD:
import { generateNPCResponse } from '../services/missionNPC';

// NEW:
import { generateNPCResponse } from '../services/aiService';
```

---

## ✅ Current Logging Status

### TTS Logging (console output):
```
🔊 [AI Service] Generating speech via router | Task: tts-npc | Gender: male | CharID: 42
🔊 [TTS Router] Task: tts-npc | Provider: GOOGLE | Gender: male | CharID: 42
✅ [TTS Router] Success with GOOGLE TTS
✅ [AI Service] Successfully generated speech via router
```

### Text Tasks Logging (console output):
```
📚 [AI Service] Generating structure explanation via router | Task: text-explanation
🤖 [AI Router] Task: text-explanation | Provider: DEEPSEEK | Model: deepseek-chat
✅ [AI Router] Success with DEEPSEEK
✅ [AI Service] Structure explanation generated successfully via router
```

