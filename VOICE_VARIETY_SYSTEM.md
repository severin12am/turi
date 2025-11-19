# Voice Variety System

## Overview
Each of the 30 NPC characters now has their own unique voice, while Turi (the system) uses a dedicated voice for quiz and word pronunciation. This creates natural variety and helps users distinguish between characters.

## Problem Solved
**Before:** All female characters used the same voice (en-US-Neural2-F), which was annoying and repetitive.

**After:** 
- ✅ 30 unique character voices (distributed across available voices)
- ✅ Each character keeps the same voice across all their missions
- ✅ Turi has a dedicated female voice for system/quiz audio
- ✅ Variety across 10 supported languages

## Architecture

### Voice Pools (`src/constants/voiceAssignments.ts`)

Each language has:
- **Male voice pool** (13-14 voices per language)
- **Female voice pool** (12-15 voices per language)
- **Turi voice** (1 dedicated female voice)

#### Example - English Voices:

**Male Voices (13):**
- en-US-Neural2-A, en-US-Neural2-I, en-US-Neural2-J
- en-US-WaveNet-A, en-US-WaveNet-I, en-US-WaveNet-J
- en-US-Casual-K, en-US-Studio-Q
- en-US-Chirp3-HD-Achird, Algenib, Algieba, Alnilam, Charon

**Female Voices (12):**
- en-US-Neural2-F, en-US-Neural2-G, en-US-Neural2-H
- en-US-WaveNet-F, en-US-WaveNet-G, en-US-WaveNet-H
- en-US-Studio-O
- en-US-Chirp3-HD-Aoede, Callirrhoe, Kore, Gacrux, Erinome

**Turi Voice:**
- en-US-Neural2-D (clear, pleasant female voice)

### Character Voice Assignment

Each character (1-30) is assigned an index that maps to their gender's voice pool:

```typescript
CHARACTER_VOICE_INDICES = {
  1: 0,   // Alex (male) → en-US-Neural2-A
  2: 0,   // Maya (female) → en-US-Neural2-F
  3: 1,   // Jamie (male) → en-US-Neural2-I
  4: 1,   // Sophie (female) → en-US-Neural2-G
  // ... etc
}
```

If there are more characters than voices, it cycles back (e.g., Character 27 uses index 0 again).

## Usage

### For NPC Dialogue (Character-Specific Voice)

```typescript
const audio = await generateSpeechWithGemini(
  text,
  languageCode,
  characterGender,
  characterId  // 1-30 for unique voice
);
```

### For Quiz/System Audio (Turi Voice)

```typescript
const audio = await generateSpeechWithGemini(
  text,
  languageCode,
  'female',    // Turi is female
  null         // null = use Turi voice
);
```

## Where Each Voice Type is Used

### Character Voices (Unique per NPC)
- ✅ **Mission conversations** - Each character sounds different
- ✅ **Scenario dialogues** - Consistent voice per scenario
- ✅ **Regular NPC dialogues** - Character-specific

### Turi Voice (System)
- ✅ **Quiz word pronunciation**
- ✅ **Word hover/click pronunciation**
- ✅ **Sentence audio playback**
- ✅ **Future: Turi talking feature**

## Character Voice Distribution

### Example Distribution (English):

**Male Characters (15):**
1. Alex → Voice 0
2. Jamie → Voice 1
3. Marcus → Voice 2
4. Chris → Voice 3
5. Noah → Voice 4
6. Ryan → Voice 5
7. Tom → Voice 6
8. Dr. Chen → Voice 7
9. James → Voice 8
10. Kevin → Voice 9
11. Lucas → Voice 10
12. Tyler → Voice 11
13. Jordan → Voice 12
14. Eric → Voice 0 (cycle)
15. Victor → Voice 1 (cycle)

**Female Characters (15):**
1. Maya → Voice 0
2. Sophie → Voice 1
3. Diana → Voice 2
4. Professor Lee → Voice 3
5. Emma → Voice 4
6. Olivia → Voice 5
7. Isabella → Voice 6
8. Officer Sarah → Voice 7
9. Attorney Rodriguez → Voice 8
10. Zoe → Voice 9
11. Mia → Voice 10
12. Rachel → Voice 11
13. Lily → Voice 0 (cycle)
14. Nina → Voice 1 (cycle)
15. Ava → Voice 2 (cycle)

## Supported Languages

All 10 languages have unique voice pools:
1. **English** (en-US) - 13 male, 12 female, 1 Turi
2. **Russian** (ru-RU) - 3 male, 6 female, 1 Turi
3. **Spanish** (es-ES) - 3 male, 4 female, 1 Turi
4. **French** (fr-FR) - 4 male, 6 female, 1 Turi
5. **German** (de-DE) - 4 male, 6 female, 1 Turi
6. **Italian** (it-IT) - 3 male, 4 female, 1 Turi
7. **Arabic** (ar-XA) - 4 male, 4 female, 1 Turi
8. **Chinese** (cmn-CN) - 4 male, 4 female, 1 Turi
9. **Japanese** (ja-JP) - 4 male, 4 female, 1 Turi
10. **Turkish** (tr-TR) - 4 male, 6 female, 1 Turi

## Voice Quality Types

Google Cloud TTS offers different voice types:

1. **Neural2** - Best quality, most natural
2. **WaveNet** - High quality, very natural
3. **Chirp3-HD** - HD quality, natural (English only)
4. **Studio** - Studio quality (English only)
5. **Casual** - Casual style (English male only)
6. **Standard** - Basic quality (fallback)

Characters use a mix of these for variety.

## Benefits

### For Users
- ✅ **Natural variety** - Characters sound different
- ✅ **Character recognition** - Same voice = same character
- ✅ **Less monotony** - More engaging conversations
- ✅ **Turi identity** - Dedicated system voice

### For Development
- ✅ **Centralized management** - All voices in one file
- ✅ **Easy to modify** - Change voice pools easily
- ✅ **Scalable** - Add more voices/characters easily
- ✅ **Consistent** - Same character = same voice always

## Files Modified

1. ✅ **NEW** `src/constants/voiceAssignments.ts` - Voice pool management
2. ✅ `src/services/gemini.ts` - Updated TTS to use character-specific voices
3. ✅ `src/components/DialogueBox.tsx` - Passes character ID to TTS
4. ✅ `src/components/VocalQuizComponent.tsx` - Uses Turi voice (no changes needed)

## Testing

### Test Character Voices
1. Start missions with different characters (1, 2, 3, etc.)
2. Verify each character has a distinct voice
3. Complete multiple missions with same character - voice should stay consistent

### Test Turi Voice
1. Play quiz word pronunciation
2. Hover over word and click pronunciation
3. Click sentence audio button
4. Verify all use the same Turi voice (not character voices)

## Future Enhancements

- Add voice personality traits (friendly, professional, etc.)
- User preference to select favorite voices
- Voice pitch/rate adjustments per character
- More languages with expanded voice pools
- Regional accent variations

