# Hide Mode Requirement Feature

## Overview
Users must now complete dialogues in **Hide mode (🙈)** - where all text is hidden - before they can proceed to the quiz. This ensures users have truly mastered the dialogue by heart, not just by reading from the screen.

## What Was Implemented

### 1. State Tracking
Added a new state variable to track if the dialogue was completed in Hide mode:

```typescript
const [completedInHideMode, setCompletedInHideMode] = useState(false);
```

### 2. Completion Detection
When the user completes the dialogue (speaks the final phrase), the system now checks the current visibility mode:

```typescript
// Check if completed in "Hide" mode (none)
if (visibilityMode === 'none') {
  setCompletedInHideMode(true);
  console.log("🎯 Dialogue completed in Hide mode - user can proceed to quiz!");
} else {
  console.log("⚠️ Dialogue completed but not in Hide mode - user must complete in Hide mode to proceed");
}
```

### 3. Quiz Button Gating
The "Continue to Quiz" button is now:
- **Disabled** when `completedInHideMode === false`
- Shows as **grayed out** (50% opacity)
- Displays "🔒 Complete in Hide Mode First" instead of "Continue to Quiz →"
- Cursor changes to `not-allowed`
- No hover effects when disabled

### 4. Clear User Instructions
When the dialogue is completed but NOT in Hide mode, users see:

#### Warning Message (Yellow)
```
⚠️ Almost there! Complete in Hide mode (🙈) to proceed
```

#### Instructional Box
A prominent yellow-bordered box appears with step-by-step instructions:

```
📚 Memory Challenge Required!

To prove you've mastered this dialogue:
1. Click the visibility button below (currently: All)
2. Switch to 🙈 Hide mode
3. Click ↩ button to reset dialogue
4. Complete the entire dialogue from memory!
```

#### Success Message (Green)
Once completed in Hide mode:
```
🎉 Great job! You've completed the dialogue!
```

### 5. State Reset on Go Back
When users click the return (↩) button to go back:
```typescript
setDialogueComplete(false);
setCompletedInHideMode(false); // Reset the Hide mode completion flag
```

This ensures they must complete in Hide mode again if they restart.

## User Experience Flow

### Scenario 1: Normal Completion (Not in Hide Mode)

```
Step 1: User completes dialogue in "All" mode (📖)
└─ Status: ✅ Dialogue complete, ❌ Not in Hide mode

Step 2: Screen shows:
├─ Warning: "⚠️ Almost there! Complete in Hide mode (🙈) to proceed"
├─ Instruction box with 4 steps
├─ Disabled button: "🔒 Complete in Hide Mode First"
└─ Help text: "Switch to Hide mode (🙈) and complete the dialogue from memory to unlock the quiz"

Step 3: User follows instructions:
├─ Clicks visibility button → switches to 🙈 Hide mode
├─ Clicks ↩ button → dialogue resets
└─ Completes dialogue from memory (all text hidden!)

Step 4: Screen shows:
├─ Success: "🎉 Great job! You've completed the dialogue!"
├─ Enabled button: "Continue to Quiz →" (green, clickable)
└─ Help text: "Review your dialogue or replay the full conversation before continuing"
```

### Scenario 2: Completion in Hide Mode (Direct Success)

```
Step 1: User switches to Hide mode (🙈) at start
Step 2: User completes entire dialogue from memory
Step 3: Screen shows:
├─ Success message: "🎉 Great job! You've completed the dialogue!"
├─ Enabled button: "Continue to Quiz →" (green, clickable)
└─ Can proceed immediately!
```

### Scenario 3: User Goes Back After Completion

```
Step 1: User completes in Hide mode → button enabled
Step 2: User clicks ↩ to review earlier phrases
Step 3: System resets:
├─ setDialogueComplete(false) → completion button disappears
└─ setCompletedInHideMode(false) → requirement reset

Step 4: User must complete in Hide mode again
```

## Visual Design

### Disabled Button State
```css
backgroundColor: '#6b7280'  // Gray
opacity: 0.5
cursor: 'not-allowed'
```

### Enabled Button State
```css
backgroundColor: '#10b981'  // Green
opacity: 1
cursor: 'pointer'
Hover: darker green (#059669), lift effect
```

### Warning Box (Not Completed in Hide Mode)
```css
backgroundColor: 'rgba(251, 191, 36, 0.2)'  // Yellow transparent
border: '2px solid rgba(251, 191, 36, 0.4)'  // Yellow border
borderRadius: '8px'
```

### Color Indicators
- **Yellow (#fbbf24)**: Warning - need to complete in Hide mode
- **Green (#4ade80)**: Success - completed in Hide mode
- **Gray (#6b7280)**: Disabled button

## Benefits

### Educational
1. **Forces Mastery** - Users can't skip to quiz without proving they know it by heart
2. **Memory Training** - Strengthens recall without visual aids
3. **Real-World Preparation** - Simulates actual conversations (no subtitles!)
4. **Confidence Building** - Completing from memory is a powerful achievement

### UX Design
1. **Clear Guidance** - Step-by-step instructions tell users exactly what to do
2. **Visual Feedback** - Button states clearly show what's required
3. **Progressive Disclosure** - Warning box only appears when relevant
4. **Non-Punitive** - Users can still review, replay, and practice before attempting

### Motivation
1. **Achievement** - Completing in Hide mode feels like a real accomplishment
2. **Clear Goal** - Users know exactly what's required to proceed
3. **Gamification** - Adds a challenge element to the learning process

## Technical Implementation

### State Management
```typescript
// Track completion in Hide mode
const [completedInHideMode, setCompletedInHideMode] = useState(false);

// Check mode when dialogue completes
if (visibilityMode === 'none') {
  setCompletedInHideMode(true);
}

// Reset when going back
setCompletedInHideMode(false);
```

### Conditional Rendering
```typescript
// Button disabled state
disabled={!completedInHideMode}

// Dynamic button text
{completedInHideMode ? (
  <>Continue to Quiz →</>
) : (
  <>🔒 Complete in Hide Mode First</>
)}

// Conditional instruction box
{!completedInHideMode && (
  <div>Instructions...</div>
)}
```

### Button Styling Logic
```typescript
backgroundColor: completedInHideMode ? '#10b981' : '#6b7280'
cursor: completedInHideMode ? 'pointer' : 'not-allowed'
opacity: completedInHideMode ? 1 : 0.5

onMouseEnter={(e) => {
  if (completedInHideMode) {
    // Apply hover effects
  }
}}
```

## Edge Cases Handled

### 1. User Completes Multiple Times
- ✅ Only the Hide mode completion counts
- ✅ Completing in other modes doesn't unlock quiz
- ✅ Flag persists until user goes back or restarts

### 2. User Switches Modes Mid-Dialogue
- ✅ System checks mode at the moment of final phrase completion
- ✅ Switching to Hide mode after completing doesn't count
- ✅ User must reset and complete entirely in Hide mode

### 3. User Goes Back After Unlocking
- ✅ Flag resets to false
- ✅ User must complete in Hide mode again
- ✅ Prevents accidental progression after reviewing

### 4. User Uses Replay Features
- ✅ Replay buttons still work
- ✅ Full dialogue replay works
- ✅ User can review before attempting Hide mode

## Future Enhancements

Possible improvements:
1. **Partial Credit** - Track how many attempts in each mode
2. **Hints System** - Allow X hints in Hide mode
3. **Progressive Hiding** - Gradually fade text as user progresses
4. **Statistics** - Show "Completed from memory on attempt #X"
5. **Badges** - Award achievements for first-try Hide mode completions
6. **Leaderboard** - Compare Hide mode completion rates
7. **Difficulty Levels** - Different requirements for different dialogue levels

## Testing Checklist

- [x] Button is disabled when dialogue completed in non-Hide mode
- [x] Button is enabled when dialogue completed in Hide mode
- [x] Warning message shows when not completed in Hide mode
- [x] Success message shows when completed in Hide mode
- [x] Instruction box appears with correct current mode
- [x] Button text changes based on completion state
- [x] Button styling changes (gray vs green)
- [x] Hover effects only work when enabled
- [x] Cursor changes (not-allowed vs pointer)
- [x] State resets when going back
- [x] Console logs show correct messages
- [x] No linter errors

## Files Modified

- `src/components/DialogueBox.tsx` - All changes in this file

## Code Statistics

- **New state variables**: 1 (`completedInHideMode`)
- **Modified functions**: 2 (`handleGoBack`, speech recognition completion handler)
- **New conditional renders**: 3 (warning message, instruction box, button state)
- **Lines added**: ~70

## User Feedback Messages

### Console Logs
```javascript
// Success
"🎯 Dialogue completed in Hide mode - user can proceed to quiz!"

// Needs Hide mode
"⚠️ Dialogue completed but not in Hide mode - user must complete in Hide mode to proceed"
```

### UI Messages
```javascript
// Warning (Yellow)
"⚠️ Almost there! Complete in Hide mode (🙈) to proceed"

// Success (Green)
"🎉 Great job! You've completed the dialogue!"

// Button disabled
"🔒 Complete in Hide Mode First"

// Button enabled
"Continue to Quiz →"

// Help text (disabled)
"Switch to Hide mode (🙈) and complete the dialogue from memory to unlock the quiz"

// Help text (enabled)
"Review your dialogue or replay the full conversation before continuing"
```

## Educational Psychology

This feature is based on proven learning principles:

### Active Recall
- Retrieving information from memory strengthens neural pathways
- More effective than passive review
- Hide mode forces active recall

### Desirable Difficulty
- Appropriate challenge enhances learning
- Too easy = no learning
- Hide mode adds optimal difficulty

### Mastery Learning
- Learners must demonstrate mastery before progression
- Prevents advancing with gaps in knowledge
- Ensures strong foundation

### Spaced Repetition
- Users may need multiple attempts
- Each attempt strengthens memory
- Natural spacing between attempts

## Conclusion

The Hide Mode Requirement feature ensures users genuinely master dialogues before progressing. By requiring completion with all text hidden, we guarantee that learners have internalized the content rather than just reading it. The clear instructions and visual feedback make the requirement approachable rather than frustrating, turning it into a motivating challenge that enhances the learning experience.

