# Mission Quiz Fix - Using Actual Conversation Expressions

## Problem

After completing any of the 3 missions in a scenario, the quiz was always showing the same 3 generic expressions:
- "hello"
- "my name is"  
- "what is your name"

These expressions were from Dialogue 1 of Scenario 1 (Mark's introduction), not from the actual mission conversation.

### Root Cause

1. **Missions don't have fixed dialogue IDs**: Missions use AI-generated responses, so they don't have pre-stored dialogues in the database
2. **Default dialogueId = 1**: When DialogueBox passed `dialogueId` to the quiz, it defaulted to `1` for all missions
3. **Quiz always queried same expressions**: VocalQuizComponent queried `expressions_1` table for dialogue 1, getting the same 3 expressions every time
4. **Not mission-specific**: The quiz wasn't testing what was actually discussed in each unique mission conversation

## Solution

**Option 2: Extract expressions from actual mission conversation using AI**

This solution:
- Uses the actual conversation text from each mission
- Extracts relevant expressions using AI (already implemented feature)
- Makes each mission quiz unique and relevant to what was discussed
- Is more educational - tests expressions actually used

## Implementation

### 1. Updated VocalQuizComponent Props

**File**: `src/components/VocalQuizComponent.tsx`

Added new optional prop:
```typescript
interface VocalQuizProps {
  // ... existing props
  missionConversation?: string; // Full conversation text from mission for AI extraction
}
```

### 2. Added Mission-Specific AI Extraction Path

**File**: `src/components/VocalQuizComponent.tsx` (lines ~242-330)

Added new logic at the start of quiz fetching:
- **For missions with conversation text**: Skip database lookup (Tier 1)
- **Go directly to AI extraction**: Use the actual mission conversation
- **Cache results**: Store extracted expressions for potential retries
- **Fallback gracefully**: If AI fails, fall back to existing tiers

Key features:
```typescript
if (isMission && missionConversation) {
  // Use AI to extract expressions from actual conversation
  const aiExpressions = await extractExpressionsFromDialogue({
    dialogueText: missionConversation,
    targetLanguage,
    motherLanguage
  });
  // Transform and cache results
}
```

### 3. Pass Conversation to Quiz Component

**File**: `src/components/DialogueBox.tsx` (line ~4456)

Updated VocalQuizComponent rendering:
```typescript
<VocalQuizComponent
  // ... existing props
  isMission={isMissionMode}
  missionConversation={isMissionMode ? conversationHistory.map(e => e.phrase).join(' ') : undefined}
/>
```

This collects all phrases from the mission conversation and passes them as a single text string for AI extraction.

## How It Works

### Before (Broken)
```
Mission 1 completes → dialogueId = 1 → Query expressions_1 → Get "hello, my name is, what is your name"
Mission 2 completes → dialogueId = 1 → Query expressions_1 → Get "hello, my name is, what is your name"  
Mission 3 completes → dialogueId = 1 → Query expressions_1 → Get "hello, my name is, what is your name"
```

### After (Fixed)
```
Mission 1 completes → conversationHistory → AI extracts actual expressions → Quiz tests what was discussed
Mission 2 completes → conversationHistory → AI extracts actual expressions → Quiz tests what was discussed
Mission 3 completes → conversationHistory → AI extracts actual expressions → Quiz tests what was discussed
```

## Example Scenarios

### Mission 1: "Find out the person's full name"
**Conversation might include**:
- "what is your full name"
- "nice to meet you"
- "can you spell that"

**Quiz will test these expressions** ✅

### Mission 2: "Find out where the person is from"  
**Conversation might include**:
- "where are you from"
- "which city"
- "i am from"

**Quiz will test these expressions** ✅

### Mission 3: "Find out what the person does"
**Conversation might include**:
- "what do you do"
- "i work as"
- "what about you"

**Quiz will test these expressions** ✅

## Benefits

1. **Unique per mission**: Each mission gets expressions from its actual conversation
2. **More educational**: Tests what the user actually practiced
3. **Better retention**: Reinforces the specific vocabulary used in that mission
4. **No database needed**: Uses existing AI extraction system
5. **Cached**: AI extractions are cached to avoid repeated API calls on retries
6. **Graceful fallback**: If AI fails, still falls back to word matching system

## Technical Details

### AI Extraction Service
- **File**: `src/services/expressionExtraction.ts`
- **Function**: `extractExpressionsFromDialogue()`
- **Models**: Tries 5 Gemini models with fallback
- **Output**: 3-5 conversational expressions with translations
- **Timeout**: 10 seconds max

### Caching Strategy
- **Key**: `ai_expressions_mission_${dialogueId}_${targetLanguage}_${motherLanguage}`
- **Storage**: sessionStorage (per session)
- **Purpose**: Avoid re-extracting on quiz retries

### Fallback Chain
For missions with conversation:
1. **Check cache** → Use cached AI expressions if available
2. **AI extraction** → Extract from actual conversation
3. **Word matching** → Use existing algorithm (if AI fails)
4. **Auto-complete** → Skip quiz if all tiers fail

## Files Modified

1. ✅ `src/components/VocalQuizComponent.tsx` - Added missionConversation prop and AI extraction logic
2. ✅ `src/components/DialogueBox.tsx` - Pass conversation history to quiz component
3. ✅ `MISSION_QUIZ_FIX.md` - This documentation

## Testing

### Manual Test Steps

1. Start a mission (e.g., Mission 1: "Find out the person's full name")
2. Have a conversation with the NPC
3. Complete the mission
4. Check console logs for:
   ```
   🎯 Mission mode with conversation text: Using AI extraction directly
   🤖 Calling AI to extract expressions from mission conversation...
   ✅ Mission AI extracted X expressions from actual conversation
   ```
5. Verify quiz shows expressions from the actual conversation
6. Complete Mission 2 and verify different expressions
7. Complete Mission 3 and verify different expressions again

### Expected Console Output

```
[VocalQuizComponent] 🔍 QUIZ SYSTEM CHECK: {
  dialogueId: 1,
  isScenario: false,
  isMission: true,
  ...
}
🎯 Mission mode with conversation text: Using AI extraction directly
🤖 Calling AI to extract expressions from mission conversation...
✅ Mission AI extracted 4 expressions from actual conversation
💾 Cached mission AI expressions for future use
```

## Success Criteria

- ✅ Each mission produces unique quiz expressions
- ✅ Expressions match actual conversation content
- ✅ No database lookup for mission dialogues
- ✅ AI extraction works reliably with fallback
- ✅ Results are cached for retries
- ✅ No breaking changes to existing systems

## Notes

- Missions still use the same base system as scenarios (expressions → AI → words)
- The only change is prioritizing AI extraction with actual conversation text
- Regular scenario dialogues are unaffected
- Non-mission dialogues continue using their existing paths

---

**Date**: November 19, 2025  
**Status**: ✅ Implemented and Ready for Testing

