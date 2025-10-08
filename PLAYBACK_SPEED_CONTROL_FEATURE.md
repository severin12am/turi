# Playback Speed Control Feature Implementation

## Overview
Added a playback speed control button that allows users to adjust the speed of all audio playback in the dialogue system. The button cycles through 6 different speeds and affects both NPC speech (text-to-speech) and user recording playback.

## What Was Implemented

### 1. State Management
Added playback speed state and available speed options:

```typescript
const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
const speedOptions = [0.6, 0.8, 1.0, 1.2, 1.4, 2.0];
```

### 2. Speed Toggle Function
```typescript
togglePlaybackSpeed()
```
- Cycles through speed options: 0.6x → 0.8x → 1.0x → 1.2x → 1.4x → 2.0x → (back to 0.6x)
- Updates state with next speed
- Logs changes for debugging

### 3. Dynamic Speed Icons
```typescript
getSpeedIcon(speed)
```
Maps speeds to intuitive icons:
- **0.6x**: 🐢 (Turtle - Very slow)
- **0.8x**: 🚶 (Walking - Slow)
- **1.0x**: ▶️ (Play - Normal speed)
- **1.2x**: 🏃 (Running - Fast)
- **1.4x**: ⚡ (Lightning - Very fast)
- **2.0x**: 🚀 (Rocket - Maximum speed)

### 4. Speed Applied to All Audio Playback

#### A. NPC Speech During Dialogue (`playAudio`)
```typescript
utterance.rate = playbackSpeed;
```
- Applied to text-to-speech for NPC phrases
- Works during normal dialogue flow
- Affects both enhanced pronunciation (AI) and browser TTS

#### B. Individual User Recording Playback (`playUserRecording`)
```typescript
audio.playbackRate = playbackSpeed;
```
- Applied when clicking 🎙️ button on completed user phrases
- Affects single recording playback

#### C. Full Dialogue Replay - NPC (`playAudioWithPromise`)
```typescript
utterance.rate = playbackSpeed;
```
- Applied to NPC speech during full dialogue replay
- Consistent speed throughout conversation

#### D. Full Dialogue Replay - User (`playRecordingWithPromise`)
```typescript
audio.playbackRate = playbackSpeed;
```
- Applied to user recordings during full dialogue replay
- Matches NPC speech speed for consistency

### 5. UI Button
Added to debug controls section (development mode only):

**Button Features:**
- Blue background (#2563eb)
- Shows current speed icon + speed value
- Example displays: "🐢 0.6x", "▶️ 1.0x", "🚀 2.0x"
- Tooltip shows current speed and instructions
- Click to cycle to next speed
- Flexbox layout with other debug buttons

**Button Location:**
```
Debug Controls Section (below dialogue)
[Force Show Quiz] [Clear Hover Buttons] [🚀 2.0x]
```

## User Experience

### Speed Progression
```
Click 1: 🐢 0.6x (Very slow - good for beginners)
        ↓
Click 2: 🚶 0.8x (Slow - careful listening)
        ↓
Click 3: ▶️ 1.0x (Normal - default speed)
        ↓
Click 4: 🏃 1.2x (Fast - efficient review)
        ↓
Click 5: ⚡ 1.4x (Very fast - advanced)
        ↓
Click 6: 🚀 2.0x (Maximum - time saving)
        ↓
Click 7: 🐢 0.6x (Cycles back)
```

### Affected Scenarios

1. **During Dialogue**
   - NPC speaks at selected speed
   - Helps beginners understand better (slower)
   - Helps advanced learners save time (faster)

2. **Individual Recording Playback**
   - Click 🎙️ on any user phrase
   - Plays at current speed setting
   - Review your pronunciation faster/slower

3. **Full Dialogue Replay**
   - Click "🎭 Replay Full Dialogue"
   - Entire conversation plays at selected speed
   - Both NPC and user parts match speed

## Technical Details

### Browser API Support

#### Text-to-Speech Speed
- **API**: `SpeechSynthesisUtterance.rate`
- **Range**: 0.1 to 10 (we use 0.6 to 2.0)
- **Browser Support**: All modern browsers
- **Quality**: Excellent - browser native

#### Audio Playback Speed
- **API**: `HTMLAudioElement.playbackRate`
- **Range**: 0.0625 to 16 (we use 0.6 to 2.0)
- **Browser Support**: All modern browsers
- **Quality**: Excellent - pitch preserved

### Speed Selection Rationale

| Speed | Use Case | Icon | Description |
|-------|----------|------|-------------|
| 0.6x  | Absolute beginners | 🐢 | Very slow, clear pronunciation |
| 0.8x  | Beginners | 🚶 | Slow enough to catch details |
| 1.0x  | Default | ▶️ | Natural speaking speed |
| 1.2x  | Quick review | 🏃 | Slightly faster, still clear |
| 1.4x  | Advanced learners | ⚡ | Fast but comprehensible |
| 2.0x  | Time saving | 🚀 | Maximum practical speed |

### State Persistence
- Speed setting persists during dialogue session
- Resets to 1.0x when component unmounts
- Not saved to localStorage (session-specific preference)

### Performance Impact
- **Minimal** - Native browser APIs
- No additional CPU overhead
- No memory impact
- No network requests

## Use Cases

### 1. Beginner Learning (0.6x - 0.8x)
- Hear every syllable clearly
- Understand difficult pronunciations
- Build confidence with slower pace

### 2. Normal Practice (1.0x)
- Natural conversation speed
- Real-world speaking pace
- Default experience

### 3. Efficient Review (1.2x - 1.4x)
- Save time on repeated practice
- Challenge yourself with faster speed
- More natural for advanced learners

### 4. Quick Preview (2.0x)
- Rapidly review entire dialogue
- Check flow without spending much time
- Useful when revisiting completed dialogues

## Code Changes Summary

### Files Modified
- `src/components/DialogueBox.tsx` - All changes

### Functions Updated
1. `playAudio()` - NPC speech during dialogue
2. `playUserRecording()` - Individual recording playback
3. `playAudioWithPromise()` - Full dialogue NPC speech
4. `playRecordingWithPromise()` - Full dialogue user recordings

### New Functions
1. `togglePlaybackSpeed()` - Cycle through speeds
2. `getSpeedIcon()` - Get icon for speed

### New State
1. `playbackSpeed` - Current speed (default 1.0)
2. `speedOptions` - Available speeds array

### UI Changes
1. Speed control button in debug controls
2. Flex wrap for responsive layout

## Future Enhancements

Possible improvements:
1. **Persistent Preference** - Save to localStorage
2. **Speed Slider** - Visual slider instead of button
3. **Keyboard Shortcuts** - Quick speed changes (e.g., 1-6 keys)
4. **Speed Display** - Show current speed in corner during playback
5. **Custom Speeds** - Allow user to input any speed
6. **Per-Language Speed** - Remember different speeds for different languages
7. **Production Mode** - Make available outside development
8. **Speed Presets** - Named presets (Slow, Normal, Fast)

## Testing Checklist

- [x] Button appears in debug controls
- [x] Button cycles through all speeds correctly
- [x] Icons change appropriately
- [x] Speed value displays correctly
- [x] NPC speech uses selected speed
- [x] Individual user recording uses selected speed
- [x] Full dialogue NPC speech uses selected speed
- [x] Full dialogue user recordings use selected speed
- [x] Speed persists during session
- [x] All speeds work correctly (0.6x to 2.0x)
- [x] No linter errors
- [x] Console logging works

## Debugging

### Console Output
When speed changes:
```
🎚️ Playback speed changed to 1.2x
```

When playing user recording:
```
Playing user recording for step 3 at 1.2x speed
```

### Verification
1. Open dialogue
2. Scroll to debug controls
3. Click speed button - should see icon change
4. Play NPC audio - should hear speed change
5. Play user recording - should hear speed change
6. Play full dialogue - entire dialogue should be at selected speed

## Browser Compatibility

- ✅ Chrome/Edge: Full support
- ✅ Safari: Full support
- ✅ Firefox: Full support
- ✅ Opera: Full support
- ✅ All modern browsers (ES6+)

## Code Statistics

- **New state variables**: 2
- **New functions**: 2
- **Modified functions**: 4
- **UI components**: 1 button
- **Lines added**: ~60

