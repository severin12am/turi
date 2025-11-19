# TTS Gender Voice Fix

## Problem
Character 30 (Ava - female) and other female characters were using **male TTS voices** because we hardcoded mostly male voice names in the Google Cloud TTS configuration.

## Root Cause
Google Cloud Text-to-Speech API **DOES support gender-specific voices**, but we weren't using this feature!

In `src/services/gemini.ts`, we had:
```typescript
// OLD - Hardcoded voices (mostly male)
const languageMap: Record<string, { code: string; name: string }> = {
  'en': { code: 'en-US', name: 'en-US-Neural2-D' },  // D = MALE
  'ru': { code: 'ru-RU', name: 'ru-RU-Wavenet-D' },  // D = MALE
  'es': { code: 'es-ES', name: 'es-ES-Neural2-F' },  // F = Female
  // etc...
};
```

## Google Voice Naming Convention
- **A, C, E, F** suffixes = Female voices
- **B, D** suffixes = Male voices

## Solution

### 1. Updated `src/services/gemini.ts`

**Added gender parameter:**
```typescript
export const generateSpeechWithGemini = async (
  text: string, 
  languageCode: SupportedLanguage, 
  gender: 'male' | 'female' = 'male'  // NEW!
): Promise<HTMLAudioElement>
```

**Created voice map with both genders:**
```typescript
const languageMap: Record<string, { code: string; male: string; female: string }> = {
  'en': { code: 'en-US', male: 'en-US-Neural2-D', female: 'en-US-Neural2-F' },
  'ru': { code: 'ru-RU', male: 'ru-RU-Wavenet-B', female: 'ru-RU-Wavenet-A' },
  'es': { code: 'es-ES', male: 'es-ES-Neural2-B', female: 'es-ES-Neural2-A' },
  'fr': { code: 'fr-FR', male: 'fr-FR-Neural2-B', female: 'fr-FR-Neural2-A' },
  'de': { code: 'de-DE', male: 'de-DE-Neural2-B', female: 'de-DE-Neural2-A' },
  'it': { code: 'it-IT', male: 'it-IT-Neural2-D', female: 'it-IT-Neural2-A' },
  'ar': { code: 'ar-XA', male: 'ar-XA-Wavenet-B', female: 'ar-XA-Wavenet-A' },
  'CH': { code: 'cmn-CN', male: 'cmn-CN-Wavenet-B', female: 'cmn-CN-Wavenet-A' },
  'ja': { code: 'ja-JP', male: 'ja-JP-Neural2-D', female: 'ja-JP-Neural2-A' },
  'tr': { code: 'tr-TR', male: 'tr-TR-Wavenet-B', female: 'tr-TR-Wavenet-A' }
};

// Select voice based on gender
const voiceName = gender === 'female' ? language.female : language.male;
```

### 2. Updated `src/components/DialogueBox.tsx`

**Gets character gender from centralized character data:**
```typescript
// Get character gender for TTS voice
const characterGender: 'male' | 'female' = (() => {
  if (mission) {
    // Mission mode - use character from scenario
    const character = getCharacterByScenario(mission.scenarioNumber);
    return character?.gender || 'male';
  } else if (isScenario) {
    // Scenario mode - use character from scenario
    const character = getCharacterByScenario(scenarioNumber);
    return character?.gender || 'male';
  }
  // Regular dialogue - use character ID
  const character = getCharacterByScenario(characterId);
  return character?.gender || 'male';
})();
```

**Passes gender to TTS calls:**
```typescript
// In playAudio function
const audio = await generateSpeechWithGemini(text, targetLanguage, characterGender);

// In full dialogue replay
const audio = await generateSpeechWithGemini(text, targetLanguage, characterGender);
```

## Languages Supported

All 10 primary languages now have gender-specific voices:
1. **English** (en) - D (male), F (female)
2. **Russian** (ru) - B (male), A (female)
3. **Spanish** (es) - B (male), A (female)
4. **French** (fr) - B (male), A (female)
5. **German** (de) - B (male), A (female)
6. **Italian** (it) - D (male), A (female)
7. **Arabic** (ar) - B (male), A (female)
8. **Chinese** (CH) - B (male), A (female)
9. **Japanese** (ja) - D (male), A (female)
10. **Turkish** (tr) - B (male), A (female)

## Testing

### Before Fix
- Character 30 (Ava, female) → Male voice ❌
- Most female characters → Male voice ❌

### After Fix
- Character 30 (Ava, female) → Female voice ✅
- All 15 female characters → Female voices ✅
- All 15 male characters → Male voices ✅

## Character Gender Distribution

**Female Characters (15):**
Maya, Sophie, Diana, Professor Lee, Emma, Olivia, Isabella, Officer Sarah, Attorney Rodriguez, Zoe, Mia, Rachel, Lily, Nina, **Ava**

**Male Characters (15):**
Alex, Jamie, Marcus, Chris, Noah, Ryan, Tom, Dr. Chen, James, Kevin, Lucas, Tyler, Jordan, Eric, Victor

## Backwards Compatibility

✅ **Quiz mode** - Still works! Uses default male voice (parameter is optional)  
✅ **Existing code** - No breaking changes, gender defaults to 'male'  
✅ **All features** - Regular dialogue, scenarios, missions all work  

## Files Changed

1. ✅ `src/services/gemini.ts` - Added gender parameter and voice selection
2. ✅ `src/components/DialogueBox.tsx` - Determines and passes character gender
3. ✅ `src/constants/characters.ts` - Already had gender in character data
4. ✅ `NPC_CHARACTER_SYSTEM.md` - Updated documentation

## How to Test

1. Start a mission with **Character 30 (Ava)** - Scenario 30 (Farewells)
2. Listen to NPC voice - should be **female**
3. Try other scenarios:
   - Scenario 2 (Maya - female)
   - Scenario 4 (Sophie - female)
   - Scenario 10 (Emma - female)
4. Verify male voices work too:
   - Scenario 1 (Alex - male)
   - Scenario 9 (Noah - male)
   - Scenario 15 (Dr. Chen - male)

## Result

🎉 **Female characters now have female voices!**  
🎉 **Male characters have male voices!**  
🎉 **All 10 languages supported!**  
🎉 **No breaking changes!**

