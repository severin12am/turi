# Voice System Summary - Quick Reference

## What Changed

### Before
- ❌ All female characters used same voice (annoying!)
- ❌ All male characters used same voice
- ❌ Only 2 voices total per language

### After
- ✅ **30 unique character voices** (one per character)
- ✅ **1 dedicated Turi voice** (for system/quiz)
- ✅ **Up to 15 different voices per gender** in English
- ✅ **Each character keeps their voice** across all 5 missions

## How It Works

### Character Voices (NPC Dialogues)
```
Character 1 (Alex, male) → en-US-Neural2-A
Character 2 (Maya, female) → en-US-Neural2-F
Character 3 (Jamie, male) → en-US-Neural2-I
Character 4 (Sophie, female) → en-US-Neural2-G
... and so on for all 30 characters
```

### Turi Voice (System Audio)
```
Quiz words → en-US-Neural2-D (Turi's voice)
Word pronunciation → en-US-Neural2-D (Turi's voice)
Sentence audio → en-US-Neural2-D (Turi's voice)
```

## English Voice Examples

**Female Voices Available (12 for characters + 1 for Turi):**
- Neural2: D (Turi), F, G, H
- WaveNet: F, G, H
- Studio-O
- Chirp3-HD: Aoede, Callirrhoe, Kore, Gacrux, Erinome

**Male Voices Available (13):**
- Neural2: A, I, J
- WaveNet: A, I, J
- Casual-K, Studio-Q
- Chirp3-HD: Achird, Algenib, Algieba, Alnilam, Charon

## Files Created/Modified

1. **NEW** `src/constants/voiceAssignments.ts` - Voice management system
2. **UPDATED** `src/services/gemini.ts` - Uses character-specific voices
3. **UPDATED** `src/components/DialogueBox.tsx` - Passes character ID to TTS

## Result

- Each character now has a unique, consistent voice
- Turi has her own dedicated voice
- All 10 languages supported
- No breaking changes to existing code

