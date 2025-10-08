# Full Dialogue Replay Feature Implementation

## Overview
This feature allows users to listen to the entire completed dialogue as a cohesive conversation, with NPC phrases spoken via text-to-speech and user phrases played from their recordings. It provides a natural way to review the full conversation flow.

## What Was Implemented

### 1. New State Variable
Added `isPlayingFullDialogue` to track playback status:

```typescript
const [isPlayingFullDialogue, setIsPlayingFullDialogue] = useState(false);
```

### 2. Core Playback Function: `playFullDialogue()`
An async function that orchestrates sequential playback of the entire dialogue:

**How it works:**
1. Filters conversation history to get all completed entries
2. Sorts entries by step number (chronological order)
3. Loops through each entry:
   - **For NPC entries**: Plays phrase using text-to-speech (Web Speech API)
   - **For User entries**: Plays recorded audio (if available)
   - Adds appropriate pauses between speakers (500ms after speech, 200ms between entries)
4. Handles errors gracefully (continues playback even if one entry fails)
5. Updates state when playback completes

**Key Features:**
- ✅ Plays dialogue in correct order
- ✅ Uses native browser TTS for NPC (matches original audio)
- ✅ Uses user's actual recordings for their phrases
- ✅ Natural pauses between speakers
- ✅ Can be stopped mid-playback
- ✅ Error-resilient (skips missing recordings)
- ✅ Console logging for debugging

### 3. Helper Functions

#### `playAudioWithPromise(text: string)`
- Wraps text-to-speech in a Promise for async/await support
- Uses same language settings as dialogue
- Rate: 0.9 (slightly slower for clarity)
- Returns promise that resolves when speech ends
- Handles errors without breaking playback chain

#### `playRecordingWithPromise(recording: Blob)`
- Wraps audio playback in a Promise for async/await support
- Creates temporary audio URL from Blob
- Auto-cleans up URL after playback
- Returns promise that resolves when audio ends
- Handles errors without breaking playback chain

#### `stopFullDialogue()`
- Immediately stops playback
- Cancels any active speech synthesis
- Updates state to `isPlayingFullDialogue = false`
- Breaks the playback loop

### 4. UI Button
Added a dynamic button next to "Continue to Quiz":

**When NOT Playing:**
- 🎭 Icon + "Replay Full Dialogue" text
- Blue background (#3b82f6)
- Hover: Darker blue (#2563eb)

**When Playing:**
- ⏹️ Icon + "Stop Playback" text
- Red background (#ef4444)
- Hover: Darker red (#dc2626)
- Same button toggles between play and stop

**Button Layout:**
```
+----------------------------------+
| 🎉 Great job! Dialogue complete! |
+----------------------------------+
| [🎭 Replay Full Dialogue] [Continue to Quiz →] |
+--------------------------------------------------+
|  Review your dialogue or replay full conversation |
+--------------------------------------------------+
```

### 5. Cleanup and Safety

#### Stop on Return Button
- When user clicks return button, stops any active playback
- Prevents playback from continuing with outdated state

#### Stop on Component Unmount
- Cleanup useEffect stops speech synthesis on unmount
- Prevents speech from continuing after leaving dialogue

#### Graceful Handling
- Missing user recordings are skipped (with console log)
- Speech synthesis errors don't break the chain
- Audio playback errors don't break the chain

## User Experience

### Normal Flow
```
Complete dialogue
        ↓
Click "🎭 Replay Full Dialogue"
        ↓
Hear NPC: "Hello, how are you?"
        ↓
Pause (500ms)
        ↓
Hear Your Recording: "I'm fine, thank you"
        ↓
Pause (500ms)
        ↓
Continue through entire dialogue...
        ↓
Playback completes
        ↓
Button returns to "Replay" state
```

### Stop Mid-Playback
```
Playback in progress
        ↓
Click "⏹️ Stop Playback"
        ↓
Immediate stop
        ↓
Button returns to "Replay" state
```

### Missing Recordings
```
Playing step 3 (User)
        ↓
No recording found
        ↓
Console: "No recording for step 3, skipping"
        ↓
Brief pause (300ms)
        ↓
Continue to next step
```

## Technical Details

### Async/Await Pattern
Uses modern async/await for clean sequential playback:
```javascript
for (const entry of completedEntries) {
  if (entry.speaker === 'NPC') {
    await playAudioWithPromise(entry.phrase);
  } else {
    await playRecordingWithPromise(recording);
  }
  await new Promise(resolve => setTimeout(resolve, 200));
}
```

### Promise-Based Audio
Both TTS and recording playback return Promises:
- Allows sequential execution with await
- Enables proper timing and synchronization
- Provides clean error handling

### State Management
- `isPlayingFullDialogue`: Boolean flag
- Used for:
  - Button text/color changes
  - Loop continuation check
  - Cleanup on component events

### Timing Configuration
```javascript
After NPC speech: 500ms pause
After User recording: 500ms pause
Between entries: 200ms pause
Missing recording: 300ms pause
```

These create natural conversation rhythm.

### Browser APIs Used
1. **Web Speech API** (SpeechSynthesisUtterance)
   - For NPC text-to-speech
   - Same API used throughout DialogueBox
   
2. **Audio API** (HTMLAudioElement)
   - For playing user recordings
   - Blob URLs for temporary audio access

3. **Promises & Async/Await**
   - For sequential playback control
   - Clean error handling

## Browser Compatibility

### Web Speech API (TTS)
- ✅ Chrome/Edge: Full support
- ✅ Safari: Full support
- ✅ Firefox: Full support (may have voice quality differences)
- ✅ Opera: Full support

### Audio Playback (Blob URLs)
- ✅ All modern browsers support Audio and Blob URLs

### Async/Await
- ✅ All modern browsers (ES2017+)

## Performance

- **Memory**: Minimal - Blobs already in memory
- **CPU**: Light - Browser handles TTS and audio playback
- **Network**: None - All local playback
- **Responsive**: Immediate stop capability
- **Scalable**: Works with dialogues of any length

## Use Cases

1. **Self-Review**: Hear yourself speaking the dialogue
2. **Pronunciation Check**: Compare your recordings to NPC
3. **Flow Understanding**: Experience dialogue as conversation
4. **Confidence Building**: Review before moving to quiz
5. **Error Detection**: Notice if you mispronounced something
6. **Learning Reinforcement**: Hear complete conversation multiple times

## Debugging Features

### Console Logging
- ✅ "Starting full dialogue playback"
- ✅ "Playing step X: NPC/User - 'phrase'"
- ✅ "No recording found for step X"
- ✅ "Playback stopped by user"
- ✅ "Full dialogue playback complete"
- ✅ Error logging with context

### Error Handling
- TTS errors logged but playback continues
- Audio errors logged but playback continues
- Missing recordings logged and skipped
- All errors include context (step, entry type)

## Future Enhancements

Possible improvements:
1. **Progress Indicator** - Show which step is playing
2. **Speed Control** - Allow faster/slower playback
3. **Visual Highlighting** - Highlight current entry during playback
4. **Subtitle Display** - Show current phrase text during playback
5. **Download Option** - Export full dialogue as audio file
6. **Pause/Resume** - Pause instead of only stop
7. **Skip Forward/Back** - Jump to specific steps
8. **Loop Option** - Automatically replay continuously

## Testing Checklist

- [x] Button appears when dialogue complete
- [x] Button plays full dialogue when clicked
- [x] NPC phrases use text-to-speech
- [x] User phrases use recordings
- [x] Correct sequential order
- [x] Appropriate pauses between speakers
- [x] Button changes to "Stop" during playback
- [x] Stop button immediately stops playback
- [x] Missing recordings are skipped gracefully
- [x] Playback stops on return button
- [x] Playback stops on component unmount
- [x] No linter errors
- [x] Console logging works correctly

## Files Modified

- `src/components/DialogueBox.tsx` - All changes in this file

## Code Statistics

- **New state**: 1 variable (`isPlayingFullDialogue`)
- **New functions**: 4 (`playFullDialogue`, `stopFullDialogue`, `playAudioWithPromise`, `playRecordingWithPromise`)
- **Modified functions**: 2 (`handleGoBack`, cleanup useEffect)
- **New UI**: 1 dynamic button (toggles between play and stop)
- **Lines added**: ~180

