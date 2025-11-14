# Expression-Based Quiz Feature

## Overview

The scenario quiz system now uses **pre-curated expressions** instead of individual words, with an automatic fallback to the dynamic word-matching system if expressions are not available.

**Date:** November 14, 2025  
**Feature:** Expression-based quiz with word fallback

---

## 🎯 What Are Expressions?

Expressions are **short, reusable phrases** (1-6 words) extracted from dialogues to help users build conversational skills. They focus on:
- Greetings ("hello", "good morning")
- Introductions ("my name is", "nice to meet you")
- Common questions ("how are you", "what is your name")
- Polite responses ("im good", "nice to meet you too")

### Expression Rules

1. **Length**: 1-6 words maximum
2. **Case**: All lowercase (no capitalization)
3. **Punctuation**: None (no periods, commas, question marks, apostrophes)
4. **Names**: Excluded (e.g., "my name is mark" → "my name is")
5. **Language-specific formatting**:
   - English: Simple, natural phrasing
   - Russian: Cyrillic script
   - Spanish: Natural flow, minimal accents
6. **Uniqueness**: Up to 5 expressions per dialogue

### Examples

| English | Russian | Spanish |
|---------|---------|---------|
| hello | привет | hola |
| my name is | меня зовут | me llamo |
| how are you | как дела | como estas |
| nice to meet you | рад познакомиться | encantada de conocerte |
| good morning | доброе утро | buenos dias |

---

## 🏗️ Architecture

### System Flow

```
1. User completes scenario dialogue
   ↓
2. VocalQuizComponent attempts to fetch expressions
   ↓
3a. If expressions found → Use expressions for quiz
   ↓
3b. If NO expressions → Fallback to dynamic word matching (existing system)
   ↓
4. User completes quiz
   ↓
5. Progress saved (dialogue completion only, NOT individual expressions)
```

### Database Structure

#### Expressions Table: `expressions_{characterId}`

Example: `expressions_1` for character 1

```sql
CREATE TABLE IF NOT EXISTS expressions_1 (
    expression_id SERIAL PRIMARY KEY,
    dialogue_id INTEGER NOT NULL,
    en_expression TEXT NOT NULL,
    ru_expression TEXT NOT NULL,
    es_expression TEXT NOT NULL
);
```

**Key Points:**
- Table naming follows pattern: `expressions_1`, `expressions_2`, etc. (matches `scenario_1`, `scenario_2`)
- Each dialogue (1-10) can have up to 5 expressions
- Expressions are pre-curated for quality and relevance

---

## 📁 New Files

### `src/services/scenarioExpressions.ts`

Core service for fetching expressions from the database.

**Main Functions:**

#### `fetchScenarioExpressions()`
```typescript
fetchScenarioExpressions(
  characterId: number,
  dialogueId: number,
  scenarioNumber: number,
  targetLanguage: SupportedLanguage,
  motherLanguage: SupportedLanguage
): Promise<ScenarioExpression[]>
```

**What it does:**
- Queries `expressions_{characterId}` table
- Filters by `dialogue_id`
- Transforms to `VocalQuizWord` format for compatibility
- Returns up to 5 expressions
- Returns empty array if table doesn't exist (triggers fallback)

#### `checkExpressionsTableExists()`
```typescript
checkExpressionsTableExists(characterId: number): Promise<boolean>
```

Checks if expressions table exists for a character (useful for diagnostics).

#### `getExpressionStats()`
```typescript
getExpressionStats(
  characterId: number,
  dialogueId: number
): Promise<{ expressionCount: number; tableExists: boolean }>
```

Returns expression count and table existence status for debugging.

---

## 🔄 Modified Files

### `src/components/VocalQuizComponent.tsx`

**Changes:**
1. Added import: `import { fetchScenarioExpressions } from '../services/scenarioExpressions';`
2. Updated quiz fetching logic (lines ~209-257):

```typescript
// For scenarios, try expressions first, then fallback to words
if (isScenario) {
  console.log('💬 Attempting to fetch pre-curated expressions...');
  
  // Try expressions first
  const scenarioExpressions = await fetchScenarioExpressions(...);
  
  if (scenarioExpressions && scenarioExpressions.length > 0) {
    console.log('✅ Found', scenarioExpressions.length, 'expressions');
    setQuizWords(scenarioExpressions as VocalQuizWord[]);
    return;
  }
  
  // Fallback to dynamic word matching
  console.log('⚠️ No expressions found, falling back to word matching...');
  const scenarioWords = await fetchScenarioQuizWords(...);
  
  if (scenarioWords && scenarioWords.length > 0) {
    console.log('✅ Found', scenarioWords.length, 'words (fallback)');
    setQuizWords(scenarioWords as VocalQuizWord[]);
    return;
  }
  
  // No expressions or words - allow completion without quiz
  setQuizWords([]);
}
```

**Console Messages for Debugging:**
- 💬 "Attempting to fetch pre-curated expressions..."
- ✅ "Found X expressions for scenario"
- ⚠️ "No expressions found, falling back to word matching..."
- ✅ "Found X quiz words for scenario (fallback)"

---

## 🚫 What's NOT Changed

### Progress Tracking
- **Dialogue completion** is still tracked normally
- **Individual expressions are NOT tracked** (as requested)
- Uses existing `trackCompletedScenarioDialogue()` function
- Updates `scenario_progress` and `scenario_dialogue_progress` in `language_levels` table

### Existing Systems
- Regular (non-scenario) dialogues still use `words_quiz` table
- Dynamic word matching system (`scenarioQuiz.ts`) remains intact as fallback
- Speech recognition, pronunciation scoring, and UI unchanged

---

## 📊 Comparison: Expressions vs Words

| Feature | Expressions (Primary) | Words (Fallback) |
|---------|----------------------|------------------|
| **Source** | Pre-curated `expressions_{id}` table | Dynamic matching from `quiz` table |
| **Quality** | ✅ Guaranteed high quality | ⚠️ Depends on matching algorithm |
| **Learning Value** | ⭐⭐⭐⭐⭐ Immediately usable phrases | ⭐⭐⭐ Individual vocabulary |
| **Setup Required** | Manual curation (5 per dialogue) | Automatic (needs 1000-word table) |
| **Consistency** | ✅ Predictable | ⚠️ Varies by dialogue content |
| **User Experience** | 💬 Natural conversation building | 📚 Vocabulary building |

---

## 🔧 How to Populate Expressions

### Option 1: Manual Entry
1. Review each dialogue in Scenario 1
2. Extract 3-5 common expressions per dialogue
3. Format according to rules (lowercase, no punctuation, no names)
4. Insert into `expressions_1` table:

```sql
INSERT INTO expressions_1 (dialogue_id, en_expression, ru_expression, es_expression)
VALUES 
  (1, 'hello', 'привет', 'hola'),
  (1, 'my name is', 'меня зовут', 'me llamo'),
  (1, 'nice to meet you', 'рад познакомиться', 'encantada de conocerte'),
  (1, 'how are you', 'как дела', 'como estas'),
  (1, 'im good', 'все хорошо', 'estoy bien');
```

### Option 2: Helper Script (To Be Created)
```javascript
// extract-expressions.js
// Scans dialogue text and suggests common expressions
// You review and approve
```

---

## 🧪 Testing

### Test Cases

1. **With Expressions (Primary Path)**
   - Dialogue 1 has expressions in `expressions_1`
   - Quiz should show expressions
   - Console: "✅ Found 5 expressions for scenario"

2. **Without Expressions (Fallback)**
   - Dialogue 2 has NO expressions in table
   - Quiz should fallback to word matching
   - Console: "⚠️ No expressions found, falling back..."

3. **No Table (Fallback)**
   - `expressions_1` table doesn't exist
   - Quiz should fallback to word matching
   - Console: "ℹ️ No expressions table - using word fallback"

4. **Empty Result (Skip Quiz)**
   - No expressions AND no matching words
   - Quiz should auto-complete with 100% score
   - Console: "No quiz words matched from dialogue..."

### Manual Testing Steps

1. Create `expressions_1` table in Supabase
2. Add 5 expressions for dialogue 1
3. Complete scenario 1, dialogue 1
4. Verify quiz shows expressions (not words)
5. Check console for "✅ Found 5 expressions"
6. Complete quiz and verify progress saves
7. Test dialogue 2 without expressions
8. Verify fallback to word system works

---

## 📝 Migration Path

### Phase 1: Single Dialogue (15 mins)
1. Create `expressions_1` table
2. Add 5 expressions for Scenario 1, Dialogue 1
3. Test end-to-end

### Phase 2: Full Scenario (1-2 hours)
1. Add expressions for all 10 dialogues in Scenario 1
2. Test full scenario completion
3. Verify progress tracking

### Phase 3: All Scenarios (Gradual)
1. Identify most common expressions (reuse across dialogues)
2. Populate expressions for high-priority scenarios
3. Leave others to use word fallback

---

## 🎯 Benefits

### For Users
- ✅ Learn practical phrases immediately
- ✅ Build conversational confidence
- ✅ More natural language flow
- ✅ Better retention (chunked learning)

### For Development
- ✅ Predictable quiz content
- ✅ Quality control over learning material
- ✅ Simple fallback (no breaking changes)
- ✅ Gradual migration path

### For Maintenance
- ✅ Easy to add new expressions
- ✅ Can update/improve expressions anytime
- ✅ No complex matching algorithms
- ✅ Follows existing table patterns

---

## 🚨 Important Notes

1. **No Progress Tracking for Expressions**
   - Only dialogue completion is tracked
   - Individual expressions are NOT saved to database
   - This keeps the system simple

2. **Backward Compatible**
   - Existing word system remains as fallback
   - No breaking changes to regular dialogues
   - Scenarios without expressions work normally

3. **Table Naming Convention**
   - Must follow pattern: `expressions_1`, `expressions_2`, etc.
   - Matches `scenario_1`, `scenario_2` pattern
   - One table per character

4. **Language Support**
   - Currently supports: English, Russian, Spanish
   - Can extend to: French, German, Italian, Portuguese, Arabic, Chinese, Japanese, Turkish
   - Add columns to table as needed

---

## 🐛 Troubleshooting

### Issue: "No expressions found" but table exists
**Solution:** Check `dialogue_id` matches and table name is correct (`expressions_1` not `expressions`)

### Issue: Quiz shows words instead of expressions
**Solution:** Verify expressions table has data for that dialogue_id

### Issue: Error fetching expressions
**Solution:** Check Supabase RLS policies allow SELECT on expressions table

### Issue: Progress not saving
**Solution:** This is unrelated to expressions - check `language_levels` RLS policies

---

## 🎉 Summary

The expression-based quiz system provides:
- 💬 **Better learning** through conversational phrases
- 🔄 **Smooth fallback** to existing word system
- 🎯 **Quality control** via pre-curation
- 🛡️ **No breaking changes** to existing features
- 📈 **Gradual migration** path

Users get a superior learning experience with practical phrases they can use immediately in conversations!

