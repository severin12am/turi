# Audio Recording and Playback Feature Implementation

## Overview
This feature adds the ability to record user's speech during dialogue practice and allow them to replay their own recordings. When users click the return button to go back to a previous step, only the last recording for each step is retained.

## What Was Implemented

### 1. State Management
Added new state variables to `DialogueBox.tsx`:
```typescript
const [userRecordings, setUserRecordings] = useState<Map<number, Blob>>(new Map());
const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
```

### 2. Recording Functions

#### `startRecording(step: number)`
- Requests microphone access via `navigator.mediaDevices.getUserMedia()`
- Creates a MediaRecorder instance with appropriate MIME type (webm, mp4, or wav)
- Stores audio chunks as they're recorded
- On stop, creates a Blob and stores it in the `userRecordings` Map, indexed by step number
- Replaces any previous recording for the same step (only last recording survives)
- Cleans up the media stream after recording stops

#### `stopRecording()`
- Stops the MediaRecorder if it's currently recording
- Called automatically when:
  - User successfully completes a phrase (speech recognition succeeds)
  - User clicks the return button
  - Component unmounts

#### `playUserRecording(step: number)`
- Retrieves the recording Blob for the specified step
- Creates an audio URL and plays it
- Automatically cleans up the URL after playback
- Includes error handling for playback failures

### 3. Automatic Recording Triggers

#### Auto-start on New User Phrase
Added a `useEffect` that monitors `conversationHistory` and `currentStep`:
- Detects when a new incomplete user phrase appears
- Automatically starts recording for that step
- Prevents duplicate recordings (checks if already recording)

#### Auto-stop on Success
Modified `handleSuccessfulSpeechRecognition()`:
- Calls `stopRecording()` after speech recognition stops
- Ensures the recording captures the successful attempt

### 4. Return Button Behavior
Enhanced `handleGoBack()` function to:
- Stop any active recording
- Stop any active audio stream
- **Delete all recordings for steps AFTER the return point**
- Keep recordings for steps up to and including the return step
- This ensures only the last recording survives when returning to earlier steps

Example:
- User has recordings for steps 1, 2, 3, 4
- User clicks return on step 2
- Result: Keeps recordings for steps 1 and 2, deletes recordings for steps 3 and 4
- User re-records step 3: New recording replaces any old one

### 5. Replay Button UI
Added a new button (🎙️) to the dialogue box interface:
- Appears only for User dialogue entries
- Only visible when entry is completed AND has a recording
- Blue background (#3b82f6) to distinguish from other buttons
- Click triggers `playUserRecording(entry.step)`
- Positioned after the sound button (🔊)

### 6. Cleanup on Unmount
Added cleanup `useEffect` that:
- Stops any active recording
- Stops all audio stream tracks
- Logs cleanup activities
- Prevents memory leaks and continued recording after component unmounts

## Browser Compatibility

### MediaRecorder API Support
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Supported (iOS 14.3+, macOS Big Sur+)
- ✅ Opera: Full support

### MIME Type Fallback Strategy
The implementation tries MIME types in order:
1. `audio/webm` (most browsers)
2. `audio/mp4` (Safari preference)
3. `audio/wav` (fallback)

### Microphone Permission
Users will be prompted for microphone access:
- Permission is requested once per domain
- If denied, recording will fail silently with console warnings
- No blocking errors - dialogue can continue without recording

## User Experience

### Normal Flow
1. User approaches character and starts dialogue
2. When user phrase appears, recording starts automatically
3. User speaks their phrase
4. Speech recognition succeeds → recording stops and is saved
5. Replay button (🎙️) appears on completed user dialogue
6. User can click to hear their own pronunciation

### Return Button Flow
1. User completes steps 1, 2, 3 (all recorded)
2. User clicks return button on step 1
3. Recordings for steps 2 and 3 are automatically deleted
4. User progresses through dialogue again
5. New recordings replace old ones for each step
6. **Only the last recording for each step is kept**

### Recording Indicators
- Microphone icon (🎤) appears while listening to speech
- Console logs show when recording starts/stops
- Replay button only appears when recording exists

## Technical Details

### Storage
- Recordings stored in memory as Blob objects in a Map
- Map key: step number (number)
- Map value: audio Blob
- Not persisted to database or localStorage
- Cleared when dialogue ends or component unmounts

### Audio Format
- Recorded as compressed audio (webm/mp4)
- Small file size (typically 10-50KB for short phrases)
- Suitable quality for review purposes

### Performance
- Recording runs in parallel with speech recognition
- Minimal CPU overhead
- No impact on speech recognition accuracy
- Automatic cleanup prevents memory buildup

## Future Enhancements

Possible improvements:
1. **Persist recordings** - Save to IndexedDB or server
2. **Download option** - Let users download their recordings
3. **Comparison view** - Play user recording alongside native speaker
4. **Visual waveform** - Show audio visualization while recording
5. **Manual recording control** - Let users re-record without speech recognition
6. **Recording quality settings** - Let users choose bitrate/quality

## Testing Checklist

- [x] Recording starts when user phrase appears
- [x] Recording stops on successful speech recognition
- [x] Replay button appears on completed user dialogues
- [x] Replay button plays correct recording
- [x] Return button deletes future recordings
- [x] Return button keeps past recordings
- [x] Only last recording per step is kept
- [x] Component unmount stops recording and cleans up
- [x] Works without blocking if microphone denied
- [x] No linter errors
- [x] Console logging for debugging

## Files Modified

- `src/components/DialogueBox.tsx` - All recording functionality added

## Code Statistics

- **Lines added**: ~200
- **New state variables**: 3
- **New functions**: 3 (startRecording, stopRecording, playUserRecording)
- **New useEffects**: 2 (auto-start, cleanup)
- **UI components**: 1 new button (replay)

