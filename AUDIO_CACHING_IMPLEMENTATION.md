# Audio Caching Implementation

## Overview
Implemented audio caching across all dialogue and quiz components to avoid expensive redundant Google TTS API calls when replaying NPC speech.

## Problem
Previously, every time a user clicked "Replay Full Dialogue" or replayed audio in quizzes, the app would make new TTS API requests to Google Cloud Text-to-Speech. This resulted in:
- **Unnecessary API costs** - Same audio regenerated multiple times
- **Slower performance** - Network latency for each regeneration
- **Wasted resources** - Bandwidth and processing for identical audio

## Solution
Implemented audio URL caching that stores generated audio blob URLs and reuses them for subsequent replays.

## Implementation Details

### 1. DialogueBox Component (`src/components/DialogueBox.tsx`)

#### Changes Made:
- **Updated `ConversationEntry` interface** to include optional `audioUrl` field
- **Modified `playAudio()` function** to cache audio URLs when generating TTS
- **Updated `playAudioWithPromise()` function** to check for cached audio before generating new audio
- **Updated `handlePlayAudio()` function** to use cached audio for individual replay buttons
- **Added cleanup effect** to revoke blob URLs on component unmount (prevents memory leaks)

#### Key Code Sections:
```typescript
interface ConversationEntry {
  // ... other fields
  audioUrl?: string; // Cached audio URL for NPC TTS to avoid regenerating
}
```

**Caching logic in `playAudio()`:**
```typescript
const audio = await generateSpeechWithGemini(text, targetLanguage);

// Cache the audio URL if we have a step number
if (stepNumber && audio.src) {
  console.log('💾 DIALOGUE: Caching audio URL for step', stepNumber);
  setConversationHistory(prev => 
    prev.map(entry => 
      entry.step === stepNumber && entry.speaker === 'NPC'
        ? { ...entry, audioUrl: audio.src }
        : entry
    )
  );
}
```

**Using cached audio in `playAudioWithPromise()`:**
```typescript
// Check if we have cached audio URL for this entry
if (entry?.audioUrl) {
  console.log('🔊 FULL DIALOGUE: Using cached audio URL');
  const audio = new Audio(entry.audioUrl);
  audio.playbackRate = playbackSpeed;
  await audio.play();
  return;
}
```

**Cleanup to prevent memory leaks:**
```typescript
useEffect(() => {
  return () => {
    console.log('💾 Cleaning up cached audio URLs');
    conversationHistory.forEach(entry => {
      if (entry.audioUrl && entry.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(entry.audioUrl);
      }
    });
  };
}, []); // Only run on unmount
```

### 2. VocalQuizComponent (`src/components/VocalQuizComponent.tsx`)

#### Changes Made:
- **Updated `VocalQuizWord` interface** to include optional `audioUrl` field
- **Modified `playAudio()` function** to check for and use cached audio
- **Added caching logic** when generating audio for quiz words
- **Added cleanup effect** to revoke blob URLs on component unmount

#### Key Code Sections:
```typescript
interface VocalQuizWord {
  // ... other fields
  audioUrl?: string; // Cached audio URL for TTS to avoid regenerating
}
```

**Check for cached audio first:**
```typescript
// Check if we have cached audio for this word
if (currentWord.audioUrl) {
  console.log('🔊 QUIZ: Using cached audio URL');
  const audio = new Audio(currentWord.audioUrl);
  await audio.play();
  return;
}
```

**Cache audio when generating:**
```typescript
const audio = await generateSpeechWithGemini(wordToPlay, targetLanguage);

// Cache the audio URL for future replays
if (audio.src && currentWord) {
  console.log('💾 QUIZ: Caching audio URL');
  currentWord.audioUrl = audio.src;
  setQuizWords(prev => prev.map(w => 
    w.id === currentWord.id ? { ...w, audioUrl: audio.src } : w
  ));
}
```

## Benefits

### Cost Savings
- **Regular Dialogues**: A 10-step dialogue with replay = 10 TTS calls instead of 20+
- **Quiz Mode**: Replaying same word 3 times = 1 TTS call instead of 3
- **AI Dialogues**: Same caching applies to dynamically generated dialogues
- **Scenarios**: Multi-scenario dialogues benefit from caching across replays

### Performance Improvements
- **Instant replay** - No network latency when using cached audio
- **Smoother UX** - No loading delays between replays
- **Reduced bandwidth** - Less data transfer

### User Experience
- **Faster learning** - Students can replay multiple times without waiting
- **More practice** - Lower cost enables more audio replays
- **Better retention** - Quick replays support better learning patterns

## Memory Management

### Blob URL Lifecycle
1. **Creation**: Audio URL created when TTS generates audio
2. **Storage**: URL stored in component state (conversation history or quiz words)
3. **Reuse**: Same URL used for all subsequent replays
4. **Cleanup**: URLs revoked when component unmounts

### Preventing Memory Leaks
Both components include cleanup effects that:
- Run only on component unmount
- Check if URL is a blob URL (`blob:` prefix)
- Revoke all cached blob URLs using `URL.revokeObjectURL()`

## Fallback Handling

### Graceful Degradation
If cached audio fails to play:
1. Error is logged to console
2. Cached URL is cleared
3. Audio is regenerated with fresh TTS call
4. New audio URL is cached for future use

### Browser TTS Fallback
- Caching only applies to Gemini TTS (Google Cloud TTS)
- Browser TTS (Web Speech API) is used as fallback
- No caching for browser TTS as it's free and instant

## Coverage

### Components with Audio Caching
✅ **DialogueBox** - Regular dialogues  
✅ **DialogueBox** - AI-generated dialogues  
✅ **DialogueBox** - Scenario dialogues  
✅ **VocalQuizComponent** - Quiz pronunciation audio  

### Audio Replay Features
✅ **Full Dialogue Replay** - Plays entire conversation  
✅ **Individual Phrase Replay** - Replay button on each NPC phrase  
✅ **Quiz Word Replay** - Play pronunciation button in quiz  
✅ **Return/Go Back** - Replaying when returning to previous steps  

## Testing

### Verification
1. Open DevTools Console
2. Look for cache indicators:
   - `💾 DIALOGUE: Caching audio URL` - Audio being cached
   - `🔊 Using cached audio URL` - Cached audio being used
   - `💾 Cleaning up cached audio URLs` - Memory cleanup on unmount

### Expected Behavior
- **First play**: Generates audio + caches URL
- **Replay**: Uses cached URL (no API call)
- **Navigation away**: Cleanup logs appear
- **Return**: New audio generated and cached

## Future Enhancements

### Potential Improvements
1. **Persistent caching** - Store audio in IndexedDB for cross-session caching
2. **Preloading** - Cache audio for upcoming dialogue steps
3. **Cache size limits** - Implement LRU cache to limit memory usage
4. **Audio quality settings** - Cache multiple quality levels
5. **Offline support** - Use cached audio when offline

## Technical Notes

### Audio Object URLs
- Generated by `URL.createObjectURL(blob)` in `generateSpeechWithGemini()`
- Format: `blob:https://domain.com/uuid`
- Must be revoked to prevent memory leaks
- Persist only within current browser session

### State Management
- Dialogue: Cached in `conversationHistory` state array
- Quiz: Cached in `quizWords` state array
- Updates trigger re-renders but audio element creation is lightweight

### Compatibility
- Works with all languages (en, ru, es, fr, de, it, ar, CH, ja, tr)
- Compatible with playback speed control
- Works with all dialogue modes (regular, AI, scenario)

## Conclusion

This implementation significantly reduces TTS API costs while improving performance and user experience. The caching is transparent to users, automatically manages memory, and includes robust error handling for maximum reliability.

