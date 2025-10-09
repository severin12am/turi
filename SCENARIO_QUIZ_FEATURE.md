# Scenario Quiz Feature - Common Words System

## Overview

Scenario dialogues now use a dynamic quiz system based on a `quiz` table containing 1000+ most common words in various languages. Instead of pre-assigned quiz words per dialogue, the system:

1. **Extracts** words from the scenario dialogue text
2. **Matches** them against the common words table
3. **Selects** up to 5 matching words for the quiz
4. **Handles** cases where fewer than 5 words match (or no matches at all)

## Architecture

### New Files

- **`src/services/scenarioQuiz.ts`** - Core service for matching dialogue words with quiz table
  - `fetchScenarioQuizWords()` - Main function to get quiz words for a scenario
  - `getScenarioQuizStats()` - Debug function to check match statistics
  - `extractWordsFromDialogue()` - Parses dialogue text into individual words
  - `getQuizColumnForLanguage()` - Maps language codes to quiz table columns

### Modified Files

- **`src/components/VocalQuizComponent.tsx`**
  - Added import for `fetchScenarioQuizWords`
  - Modified `useEffect` to detect scenarios and use different data source
  - Added special handling for scenarios with no matching words (auto-complete)
  - Kept all tracking functionality intact

## Database Schema

### Required Table: `quiz`

Your Supabase database must have a `quiz` table with these columns:

```sql
CREATE TABLE quiz (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  spanish TEXT,
  english TEXT,
  russian TEXT,
  french TEXT,
  german TEXT,
  italian TEXT,
  portuguese TEXT,
  arabic TEXT,
  chinese TEXT,
  japanese TEXT,
  turkish TEXT
);
```

**Note:** Column names are lowercase language names (not `entry_in_*` format like `words_quiz` table).

### Data Requirements

- Table should contain 1000+ most common words in each language
- Each row represents one word with translations across all supported languages
- Words should be in their base form (lowercase, no punctuation)

## How It Works

### Step-by-Step Process

1. **User completes scenario dialogue** → Clicks quiz button

2. **`VocalQuizComponent` detects it's a scenario** (via `isScenario` prop)

3. **`fetchScenarioQuizWords()` is called** with:
   - `characterId` - Which character's scenario table to query
   - `dialogueId` - Which dialogue within the scenario
   - `scenarioNumber` - The scenario number (for tracking)
   - `targetLanguage` - Language being learned (e.g., 'es' for Spanish)
   - `motherLanguage` - User's native language (e.g., 'en' for English)

4. **Service fetches dialogue from `scenario_{characterId}` table**
   ```typescript
   SELECT * FROM scenario_1 
   WHERE dialogue_id = 2 
   ORDER BY dialogue_step
   ```

5. **Service extracts all text in target language**
   ```typescript
   // Get Spanish text from each phrase
   const allText = dialogueData.map(phrase => phrase.es_text).join(' ');
   ```

6. **Service parses text into individual words**
   ```typescript
   // "¡Hola! ¿Cómo estás?" → ["hola", "cómo", "estás"]
   const words = extractWordsFromDialogue(allText);
   ```

7. **Service queries quiz table for matches**
   ```typescript
   SELECT * FROM quiz 
   WHERE spanish IN ('hola', 'cómo', 'estás', ...)
   LIMIT 5
   ```

8. **Service transforms results to VocalQuizWord format**
   ```typescript
   {
     id: 123,
     dialogue_id: 2,
     entry_in_es: "hola",
     entry_in_en: "hello",
     entry_in_ru: "привет",
     // ... other languages
   }
   ```

9. **Quiz displays matched words** (or completes without quiz if 0 matches)

## Edge Cases Handled

### No Matching Words

If a scenario dialogue contains no words from the quiz table:

```typescript
// Shows success message with auto-completion
if (quizWords.length === 0 && isScenario) {
  // Tracks completion with 100% score
  await trackCompletedScenarioDialogue(userId, characterId, scenarioNumber, dialogueId, 100);
  // Shows: "Great work! This scenario dialogue completed successfully!"
  // User can continue to next dialogue
}
```

### Fewer Than 5 Words

If only 2-4 words match:

```typescript
// Quiz shows only the matched words
// User still needs 60% correct to pass
// Example: 2 words matched → must get 1+ correct to pass
```

### Regular Dialogues Unchanged

Regular (non-scenario) dialogues still use the `words_quiz` table:

```typescript
if (!isScenario) {
  // Original logic - query words_quiz by dialogue_id
  const { data } = await supabase
    .from('words_quiz')
    .select('*')
    .eq('dialogue_id', dialogueId);
}
```

## Progress Tracking

### Scenario Progress Tracking

When a scenario quiz is completed (or auto-completed):

```typescript
await trackCompletedScenarioDialogue(
  userId,           // User's auth ID
  characterId,      // Character ID (1-30)
  scenarioNumber,   // Scenario number (1, 2, 3...)
  dialogueId,       // Dialogue ID within scenario
  score             // Percentage score (0-100)
);
```

This updates the `language_levels` table:

```typescript
{
  scenario_dialogue_progress: Math.max(dialogueId, previous_value),
  scenario_progress: scenarioNumber,
  // ... other fields unchanged
}
```

### Unlocking Next Dialogue

After successful completion:
- `scenario_dialogue_progress` is updated to current `dialogueId`
- Next dialogue in scenario becomes unlocked
- Scenario completion tracked in `scenario_progress` field

## Word Extraction Logic

The `extractWordsFromDialogue()` function:

1. **Converts to lowercase** - "Hola" → "hola"
2. **Removes punctuation** - "¡Hola!" → "hola"
3. **Splits on whitespace** - "hola mundo" → ["hola", "mundo"]
4. **Filters short words** - Removes words < 3 characters (filters out "a", "I", etc.)
5. **Removes duplicates** - ["hola", "hola"] → ["hola"]

```typescript
const words = dialogueText
  .toLowerCase()
  .replace(/[.,!?;:()\"']/g, ' ')
  .split(/\s+/)
  .filter(word => word.length > 2)
  .map(word => word.trim());

return [...new Set(words)]; // Remove duplicates
```

## Language Column Mapping

### Quiz Table Columns
```typescript
const quizColumnMap = {
  'en': 'english',
  'ru': 'russian',
  'es': 'spanish',
  'fr': 'french',
  'de': 'german',
  // ... etc
};
```

### Scenario Table Columns
```typescript
const scenarioColumnMap = {
  'en': 'en_text',
  'ru': 'ru_text',
  'es': 'es_text',
  'fr': 'fr_text',
  'de': 'de_text',
  // ... etc
};
```

## Testing

### Debug Statistics

Use the stats function to check matches:

```typescript
import { getScenarioQuizStats } from '../services/scenarioQuiz';

const stats = await getScenarioQuizStats(1, 2, 'es');
console.log({
  totalDialogueWords: stats.totalDialogueWords,  // e.g., 45
  matchedWords: stats.matchedWords,               // e.g., 8
  availableForQuiz: stats.availableForQuiz        // e.g., 5 (capped)
});
```

### Console Logs

The feature includes comprehensive logging:

```
📚 Fetching scenario quiz words from common words table
Extracted words from dialogue: 45 unique words
✅ Found 5 quiz words for scenario
No quiz words for scenario - completing without quiz
```

## Migration Guide

### For Existing Projects

1. **Create `quiz` table** in Supabase with proper columns
2. **Import common words data** (1000+ rows per language)
3. **No code changes needed** - feature is automatic for scenarios
4. **Test with a scenario dialogue** to verify matching

### Example Quiz Table Data

```csv
id,spanish,english,russian,french,german
1,hola,hello,привет,bonjour,hallo
2,mundo,world,мир,monde,welt
3,cómo,how,как,comment,wie
4,estar,to be,быть,être,sein
5,casa,house,дом,maison,haus
...
```

## Performance Notes

- **Query Efficiency**: Uses `IN` clause with indexed column lookup
- **Limit Applied**: Hard limit of 5 words prevents large result sets
- **No Pre-computation**: Words are matched dynamically (simplifies data management)
- **Caching**: Could add Redis/memory cache for frequent dialogues (future enhancement)

## Future Enhancements

1. **Word Difficulty Scoring** - Prioritize less common words for challenge
2. **Adaptive Selection** - Choose words based on user's history
3. **Custom Word Lists** - Per-scenario curated word lists
4. **Audio Pronunciation** - Include audio files in quiz table
5. **Context Examples** - Store example sentences with each word

## Troubleshooting

### "No quiz words matched from dialogue"

**Cause**: Dialogue words don't match quiz table entries

**Solutions**:
- Check if quiz table has Spanish words populated
- Verify column name is `spanish` (not `es_text` or `entry_in_es`)
- Check if dialogue words are too specialized/uncommon
- View console log to see extracted words vs. table contents

### Progress Not Saving

**Cause**: `trackCompletedScenarioDialogue` might be failing

**Solutions**:
- Check browser console for tracking errors
- Verify `language_levels` table has `scenario_progress` column
- Check RLS policies allow user to update their own records
- Ensure user is logged in (`user.id` is defined)

### Regular Dialogues Showing Scenario Behavior

**Cause**: `isScenario` prop not passed correctly

**Solutions**:
- Verify `DialogueBox` passes `isScenario={true}` to `VocalQuizComponent`
- Check scenario selection sets `isScenario` state variable
- Look for `console.log('isScenario:', isScenario)` in quiz component

---

**Created**: October 9, 2025  
**Version**: 1.0  
**Dependencies**: Supabase, TypeScript, React

