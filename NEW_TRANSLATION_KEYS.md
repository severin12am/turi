# New Translation Keys to Add to Supabase

## Complete List of New UI Translation Keys

Add these rows to your `translations` table for **EACH language** (replace `es` with the appropriate language code):

| translation_key | translation_value (English Reference) | Spanish Example |
|-----------------|--------------------------------------|-----------------|
| `speak` | Speak | Hablar |
| `stop` | Stop | Detener |
| `missionInstructions` | Click "Help me" and I will make up a sentence for you! Or click "Speak" and start the conversation | ¡Haz clic en "Ayúdame" y crearé una oración para ti! O haz clic en "Hablar" y comienza la conversación |
| `ifStuck` | If stuck → | Si estás atascado → |
| `continueArrow` | Continue → | Continuar → |
| `generatingSuggestion` | Generating suggestion... | Generando sugerencia... |
| `sentenceStructure` | Sentence Structure | Estructura de la oración |
| `searchInGoogle` | Search in Google | Buscar en Google |
| `playPronunciationTooltip` | Play pronunciation | Reproducir pronunciación |
| `showExplanationTooltip` | Show explanation | Mostrar explicación |
| `addToDictionary` | Add to dictionary | Agregar al diccionario |
| `signInToAddWords` | Sign in to add words to dictionary | Inicia sesión para agregar palabras al diccionario |
| `explainSentenceStructure` | Explain sentence structure | Explicar estructura de la oración |
| `goBackToPreviousStep` | Go back to previous step | Volver al paso anterior |
| `replayYourRecording` | Replay your recording | Reproducir tu grabación |
| `completeDialogueFirst` | Complete dialogue first | Completa el diálogo primero |
| `stopPlayback` | Stop playback | Detener reproducción |
| `replayFullDialogue` | Replay full dialogue | Reproducir diálogo completo |
| `turiPreparingQuiz` | Turi is preparing your quiz... | Turi está preparando tu cuestionario... |
| `goToQuiz` | Go to Quiz | Ir al cuestionario |
| `checkingSentence` | Checking... | Comprobando... |
| `errorCheckingSentence` | Error checking sentence. Please try again. | Error al comprobar la oración. Inténtalo de nuevo. |
| `clickMeToSeeProgress` | Click me to see your progress! | ¡Haz clic para ver tu progreso! |
| `clickMeToCreateAccount` | Click me to create an account! | ¡Haz clic para crear una cuenta! |
| `clickMe` | Click me! | ¡Haz clic! |

---

## Mission and Scenario Keys (Still Need Translation)

### Mission Goals (150 keys total)
Format: `mission{scenarioNum}_{missionNum}` (e.g., `mission1_1`, `mission1_2`, etc.)

**Full list from `mission1_1` to `mission30_5`**

Refer to `src/constants/translations.ts` lines 612-761 for the complete English text of all 150 mission goals.

### Scenario Names (30 keys total)
Format: `scenario{num}` (e.g., `scenario1`, `scenario2`, etc.)

**Full list from `scenario1` to `scenario30`**

Refer to `src/constants/translations.ts` lines 580-609 for the complete English text of all 30 scenario names.

---

## SQL Template to Insert Translation

Use this template to insert a new translation:

```sql
INSERT INTO translations (language_code, translation_key, translation_value)
VALUES ('es', 'speak', 'Hablar');
```

Or batch insert:

```sql
INSERT INTO translations (language_code, translation_key, translation_value) VALUES
('es', 'speak', 'Hablar'),
('es', 'stop', 'Detener'),
('es', 'missionInstructions', '¡Haz clic en "Ayúdame" y crearé una oración para ti! O haz clic en "Hablar" y comienza la conversación'),
-- ... add more rows
;
```

---

---

## ✅ Fixed: Removed Duplicate Translation Keys

**Issue:** There were duplicate/similar keys causing confusion:
- ❌ Removed: `firstQuestion`, `secondQuestion`, `readyQuestion` (from unused LanguagePanel component)
- ✅ Kept: `whatLanguage`, `whatToLearn`, `ready` (used by active HelperRobot component)

**This explains why you had confusion with "ready" vs "readyQuestion" in Supabase!**

The app now only uses the HelperRobot keys, so you only need to translate:
- `whatLanguage` 
- `whatToLearn`
- `ready`

---

## ✅ All Known Issues FIXED!

### 1. **CSS "Click me!" Text** ✅ FIXED
**Fixed in:** `src/components/HelperRobot.tsx` & `src/index.css`
- Moved hardcoded CSS tooltip to React component with hover state
- Now uses `getTranslation(motherLanguage, 'clickMe')` for translation support
- Removed CSS ::after pseudo-element

### 2. **Transliteration Direction** ✅ FIXED
**Fixed in:** `src/services/aiService.ts`
- Updated `generateHelpSuggestion` prompt with correct mother language script examples
- Updated `generateAIDialogue` prompt with examples for both Russian→English and English→Spanish
- Clear instructions to AI: "IMPORTANT: The transliteration must use ${motherLangName} script to approximate how the ${sourceLangName} sounds, NOT English phonetics."

**Example fixes:**
- ✅ For Russian speakers learning English: `[вотс ёр нейм]` instead of `[vot iz vayr ful naym]`
- ✅ For English speakers learning Spanish: `[como te yamas]` instead of `[KOH-moh teh YAH-mahs]`

### 3. **AI Explanation Language** ✅ FIXED
**Fixed in:** `src/services/aiService.ts` (function `generateTextExplanation`)
- Updated prompt to explicitly require explanation in mother language
- Added: "IMPORTANT: Write ONLY in ${motherLangName}. Do NOT use English."
- Now explanations will be generated in the user's native language (Russian, Spanish, etc.)

---

## Verification Checklist

After adding all translations:

- [ ] All 25+ new UI keys added for each language
- [ ] All 150 mission goals (`mission1_1` to `mission30_5`) translated
- [ ] All 30 scenario names (`scenario1` to `scenario30`) translated
- [ ] Character names translated (if needed: `characterNames.1`, etc.)
- [ ] Clear browser cache and test
- [ ] Check console for "X UI strings missing" message
- [ ] Test with actual language selection (e.g., Spanish/Russian)

---

## Quick Test SQL Queries

```sql
-- Count your UI translations for Spanish
SELECT COUNT(*) FROM translations WHERE language_code = 'es';
-- Should be ~25 new UI keys + 150 missions + 30 scenarios = 205+ keys

-- Check if specific new keys exist
SELECT translation_key, translation_value 
FROM translations 
WHERE language_code = 'es' 
AND translation_key IN ('speak', 'stop', 'sentenceStructure', 'clickMe');

-- Find missing mission keys for Spanish
SELECT 'mission' || s.num || '_' || m.num as missing_key
FROM generate_series(1, 30) s(num)
CROSS JOIN generate_series(1, 5) m(num)
WHERE NOT EXISTS (
  SELECT 1 FROM translations 
  WHERE language_code = 'es' 
  AND translation_key = 'mission' || s.num || '_' || m.num
);
```

---

## Reference Files

- **English source:** `src/constants/translations.ts` (lines 388-768)
- **Translation loader:** `src/services/translationLoader.ts`
- **Fallback service:** `src/services/translationFallback.ts`

