# Bug Fix: Scenario Quiz Using Legacy Logic

## 🐛 The Bug

After completing the **first scenario dialogue**, subsequent dialogues (2nd, 3rd, etc.) were using the **legacy quiz system** (`words_quiz` table) instead of the **new scenario quiz system** (`quiz` table with stemming).

## 🔍 Root Cause

In `src/scenes/City.tsx`, the `handleCloseDialogue` function had a logic error:

```typescript
// ❌ BUGGY CODE:
const handleCloseDialogue = () => {
  setIsDialogueActive(false);
  setAiDialogue(null);
  setIsScenarioDialogue(false); // ❌ Sets to false FIRST
  
  if (isScenarioDialogue) { // ❌ Already false! This never runs
    setShowScenarioSelection(true);
  } else {
    setShowDialogueSelection(true); // ← Always runs
  }
};
```

### The Flow:

1. User completes scenario dialogue 1 + quiz
2. `handleCloseDialogue()` called
3. Sets `isScenarioDialogue` to `false`
4. Checks `if (isScenarioDialogue)` → Always false!
5. Shows **regular** dialogue panel (not scenario panel)
6. User selects dialogue 2 from regular panel
7. `handleDialogueSelect()` called (not `handleScenarioDialogueSelect()`)
8. `isScenarioDialogue` stays `false`
9. Quiz uses legacy `words_quiz` table ❌

## ✅ The Fix

Save the flag **before** clearing it:

```typescript
// ✅ FIXED CODE:
const handleCloseDialogue = () => {
  setIsDialogueActive(false);
  setAiDialogue(null);
  
  // Save the scenario flag BEFORE clearing it
  const wasScenario = isScenarioDialogue;
  
  logger.info('Dialogue closed', { wasScenario });
  
  // Show appropriate panel based on what type just closed
  if (wasScenario) {
    setShowScenarioSelection(true); // ✓ Shows scenario panel
  } else {
    setShowDialogueSelection(true);
  }
  
  // Clear scenario flag AFTER deciding which panel to show
  setIsScenarioDialogue(false);
};
```

### Fixed Flow:

1. User completes scenario dialogue 1 + quiz
2. `handleCloseDialogue()` called
3. Saves `wasScenario = true`
4. Shows **scenario** panel ✓
5. User selects dialogue 2 from scenario panel
6. `handleScenarioDialogueSelect()` called ✓
7. Sets `isScenarioDialogue` to `true` again ✓
8. Quiz uses new `quiz` table with stemming ✓

## 🎯 How to Verify

After the fix, check browser console when loading quiz:

### Before Fix:
```
🔍 QUIZ SYSTEM CHECK: {
  dialogueId: 2,
  isScenario: false,  ❌
  system: "❌ LEGACY (words_quiz table)"
}
```

### After Fix:
```
🔍 QUIZ SYSTEM CHECK: {
  dialogueId: 2,
  isScenario: true,  ✅
  scenarioNumber: 1,
  system: "✅ NEW (quiz table + stemming)"
}
📚 Fetching scenario quiz words from common words table (with stemming)
[INFO] Stemmed dialogue words {
  original: ["llamo", "casa"],
  stemmed: ["llam", "cas"]
}
[INFO] Found match via stemming {
  dialogueWord: "llamo",
  quizWord: "llamar",
  stem: "llam"
}
```

## 📊 Impact

**Before Fix:**
- Dialogue 1: ✓ Uses new system
- Dialogue 2: ❌ Uses legacy system
- Dialogue 3: ❌ Uses legacy system

**After Fix:**
- Dialogue 1: ✓ Uses new system
- Dialogue 2: ✓ Uses new system
- Dialogue 3: ✓ Uses new system

## 🧪 Testing

1. Start a scenario dialogue
2. Complete dialogue 1 + quiz
3. Check console for `wasScenario: true`
4. Verify scenario panel appears (not regular dialogue panel)
5. Select dialogue 2
6. Complete dialogue 2
7. Check console for:
   - `isScenario: true`
   - `system: "✅ NEW (quiz table + stemming)"`
8. Verify quiz shows words matched via stemming

## 📝 Files Changed

- `src/scenes/City.tsx` - Fixed `handleCloseDialogue` logic
- `src/components/VocalQuizComponent.tsx` - Added debug logging

## 🔗 Related Issues

- Scenario quiz implementation: `SCENARIO_QUIZ_FEATURE.md`
- Stemming implementation: `STEMMING_IMPLEMENTATION.md`

---

**Status:** ✅ Fixed  
**Tested:** Pending user verification  
**Impact:** High - affects all scenario dialogues after the first one

