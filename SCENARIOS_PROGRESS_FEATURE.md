# Scenarios Progress Feature

## Overview
Added a **Scenarios Progress** section to the HelperRobot panel that displays progress through 30 real-world conversation scenarios. Users can click on the section to view a detailed list of all scenarios with completion status.

## What Was Implemented

### 1. Scenarios Constants File
Created `src/constants/scenarios.ts` with:

- **30 scenario names** covering various real-world situations:
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

- **Helper functions**:
  - `getScenarioName(number)` - Get scenario name by number
  - `getAllScenarios()` - Get all scenarios as array of objects
  - `TOTAL_SCENARIOS` - Constant for total number of scenarios (30)

### 2. Updated HelperRobotPanel Component

#### State Management
```typescript
const [showScenarios, setShowScenarios] = useState<boolean>(false);
```

#### Interface Updates
```typescript
interface LanguagePair {
  // ... existing fields
  scenario_progress?: number;
  scenario_dialogue_progress?: number;
}
```

#### Toggle Function
```typescript
const toggleScenarios = () => {
  setShowScenarios(!showScenarios);
};
```

### 3. UI Components

#### Scenarios Progress Bar
- **Location**: After Vocabulary Progress section
- **Clickable**: Shows/hides detailed scenario list
- **Progress Bar Color**: Pink to Rose gradient
- **Displays**: "X / 30" completed scenarios
- **Hover Effect**: Background lightens on hover

```tsx
<div className="bg-white/5 rounded-2xl p-5 mb-6 cursor-pointer hover:bg-white/10">
  <h3>Scenarios Progress</h3>
  <span>{completedScenarios} / {TOTAL_SCENARIOS}</span>
  <div className="progress-bar from-pink-500 to-rose-500" />
</div>
```

#### Scenarios List (Expandable)
When clicked, displays all 30 scenarios with:

**For Completed Scenarios:**
- Green background with border (`bg-green-900/20 border-green-500/30`)
- Green numbered circle badge
- Green scenario name
- "✓ Completed" label

**For Incomplete Scenarios:**
- Subtle white background (`bg-white/5`)
- Gray numbered circle badge
- White scenario name
- No completion indicator

```tsx
<div className={isCompleted ? 'bg-green-900/20' : 'bg-white/5'}>
  <div className="number-badge">{scenario.number}</div>
  <div className="scenario-name">{scenario.name}</div>
  {isCompleted && <div>✓ Completed</div>}
</div>
```

## User Experience

### Progress Section Order
1. **Dialogues Progress** (Green/Teal gradient)
2. **Level Progress** (Orange/Amber gradient)
3. **Vocabulary Progress** (Blue/Purple gradient) - Clickable
4. **Scenarios Progress** (Pink/Rose gradient) - Clickable ⭐ NEW

### Interaction Flow

```
User clicks "Scenarios Progress" section
  ↓
Panel expands to show all 30 scenarios
  ↓
Each scenario shows:
- Number (1-30)
- Full scenario name
- Completion status (green checkmark if completed)
  ↓
User can scroll through the list
  ↓
Click again to collapse
```

### Visual Design

**Completed Scenario Example:**
```
┌─────────────────────────────────────────┐
│  [1]  Social greetings and introductions │
│       ✓ Completed                        │
└─────────────────────────────────────────┘
(Green background, green badge)
```

**Incomplete Scenario Example:**
```
┌─────────────────────────────────────────┐
│  [15] Medical consultations and health  │
│       advice                             │
└─────────────────────────────────────────┘
(Gray background, gray badge)
```

## Technical Details

### Data Source
Progress is retrieved from the `language_levels` table:
- `scenario_progress` - Number of scenarios completed (0-30)
- `scenario_dialogue_progress` - Progress within current scenario

### Progress Calculation
```typescript
const completedScenarios = pair.scenario_progress || 0;
const progressPercentage = (completedScenarios / TOTAL_SCENARIOS) * 100;
```

### Completion Status Logic
```typescript
const isCompleted = scenario.number <= completedScenarios;
```

If user has `scenario_progress = 5`, scenarios 1-5 show as completed, 6-30 show as incomplete.

## Benefits

### For Users
1. **Clear Overview** - See all 30 scenarios at a glance
2. **Progress Tracking** - Visual indication of completed scenarios
3. **Motivation** - Progress bar encourages completion
4. **Organization** - Scenarios grouped by theme and ordered logically

### For Learning
1. **Goal Setting** - 30 clear milestones
2. **Diverse Practice** - Wide range of real-world situations
3. **Structured Progression** - From social to professional to specialized contexts
4. **Comprehensive Coverage** - Everyday, travel, work, emergency, and social scenarios

## Scenario Categories

### Social (1-4)
- Greetings, casual talks, family, dating

### Professional (5-8)
- Networking, interviews, workplace, academic

### Daily Life (9-10)
- Shopping, dining

### Travel (11-14)
- Planning, airport, directions, hotels

### Essential Services (15-18)
- Medical, emergency, banking, legal

### Community & Leisure (19-24)
- Events, sports, hobbies, culture, media

### Advanced Topics (25-27)
- Politics, environment, technology

### Practical Skills (28-30)
- Customer service, negotiations, farewells

## Future Enhancements

Possible improvements:
1. **Scenario Search** - Filter scenarios by keyword
2. **Category Tabs** - Group scenarios by category (Social, Professional, etc.)
3. **Click to Start** - Click scenario to launch it directly
4. **Difficulty Indicators** - Show scenario difficulty (A1, A2, B1, etc.)
5. **Time Estimates** - Show estimated completion time per scenario
6. **Recommended Next** - Highlight the next recommended scenario
7. **Statistics** - Show completion date, attempts, best score per scenario
8. **Favorites** - Allow users to mark favorite scenarios
9. **Custom Scenarios** - Let users create or request custom scenarios
10. **Scenario Details** - Click to see preview of dialogue topics within scenario

## Files Modified

1. **Created**: `src/constants/scenarios.ts`
   - Scenario names constant
   - Helper functions
   
2. **Modified**: `src/components/HelperRobotPanel.tsx`
   - Added `showScenarios` state
   - Added `toggleScenarios` function
   - Updated `LanguagePair` interface
   - Added Scenarios Progress section
   - Added expandable scenarios list

## Testing Checklist

- [x] Scenarios progress bar displays correctly
- [x] Shows "0 / 30" when no scenarios completed
- [x] Progress bar width updates based on completion
- [x] Click toggles scenario list visibility
- [x] "Show Details" / "Hide Details" text changes
- [x] All 30 scenarios display in order
- [x] Completed scenarios show green styling
- [x] Incomplete scenarios show gray styling
- [x] Scenario numbers display correctly (1-30)
- [x] Scenario names display correctly
- [x] Checkmark appears only for completed scenarios
- [x] Scrollable when list is long
- [x] No linter errors
- [x] Responsive design works

## Code Statistics

- **New file**: 1 (`scenarios.ts`)
- **Constants**: 30 scenario names
- **Helper functions**: 3
- **New state variables**: 1 (`showScenarios`)
- **New functions**: 1 (`toggleScenarios`)
- **UI sections**: 2 (progress bar + expandable list)
- **Lines added**: ~130

## Comparison with Vocabulary Progress

| Feature | Vocabulary | Scenarios |
|---------|-----------|-----------|
| **Progress Bar Color** | Blue → Purple | Pink → Rose |
| **Total Items** | 500 words | 30 scenarios |
| **Clickable** | ✅ Yes | ✅ Yes |
| **Search Function** | ✅ Yes | ❌ No (could add) |
| **Grid Layout** | 5 columns | 1 column |
| **Completion Indicator** | Green background | Green + checkmark |
| **Item Details** | Word + Translation | Number + Name |

## User Feedback Messages

```javascript
// Progress section
"Scenarios completed: 5 / 30"

// List header
"Show Details" / "Hide Details"

// Completed scenario
"✓ Completed"

// Example entry
"1. Social greetings and introductions"
"15. Medical consultations and health advice"
```

## Accessibility

- **Keyboard Navigation**: Panel is navigable
- **Visual Hierarchy**: Clear number badges and text
- **Color Contrast**: High contrast between text and backgrounds
- **Status Indicators**: Both color and text ("✓ Completed")
- **Hover Effects**: Subtle feedback on interactive elements

## Performance

- **Lightweight**: Only 30 items to render
- **Conditional Rendering**: List only shows when toggled
- **No API Calls**: Uses data already fetched for language pairs
- **Instant Toggle**: No loading state needed

## Conclusion

The Scenarios Progress feature provides users with a clear, organized view of their progress through 30 real-world conversation scenarios. The clickable interface, visual progress tracking, and clear completion indicators make it easy for users to see where they are in their learning journey and what scenarios await them. This complements the existing vocabulary and dialogue progress tracking, giving users a complete picture of their language learning advancement.

