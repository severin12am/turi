# Mission Speech Display Feature

## Overview
Users can now see what they said during mission dialogues before Turi's response. This provides transparency in the speech recognition and approval process.

## User Experience

### When Speech is Approved
```
You said: como estas
  
Sentence approved!
```

### When Speech Needs Correction
```
You said: como te llama

It's better to say "¿Cómo te llamas?" because the verb "llamar" 
needs to be conjugated correctly for questions about names.

¿Cómo te llamas?
```

## Implementation Details

### Files Modified

#### 1. `src/constants/translations.ts`
- Added `youSaid?: string;` to the `TranslationStrings` interface
- Added English translation: `youSaid: 'You said:',`

#### 2. `src/components/DialogueBox.tsx` (lines 3784-3803)
**For approved sentences:**
```typescript
const youSaidLabel = getTranslation(motherLanguage, 'youSaid') || 'You said:';
const approvedLabel = getTranslation(motherLanguage, 'sentenceApproved') || 'Approved!';
setMissionHelperMessage(`${youSaidLabel} ${transcript}\n\n${approvedLabel}`);
```

**For corrected sentences:**
```typescript
const youSaidLabel = getTranslation(motherLanguage, 'youSaid') || 'You said:';
const correctionMsg = `${youSaidLabel} ${transcript}\n\n${decision.explanation}\n\n${decision.correctedSentence}`;
setMissionHelperMessage(correctionMsg);
```

#### 3. `translations-for-supabase.json`
- Added Russian translation: `"Вы сказали:"` (formal "you")

## Localization Support

### Currently Supported
- **English**: "You said:"
- **Russian**: "Вы сказали:"

### Other Languages
For languages without explicit translations, the app automatically falls back to English "You said:" until translations are added to the Supabase database.

### Adding New Language Translations

To add translations for other languages, add entries to `translations-for-supabase.json`:

```json
{
  "language_code": "es",
  "translation_key": "youSaid",
  "translation_value": "Dijiste:"
}
```

**Suggested translations for common languages:**
- Spanish (es): "Dijiste:" or "Has dicho:"
- French (fr): "Vous avez dit :" or "Tu as dit :"
- German (de): "Du hast gesagt:" or "Sie sagten:"
- Chinese (CH): "你说："
- Arabic (ar): "قلت:"
- Portuguese (pt): "Você disse:"
- Hindi (hi): "आपने कहा:"

## Technical Details

### How It Works
1. User speaks in mission dialogue
2. Speech is recognized and stored in `transcript` state
3. Helper robot (Turi) checks the sentence
4. The recognized text is displayed with "You said: [transcript]"
5. Followed by either approval or correction message

### Display Location
The message appears in the Turi Panel (left side of screen) during mission dialogues, styled consistently with other mission feedback.

### Benefits
- **Transparency**: Users see exactly what was recognized
- **Debugging**: Users can identify speech recognition issues
- **Learning**: Users understand what they actually said vs. what was expected
- **Confidence**: Users know their speech was heard correctly

## Testing

To test this feature:
1. Start any mission dialogue
2. Speak a phrase in the target language
3. Observe the Turi panel showing "You said: [your phrase]"
4. See either approval or correction message below

## Notes
- The transcript is captured from the speech recognition API
- Text is displayed exactly as recognized (lowercase, no punctuation from speech)
- The feature works in all mission modes
- No changes required for existing missions

