# Word Interaction System - Usage Examples

## How It Works

### Mode 1: Hover (Quick Single-Word Lookup)
```
User Action:    Hover mouse over "hello"
Result:         "hello" gets light temporary highlight
                4 buttons appear above it: 🔍 🔊 ℹ️ 📚
                
User Action:    Move mouse away
Result:         Highlight and buttons disappear instantly
Status:         ✅ No changes from current behavior
```

### Mode 2: Click-to-Select (Build Phrases)
```
User Action:    Click on "thank"
Result:         "thank" gets stronger blue highlight with border
                Persistent panel appears at bottom: 🔍 🔊 ℹ️ 📚
                
User Action:    Click on "you"
Result:         "you" also gets blue highlight
                Both words stay highlighted
                Panel still shows at bottom
                
User Action:    Click on "very"
Result:         "very" joins the selection
                Three words now highlighted
                Panel works on "thank you very"
                
User Action:    Click "thank" again
Result:         "thank" unhighlights (removed from selection)
                "you very" still selected
                
User Action:    Click outside OR press Escape
Result:         All highlights disappear
                Panel disappears
```

## Conflict Prevention

### Scenario: User has words selected
```
Current State:  "thank you" selected (blue highlight)
                Persistent panel showing at bottom
                
User Action:    Hover mouse over "hello"
Result:         ❌ Nothing happens
                ✅ Hover panel does NOT appear
                ✅ No interference with selection mode
Reason:         Hover is disabled when selection exists
```

### Scenario: No words selected
```
Current State:  No selection (empty)
                
User Action:    Hover mouse over "hello"
Result:         ✅ "hello" gets light highlight
                ✅ Hover panel appears above it
                ✅ Normal hover mode works
Reason:         Hover is enabled when no selection
```

## The 4 Buttons (Same for Both Modes)

### 🔍 Google Search
- Hover mode: Searches the single hovered word
- Click mode: Searches the combined selected phrase
- Opens Google in new tab with translation context

### 🔊 Play Sound
- Hover mode: Pronounces the single hovered word
- Click mode: Pronounces the combined selected phrase
- Uses TTS with target language

### ℹ️ Show Explanation
- Hover mode: Shows explanation for single word
- Click mode: Shows explanation for combined phrase
- Uses AI to generate detailed explanation

### 📚 Add to Dictionary
- Hover mode: Adds single word to user's dictionary
- Click mode: Adds combined phrase to dictionary
- Requires user to be logged in

## CSS Classes Reference

### `.selectable-word`
- Applied to all clickable words
- Base styling for interaction

### `.highlighted-word`
- Applied during speech recognition
- Green highlight for matched words
- Temporary state

### `.selected-word`
- Applied to clicked/selected words
- Blue highlight with border
- Persistent until cleared
- Stronger visual than hover

### Hover State (no class)
- Light blue background
- Applied via `:hover` CSS pseudo-class
- Only active when no selection exists

## Visual Hierarchy

```
Priority (strongest to weakest):
1. Selected (blue, border)      ← Click-to-select mode
2. Highlighted (green)           ← Speech recognition
3. Hovered (light blue)          ← Hover mode
```

## Implementation Notes

### Word Key Format
```typescript
const wordKey = `${cleanWord}-${index}`;
// Example: "hello-3" for "hello" at position 3
```

### Clean Word Function
```typescript
const cleanWord = word.trim().replace(/[.,?!;:¿¡]/g, '');
// Removes punctuation for consistent matching
```

### Selected Text Joining
```typescript
// Maintains original word order based on index
// Joins with spaces: "thank you very"
```

### State Management
```typescript
selectedWords: Set<string>           // Set of word keys
selectedWordsData: Map<string, string>  // wordKey → actual word text
```

## Browser Compatibility

- No native text selection used
- Click-to-toggle on whole words only
- Works in all modern browsers
- No drag-to-select behavior

## Performance

- Efficient Set/Map data structures
- Minimal re-renders
- Event listener cleanup on unmount
- Refs used for persistent panel click detection

