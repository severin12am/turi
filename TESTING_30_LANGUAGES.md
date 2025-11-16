# Testing Guide: 30 Languages UI

## Quick Test (5 minutes)

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test Language Selection**:
   - Open the app
   - You should see 30 languages in the selection panel
   - Verify they're sorted by global popularity
   - Check that native names display correctly

3. **Test 5 Representative Languages**:
   
   **Left-to-Right (LTR) Languages:**
   - ✅ **Spanish (es)** - Latin script
   - ✅ **Hindi (hi)** - Devanagari script
   - ✅ **Chinese (CH)** - Hanzi characters
   - ✅ **Thai (th)** - Complex script with tone marks
   
   **Right-to-Left (RTL) Languages:**
   - ✅ **Arabic (ar)** - Arabic script (RTL)

4. **For Each Language, Verify**:
   - [ ] Language selection questions are translated
   - [ ] Navigation buttons work and are translated
   - [ ] Character interaction text is translated
   - [ ] Login/signup forms are translated
   - [ ] Error messages appear in the selected language
   - [ ] Dialogue selection screen is translated
   - [ ] All modals (AI dialogue, word explanation) are translated

## Detailed Test (30 minutes)

### LTR Languages to Test:

1. **Latin Script**:
   - English (en)
   - Spanish (es)
   - French (fr)
   - Portuguese (pt)
   - German (de)
   - Italian (it)
   - Turkish (tr)
   - Vietnamese (vi)
   - Polish (pl)
   - Dutch (nl)
   - Romanian (ro)
   - Czech (cs)
   - Swedish (sv)
   - Hungarian (hu)

2. **Cyrillic Script**:
   - Russian (ru)
   - Ukrainian (uk)

3. **Asian Scripts**:
   - Chinese (CH) - Hanzi
   - Japanese (ja) - Kanji/Hiragana/Katakana
   - Korean (ko) - Hangul
   - Thai (th) - Thai script

4. **Indic Scripts**:
   - Hindi (hi) - Devanagari
   - Bengali (bn) - Bengali script
   - Telugu (te) - Telugu script
   - Marathi (mr) - Devanagari
   - Tamil (ta) - Tamil script

5. **Greek**:
   - Greek (el) - Greek alphabet

6. **African**:
   - Swahili (sw) - Latin script

### RTL Languages to Test:

7. **RTL Scripts** (Special attention needed):
   - Arabic (ar) - Arabic script
   - Urdu (ur) - Perso-Arabic script

## Testing Checklist

### Basic UI Elements
- [ ] First question: "Firstly, what language do you already speak?"
- [ ] Second question: "Good, now choose language you want to learn:"
- [ ] Third question: "Perfect! Ready to begin your language journey?"
- [ ] "Your language" label
- [ ] "Language to learn" label
- [ ] "Go Back" button
- [ ] "Start my journey" button

### Character Interaction
- [ ] "Go towards next character..." message
- [ ] "You finished level {X}! Good job. Now let's find {character}" - verify placeholders work
- [ ] "This character is for level {X}. Complete previous levels first."
- [ ] Dialogue controls instructions
- [ ] Quiz controls instructions

### Forms
- [ ] Email field label and placeholder
- [ ] Password field label and placeholder
- [ ] Login button
- [ ] Sign up button
- [ ] "Create Account" button
- [ ] Account-related messages
- [ ] Error messages

### Dialogue System
- [ ] "Select a Dialogue" header
- [ ] "Dialogue" label
- [ ] Status labels: "Completed", "Available", "Locked"
- [ ] Status messages
- [ ] Loading text
- [ ] Error text
- [ ] "Refresh" button

### AI Dialogue Modal
- [ ] "Generate AI Dialogue" button
- [ ] Modal title
- [ ] About section
- [ ] Form labels (length, complexity, theme)
- [ ] Placeholder text
- [ ] Error messages
- [ ] Warning text
- [ ] Length options (Short/Standard/Extended)
- [ ] Complexity levels (Beginner/Intermediate/Advanced)

### Word Explanation Modal
- [ ] "Meaning & Usage" header
- [ ] "Examples" section
- [ ] "Other Forms" section
- [ ] Loading text
- [ ] Error messages
- [ ] AI warning text

## Known Issues to Watch For

### RTL Languages (Arabic, Urdu):
- Text should flow right-to-left
- Numbers may need special handling
- Punctuation might appear on wrong side

### Complex Scripts (Thai, Telugu, Tamil, Bengali):
- Character rendering might have issues in some browsers
- Diacritical marks should display correctly
- Text should not overlap

### Long Translations:
- Some languages are more verbose than English
- Check for text overflow in buttons
- Verify modals don't break layout

## Quick RTL Test

For Arabic and Urdu, verify:

1. **Text Direction**:
   ```
   Wrong: مرحبا Hello     (mixed)
   Right: Hello مرحبا     (properly separated)
   ```

2. **UI Layout**:
   - Buttons should maintain left alignment in code (CSS handles RTL)
   - Modal dialogs should work correctly
   - Forms should be usable

3. **Numbers**:
   - English numbers (1, 2, 3) should stay LTR in Arabic text
   - Level numbers like {level} should work correctly

## Browser Compatibility

Test in:
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## Reporting Issues

If you find any issues:

1. **Translation Error**: The English text appears instead
   - Check: Is the key missing in that language's translation?
   - Fallback to English is expected and working correctly

2. **Display Error**: Text is garbled or overlapping
   - Note: Browser and font (affects complex scripts)
   - Check: CSS might need adjustment for that script

3. **Layout Error**: UI breaks or buttons don't fit
   - Note: Which language and which component
   - Check: Text might be too long for container

## Success Criteria

The UI is working correctly if:

1. ✅ All 30 languages appear in selection
2. ✅ Selecting any language changes all UI text
3. ✅ No English text appears (except character names if not localized)
4. ✅ Placeholders (`{level}`, `{character}`) work correctly
5. ✅ All modals and forms are usable
6. ✅ RTL languages display properly
7. ✅ Complex scripts render without overlapping
8. ✅ Users can complete the full flow in any language

## After Testing

Once testing is complete:
1. Mark any issues in GitHub/your issue tracker
2. For translation fixes, you can:
   - Edit `src/constants/translations.ts` directly
   - Or provide corrections for AI re-translation
3. For layout issues:
   - Check CSS in the affected component
   - May need max-width or text-overflow handling
4. For RTL issues:
   - Check if `dir="rtl"` is applied when needed
   - Verify CSS doesn't hardcode left/right positioning

---

**Ready to test? Just run `npm run dev` and start clicking through languages!** 🚀

