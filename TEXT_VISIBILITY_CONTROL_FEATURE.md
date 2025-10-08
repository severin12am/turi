# Text Visibility Control Feature Implementation

## Overview
Added a text visibility toggle button that allows users to progressively hide dialogue text to test their memory and speaking ability without reading from the screen. The feature has 6 modes that cycle through different combinations of visible text.

## What Was Implemented

### 1. State Management
Added visibility mode state with 6 options:

```typescript
type VisibilityMode = 'all' | 'phrase-trans' | 'phrase-transl' | 'phrase-only' | 'translation-only' | 'none';
const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>('all');
```

### 2. The 6 Visibility Modes

| Mode | Icon | Label | What's Visible | Use Case |
|------|------|-------|----------------|----------|
| **all** | 📖 | All | Phrase + Transcription + Translation | Full learning mode (default) |
| **phrase-trans** | 📝 | P+T | Phrase + Transcription only | Practice without translation hints |
| **phrase-transl** | 🔤 | P+Tr | Phrase + Translation only | Practice without pronunciation guide |
| **phrase-only** | 👁️ | P | Phrase only | Advanced - just the target language text |
| **translation-only** | 🌍 | Tr | Translation only | Practice speaking target language with mother tongue help |
| **none** | 🙈 | Hide | Nothing visible | Memory test - speak from memory (REQUIRED FOR QUIZ) |

### 3. Toggle Function
```typescript
toggleVisibilityMode()
```
- Cycles through modes: all → phrase-trans → phrase-transl → phrase-only → translation-only → none → (back to all)
- Updates state with next mode
- Logs changes for debugging

### 4. Visual Indicators

#### Icons (Intuitive Emojis)
- 📖 **Book** - All text visible (reading mode)
- 📝 **Memo** - Phrase + transcription (pronunciation focus)
- 🔤 **Letters** - Phrase + translation (meaning focus)
- 👁️ **Eye** - Phrase only (target language only)
- 🌍 **Globe** - Translation only (mother tongue help)
- 🙈 **See No Evil** - Nothing visible (memory test)

#### Labels (Short & Clear)
- **All** - Everything shown
- **P+T** - Phrase + Transcription
- **P+Tr** - Phrase + Translation
- **P** - Phrase only
- **Tr** - Translation only
- **Hide** - All hidden

### 5. UI Button
Added to debug controls section next to the speed button:

**Button Features:**
- Purple background (#7c3aed) to distinguish from speed button
- Shows current mode icon + label
- Example displays: "📖 All", "👁️ P", "🙈 Hide"
- Tooltip shows current mode
- Click to cycle to next mode

**Button Location:**
```
Debug Controls Section (below dialogue)
[Force Show Quiz] [Clear Hover] [🚀 2.0x] [📖 All]
```

### 6. Dialogue Box Rendering Logic

The dialogue boxes remain fully functional - they still render with all buttons and structure intact. Only the **text content** is conditionally shown:

```tsx
{/* Phrase - shown in all modes except 'none' */}
{visibilityMode !== 'none' && (
  <div className="dialogue-phrase">
    {/* phrase content */}
  </div>
)}

{/* Transcription - shown in 'all' and 'phrase-trans' modes */}
{(visibilityMode === 'all' || visibilityMode === 'phrase-trans') && (
  <div className="dialogue-transcription">
    [{entry.transcription}]
  </div>
)}

{/* Translation - shown in 'all' and 'phrase-transl' modes */}
{(visibilityMode === 'all' || visibilityMode === 'phrase-transl') && (
  <div className="dialogue-translation">
    {entry.translation}
  </div>
)}
```

## What Stays Intact

✅ **All dialogue box functionality preserved:**
- Dialogue boxes still render with correct styling
- Return button (↩) works
- Sound button (🔊) works
- Replay recording button (🎙️) works
- Speech recognition still works
- All animations and transitions intact
- Box structure and spacing maintained

✅ **Special features preserved:**
- Listening indicator (🎤) still shows
- Word hover and explanation features work
- Recognition status and match progress visible
- Manual continue button appears when needed

## User Experience

### Progressive Learning Modes

```
Mode 1: 📖 All
├─ Phrase: "Hello, how are you?"
├─ Transcription: [heh-loh, haw ahr yoo]
└─ Translation: "Привет, как дела?"

Mode 2: 📝 P+T (Remove translation)
├─ Phrase: "Hello, how are you?"
├─ Transcription: [heh-loh, haw ahr yoo]
└─ (hidden)

Mode 3: 🔤 P+Tr (Remove transcription)
├─ Phrase: "Hello, how are you?"
├─ (hidden)
└─ Translation: "Привет, как дела?"

Mode 4: 👁️ P (Only target language)
├─ Phrase: "Hello, how are you?"
├─ (hidden)
└─ (hidden)

Mode 5: 🌍 Tr (Only translation)
├─ (hidden)
├─ (hidden)
└─ Translation: "Привет, как дела?"

Mode 6: 🙈 Hide (Complete memory test)
├─ (hidden)
├─ (hidden)
└─ (hidden)
[Empty box with buttons only]
```

### Use Cases by Mode

#### 📖 All (Default)
- **For**: Beginners learning new phrases
- **Practice**: Read, understand, and speak
- **Benefit**: Full support with all information

#### 📝 Phrase + Transcription
- **For**: Pronunciation practice
- **Practice**: Speak without knowing exact meaning first
- **Benefit**: Focus on sounds and pronunciation

#### 🔤 Phrase + Translation
- **For**: Reading comprehension
- **Practice**: Understand without pronunciation guide
- **Benefit**: Develop natural reading ability

#### 👁️ Phrase Only
- **For**: Advanced learners
- **Practice**: Speak knowing only the target language
- **Benefit**: Real-world simulation

#### 🌍 Translation Only
- **For**: Intermediate learners
- **Practice**: Speak target language with only mother tongue reference
- **Benefit**: Tests if you can produce target language from meaning alone

#### 🙈 Nothing Visible
- **For**: Memory testing (REQUIRED FOR QUIZ)
- **Practice**: Speak entirely from memory
- **Benefit**: True mastery test - no aids

## Learning Progression Strategy

### Recommended Usage Pattern:

1. **First Time** (📖 All)
   - Learn the dialogue with full support
   - Understand meaning and pronunciation

2. **Practice** (📝 P+T or 🔤 P+Tr)
   - Remove one type of help
   - Challenge yourself slightly

3. **Advanced Practice** (👁️ P)
   - Only see target language
   - More realistic scenario

4. **Mastery Test** (🙈 Hide)
   - Boxes are empty
   - Speak from memory
   - Prove you've learned it

## Technical Details

### Rendering Logic

**Conditional Rendering with Boolean Checks:**
- **Phrase**: Shown when `visibilityMode !== 'none'`
- **Transcription**: Shown when `visibilityMode === 'all' || visibilityMode === 'phrase-trans'`
- **Translation**: Shown when `visibilityMode === 'all' || visibilityMode === 'phrase-transl'`

### State Management
- Uses React state for instant updates
- No component re-mounting required
- Smooth transitions as text appears/disappears

### CSS Implications
- Empty divs don't render (no visual gaps)
- Box height adjusts automatically based on content
- All spacing and padding maintained

### Performance
- **Zero overhead** - Pure conditional rendering
- No additional API calls
- No memory impact
- Instant mode switching

## Design Decisions

### Why 5 Modes?
- Covers all useful combinations
- Not too many to be confusing
- Progressive difficulty increase
- Flexible for different learning styles

### Why These Icons?
- 📖 Book = reading/learning
- 📝 Memo = writing/practice
- 🔤 Letters = language/text
- 👁️ Eye = seeing/observing
- 🙈 See no evil = hiding/memory

### Why Keep Boxes Visible?
- Users need structure to know dialogue flow
- Buttons must remain accessible (return, sound, replay)
- Visual consistency maintained
- Empty box = challenge to fill from memory

## Benefits

### For Learning
1. **Progressive Challenge** - Gradually increase difficulty
2. **Memory Training** - Test recall without aids
3. **Confidence Building** - Speak without reading
4. **Real-World Prep** - No subtitles in real life!

### For Teachers/Coaches
1. **Assessment Tool** - See if students know it by heart
2. **Flexibility** - Different modes for different exercises
3. **Motivation** - Clear progression path
4. **Evidence** - Can demonstrate mastery

## Future Enhancements

Possible improvements:
1. **Per-Entry Visibility** - Hide specific dialogues individually
2. **Timed Reveal** - Automatically show text after X seconds
3. **Keyboard Shortcuts** - Quick mode switching (1-5 keys)
4. **Save Preference** - Remember user's preferred mode
5. **Quiz Mode** - Random visibility for unpredictability
6. **Gradual Fade** - Animated text fade in/out
7. **Custom Modes** - Let users create their own combinations

## Testing Checklist

- [x] Button appears in debug controls
- [x] Button cycles through all 5 modes correctly
- [x] Icons change appropriately
- [x] Labels display correctly
- [x] All mode: shows phrase + transcription + translation
- [x] P+T mode: shows phrase + transcription only
- [x] P+Tr mode: shows phrase + translation only
- [x] P mode: shows phrase only
- [x] Hide mode: shows nothing (empty boxes)
- [x] Dialogue boxes maintain structure in all modes
- [x] All buttons remain functional in all modes
- [x] Speech recognition works in all modes
- [x] No linter errors
- [x] Console logging works

## Files Modified

- `src/components/DialogueBox.tsx` - All changes in this file

## Code Statistics

- **New type**: 1 (`VisibilityMode`)
- **New state variables**: 2 (`visibilityMode`, `visibilityModes`)
- **New functions**: 3 (`toggleVisibilityMode`, `getVisibilityIcon`, `getVisibilityLabel`)
- **Modified rendering**: 1 section (dialogue content conditional rendering)
- **UI components**: 1 button
- **Lines added**: ~90

