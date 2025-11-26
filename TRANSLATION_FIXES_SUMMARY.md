# Translation Fixes Summary

## Issues Fixed

### 1. **Missing Translation Keys**
Added the following new translation keys to `src/constants/translations.ts`:
- `speak` - For the "Speak" button in missions
- `stop` - For the "Stop" button when recording
- `missionInstructions` - For the mission instruction text
- `ifStuck` - For the "If stuck →" hint text in dialogues
- `continueArrow` - For the "Continue →" button in dialogues
- `generatingSuggestion` - For the "Generating suggestion..." status message

### 2. **Hardcoded Mission Instructions**
**File:** `src/components/DialogueBox.tsx` (line ~1423)

**Before:**
```typescript
const initMsg = motherLanguage === 'ru' 
  ? `Миссия: ${mission.goal}\n\nНажмите кнопку или начните говорить`
  : `Mission: ${mission.goal}\n\nClick "Help me" and I will make up a sentence for you! Or click "Speak" and start the conversation`;
```

**After:**
```typescript
const missionLabel = getTranslation(motherLanguage, 'mission');
const missionGoalKey = `mission${mission.scenarioNumber}_${mission.missionNumber}` as any;
const missionGoal = getTranslation(motherLanguage, missionGoalKey) || mission.goal;
const instructions = getTranslation(motherLanguage, 'missionInstructions');
const initMsg = `${missionLabel}: ${missionGoal}\n\n${instructions}`;
```

Now supports all 30 languages instead of just Russian and English!

### 3. **Stop Button Translation**
**File:** `src/components/DialogueBox.tsx` (line ~5019)

**Before:**
```typescript
{isListening ? 'Stop' : getTranslation(motherLanguage, 'speak')}
```

**After:**
```typescript
{isListening ? getTranslation(motherLanguage, 'stop') : getTranslation(motherLanguage, 'speak')}
```

### 4. **Mission Goals in HelperRobotPanel**
**File:** `src/components/HelperRobotPanel.tsx` (line ~790)

**Before:**
```typescript
{mission.goal}
```

**After:**
```typescript
{getTranslation(motherLanguage, `mission${mission.scenarioNumber}_${mission.missionNumber}` as any)}
```

### 5. **Mission Goals in DialogueSelectionPanel**
**File:** `src/components/DialogueSelectionPanel.tsx` (line ~721)

**Before:**
```typescript
{mission.goal}
```

**After:**
```typescript
{getTranslation(motherLanguage, `mission${mission.scenarioNumber}_${mission.missionNumber}` as any)}
```

---

## What You Need to Add to Supabase

Your `translations` table needs these additional rows for **each language**. Here's the list for Spanish (`language_code = 'es'`):

### New UI Keys to Add:

| language_code | translation_key | translation_value (Spanish example) |
|---------------|-----------------|-------------------------------------|
| es | speak | Hablar |
| es | stop | Detener |
| es | missionInstructions | ¡Haz clic en "Ayúdame" y crearé una oración para ti! O haz clic en "Hablar" y comienza la conversación |
| es | ifStuck | Si estás atascado → |
| es | continueArrow | Continuar → |
| es | generatingSuggestion | Generando sugerencia... |

### Mission Goal Keys (150 total):

You need to add translations for all mission goals: `mission1_1` through `mission30_5`

**Example for Scenario 1 (Social greetings):**

| language_code | translation_key | translation_value (Spanish example) |
|---------------|-----------------|-------------------------------------|
| es | mission1_1 | Averiguar el nombre completo de la persona |
| es | mission1_2 | Averiguar de dónde es la persona |
| es | mission1_3 | Averiguar qué hace la persona (trabajo/estudio) |
| es | mission1_4 | Averiguar algo que le gusta hacer |
| es | mission1_5 | Conseguir el número de teléfono de la persona |

### Scenario Name Keys (30 total):

You also need: `scenario1` through `scenario30`

**Example:**

| language_code | translation_key | translation_value (Spanish example) |
|---------------|-----------------|-------------------------------------|
| es | scenario1 | Saludos sociales e introducciones |
| es | scenario2 | Conversaciones casuales con amigos o conocidos |
| es | scenario3 | Reuniones familiares y discusiones |

---

## How to Verify

1. **Check Console Output:**
   After reloading your app, check the browser console for:
   ```
   ℹ️ X UI strings missing for es, using English fallback
   ```
   This tells you how many translations are still missing.

2. **Test Specific Features:**
   - Language selection screen → Check "Ready to begin your journey!" text
   - Mission selection → Check mission goal descriptions
   - Mission conversation → Check "Speak" button and instructions

3. **Quick SQL to Check What's Missing:**
   ```sql
   -- Check if you have all mission keys for Spanish
   SELECT COUNT(*) FROM translations 
   WHERE language_code = 'es' 
   AND translation_key LIKE 'mission%';
   -- Should return 150 (30 scenarios × 5 missions)
   
   -- Check if you have all scenario keys
   SELECT COUNT(*) FROM translations 
   WHERE language_code = 'es' 
   AND translation_key LIKE 'scenario%';
   -- Should return 30
   ```

---

## Complete Translation Key Reference

See `src/constants/translations.ts` lines 388-762 for the complete English reference of all 200+ translation keys that need to be in your Supabase table for each language.

### Key Pattern Examples:
- UI strings: `ready`, `speak`, `helpMe`, `back`, etc.
- Scenarios: `scenario1`, `scenario2`, ..., `scenario30`
- Missions: `mission1_1`, `mission1_2`, ..., `mission30_5`
- Character names: `characterNames.1`, `characterNames.2`, etc.

---

## Testing After Adding Translations

1. Clear your browser cache or do a hard refresh (Ctrl+Shift+R)
2. Select Spanish as your mother language
3. Navigate through the app and verify all text is in Spanish
4. Check the browser console for any remaining missing translation warnings

