# Scenarios Progress Feature Implementation

## Overview
Added a new "Scenarios Progress" section to the HelperRobot panel, allowing users to track their progress through 30 different conversation scenarios. The feature displays scenario completion status, current dialogue progress, and locks/unlocks scenarios based on user progress.

## What Was Implemented

### 1. Scenario Names Constants
**File**: `src/constants/scenarios.ts`

Created a centralized location for scenario definitions:

```typescript
export const SCENARIO_NAMES: Record<number, string> = {
  1: "Social greetings and introductions",
  2: "Casual conversations with friends or acquaintances",
  // ... 30 scenarios total
};

export const DIALOGUES_PER_SCENARIO = 10;
export const TOTAL_SCENARIOS = 30;
```

**Helper functions:**
- `getScenarioName(scenarioNumber)` - Returns scenario name
- `getScenarioProgress(scenarioDialogueProgress)` - Formats progress string

### 2. Helper Robot Panel Updates
**File**: `src/components/HelperRobotPanel.tsx`

#### Added State Management
```typescript
const [showScenarios, setShowScenarios] = useState<boolean>(false);
```

#### Updated Interface
Added scenario fields to `LanguagePair` interface:
```typescript
interface LanguagePair {
  // ... existing fields
  scenario_progress?: number;
  scenario_dialogue_progress?: number;
}
```

#### Progress Display
New "Scenarios Progress" panel showing:
- Scenarios completed out of 30 total
- Purple-to-pink gradient progress bar
- Clickable to show/hide scenario list

### 3. Scenarios List View

When user clicks on "Scenarios Progress", a detailed list appears showing all 30 scenarios with:

#### Visual States

**Completed Scenarios** (Green):
- Green background with border
- Checkmark (✓) indicator
- Shows "10 / 10 dialogues finished"

**Current Scenario** (Purple):
- Purple background with border
- Shows current dialogue progress (e.g., "3 / 10 dialogues finished")
- Highlighted as active

**Locked Scenarios** (Gray):
- Gray background, 50% opacity
- Lock icon (🔒)
- Text appears dimmed
- Not accessible until previous scenario completed

## How It Works

### Progress Calculation

```typescript
const userScenarioProgress = currentPair?.scenario_progress || 0;
const currentScenarioDialogues = currentPair?.scenario_dialogue_progress || 0;

// Determine scenario state
const isUnlocked = scenarioNum <= userScenarioProgress + 1;
const isCompleted = scenarioNum <= userScenarioProgress;
const isCurrent = scenarioNum === userScenarioProgress + 1;
```

### Database Fields Used

From `language_levels` table:
- `scenario_progress` - Number of scenarios completed (0-30)
- `scenario_dialogue_progress` - Number of dialogues completed in current scenario (0-10)

### Display Logic

**Example for user with `scenario_progress = 2` and `scenario_dialogue_progress = 5`:**

| Scenario | Status | Display |
|----------|--------|---------|
| 1 | Completed | ✅ Green, "10 / 10 dialogues finished" |
| 2 | Completed | ✅ Green, "10 / 10 dialogues finished" |
| 3 | Current | 🟣 Purple, "5 / 10 dialogues finished" |
| 4-30 | Locked | 🔒 Gray, dimmed, not accessible |

## UI/UX Features

### Progress Panel
```
┌─────────────────────────────────────────┐
│ Scenarios Progress     [Show Details]   │
│                                         │
│ Scenarios completed      2 / 30        │
│ [▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │
└─────────────────────────────────────────┘
```

### Expanded Scenarios List
```
┌─────────────────────────────────────────┐
│ Scenario 1                           ✓  │
│ Social greetings and introductions      │
│ 10 / 10 dialogues finished             │
│ [Green background]                      │
├─────────────────────────────────────────┤
│ Scenario 2                           ✓  │
│ Casual conversations with friends...    │
│ 10 / 10 dialogues finished             │
│ [Green background]                      │
├─────────────────────────────────────────┤
│ Scenario 3                              │
│ Family gatherings and discussions       │
│ 5 / 10 dialogues finished              │
│ [Purple background - CURRENT]           │
├─────────────────────────────────────────┤
│ Scenario 4                          🔒  │
│ Dating and romantic interactions        │
│ [Gray background - LOCKED]              │
└─────────────────────────────────────────┘
```

### Color Coding

**Progress Bar:**
- Gradient: `from-purple-500 to-pink-500`
- Stands out from other progress bars (green, orange, blue)

**Scenario Cards:**
- **Completed**: `bg-green-900/20 border-green-500/30`
- **Current**: `bg-purple-900/20 border-purple-500/30`
- **Locked**: `bg-white/5 border-white/10 opacity-50`

### Interactive Elements

**Click to Toggle:**
```typescript
<div onClick={toggleScenarios}>
  // Shows/hides scenario list
</div>
```

**Hover Effect:**
```css
hover:bg-white/10 transition-colors
```

## All 30 Scenarios

1. Social greetings and introductions
2. Casual conversations with friends or acquaintances
3. Family gatherings and discussions
4. Dating and romantic interactions
5. Professional networking and meetings
6. Job interviews and career advice
7. Workplace collaborations and feedback
8. Academic discussions and lectures
9. Everyday shopping and transactions
10. Dining out and restaurant interactions
11. Travel planning and bookings
12. Airport and transportation logistics
13. Asking for and giving directions
14. Hotel and accommodation arrangements
15. Medical consultations and health advice
16. Emergency situations and help requests
17. Banking and financial discussions
18. Legal consultations and advice
19. Community events and volunteering
20. Sports and fitness activities
21. Hobbies and leisure pursuits
22. Cultural events and arts appreciation
23. Media and entertainment reviews
24. News and current events debates
25. Politics and social issues discussions
26. Environmental and sustainability talks
27. Technology and gadget troubleshooting
28. Customer service and complaints
29. Negotiations and bargaining
30. Farewells and reflective conversations

## Integration with Existing Features

### Consistent with Vocabulary Progress

Both features use similar patterns:
- Clickable progress panel
- "Show Details" / "Hide Details" toggle
- Scrollable list with max height
- Color-coded items based on status

### Database Synchronization

The progress data is fetched from the same `language_levels` table:
```typescript
const { data, error } = await supabase
  .from('language_levels')
  .select('*')
  .eq('user_id', user.id);
```

### Panel Positioning

Order in HelperRobot panel:
1. Current language pair
2. Dialogues Progress
3. Level Progress
4. Vocabulary Progress
5. **Scenarios Progress** ← New!
6. Account

## Benefits

### For Learners
1. **Clear goal structure** - 30 themed scenarios to complete
2. **Progress visibility** - See exactly what's completed and what's next
3. **Motivation** - Visual progression through real-world conversation topics
4. **Context** - Each scenario has a clear theme/purpose

### For Teachers/Coaches
1. **Structured curriculum** - Predefined conversation topics
2. **Progress tracking** - Monitor student advancement
3. **Thematic learning** - Organized by real-world situations

### For App Design
1. **Extensible** - Easy to add more scenarios
2. **Maintainable** - Centralized scenario definitions
3. **Consistent** - Matches existing progress patterns

## Technical Details

### Performance
- List renders all 30 scenarios efficiently
- Conditional styling based on progress state
- No unnecessary re-renders

### Responsive Design
- Scrollable container (`max-h-[60vh]`)
- Works on all screen sizes
- Consistent spacing

### Error Handling
- Handles missing `scenario_progress` (defaults to 0)
- Handles missing `scenario_dialogue_progress` (defaults to 0)
- Gracefully displays when no language pair is active

## Future Enhancements

Possible improvements:
1. **Click to navigate** - Click on unlocked scenario to start it
2. **Detailed stats** - Show time spent, accuracy per scenario
3. **Achievements** - Badges for completing scenario categories
4. **Filtering** - Filter by category (social, professional, travel, etc.)
5. **Search** - Search scenarios by keyword
6. **Recommendations** - Suggest next scenario based on difficulty/interest
7. **Custom scenarios** - Allow teachers to create custom scenarios

## Testing Checklist

- [x] Scenario names display correctly
- [x] Progress bar shows correct completion percentage
- [x] Current scenario highlighted in purple
- [x] Completed scenarios shown in green
- [x] Locked scenarios grayed out with lock icon
- [x] Dialogue progress shows correctly for current scenario
- [x] Toggle show/hide works
- [x] Scrolling works for long list
- [x] No linter errors
- [x] Consistent with vocabulary progress design

## Files Modified/Created

**Created:**
- `src/constants/scenarios.ts` - Scenario definitions and utilities

**Modified:**
- `src/components/HelperRobotPanel.tsx` - Added scenarios progress UI

## Code Statistics

- **New constants file**: 1 (scenarios.ts)
- **New state variables**: 1 (`showScenarios`)
- **New toggle function**: 1 (`toggleScenarios`)
- **New UI sections**: 2 (progress panel + list view)
- **Lines added**: ~160

## User Experience Flow

```
1. User opens HelperRobot panel
   ↓
2. Sees "Scenarios Progress" with completion count
   ↓
3. Clicks to expand
   ↓
4. Sees list of all 30 scenarios
   ↓
5. Completed scenarios: Green with checkmark
   Current scenario: Purple with dialogue count
   Locked scenarios: Gray with lock icon
   ↓
6. Clear visual progress through conversation topics
```

## Conclusion

The Scenarios Progress feature provides a structured, visual way for learners to track their advancement through 30 real-world conversation scenarios. It integrates seamlessly with the existing progress tracking system while offering a unique thematic organization of learning content.

