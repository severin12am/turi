# Scenario Feature Implementation

## Overview
This document describes the implementation of the scenario feature that allows users to practice language learning through scenario-based dialogues in addition to regular character dialogues.

## What Was Implemented

### 1. Database Structure
The feature assumes the following database columns already exist in the `language_levels` table:
- `scenario_progress` - Tracks which scenario the user is on (similar to `level` for regular dialogues)
- `scenario_dialogue_progress` - Tracks progress within a scenario (similar to `dialogue_number`)

And a table structure for scenarios:
- `scenario_1`, `scenario_2`, etc. - Tables with the same structure as `phrases_1`, `phrases_2`, etc.
  - Columns: `dialogue_step`, `dialogue_id`, `en_text`, `es_text`, `en_text_ru`, etc.

### 2. Type Updates (`src/types/index.ts`)
Updated the `LanguageLevel` interface to include:
```typescript
scenario_progress?: number;
scenario_dialogue_progress?: number;
```

### 3. New Component: ScenarioSelectionPanel (`src/components/ScenarioSelectionPanel.tsx`)
Created a new component that displays available scenario dialogues, similar to the regular dialogue selection panel.

Features:
- Displays a list of scenario dialogues from the `scenario_X` table
- Shows locked/unlocked status based on `scenario_dialogue_progress`
- Each dialogue is unlocked sequentially (dialogue 2 unlocks after completing dialogue 1, etc.)
- Includes a back button to return to the main dialogue selection
- Supports both authenticated and anonymous users

### 4. DialogueSelectionPanel Updates (`src/components/DialogueSelectionPanel.tsx`)
Added a special "Scenarios" section that appears above regular dialogues:
- Button labeled "Scenario 1: Greetings and Introductions"
- Uses a distinct purple/pink gradient styling to differentiate from regular dialogues
- Only appears for character 1 (can be extended to other characters)
- Clicking opens the ScenarioSelectionPanel

### 5. DialogueBox Updates (`src/components/DialogueBox.tsx`)
Enhanced to support scenario dialogues:
- Added props: `isScenario` and `scenarioNumber`
- Dynamically fetches from either `phrases_X` or `scenario_X` table based on `isScenario` flag
- Passes scenario information to VocalQuizComponent for proper progress tracking

### 6. VocalQuizComponent Updates (`src/components/VocalQuizComponent.tsx`)
Updated to handle scenario completion tracking:
- Added props: `isScenario` and `scenarioNumber`
- Calls `trackCompletedScenarioDialogue()` for scenario dialogues instead of `trackCompletedDialogue()`
- Properly tracks progress in the `scenario_dialogue_progress` and `scenario_progress` columns

### 7. Progress Service Updates (`src/services/progress.ts`)
Added new function `trackCompletedScenarioDialogue()`:
- Similar to `trackCompletedDialogue()` but updates scenario-specific columns
- Updates `scenario_dialogue_progress` to track the highest completed dialogue
- Updates `scenario_progress` to track the current scenario number
- Handles both new user creation and existing user updates
- Includes security validation via `secureQuery()`

### 8. City Scene Integration (`src/scenes/City.tsx`)
Wired up all the scenario functionality:
- Added state management for scenarios:
  - `showScenarioSelection` - Controls ScenarioSelectionPanel visibility
  - `selectedScenarioNumber` - Tracks which scenario is selected
  - `isScenarioDialogue` - Flag to indicate if current dialogue is from a scenario
- Added handlers:
  - `handleScenarioClick()` - Opens scenario selection
  - `handleScenarioDialogueSelect()` - Starts a scenario dialogue
  - `handleScenarioBack()` - Returns to main dialogue selection
- Updated `handleCloseDialogue()` to return to the appropriate panel (scenario or regular)
- Passes scenario props to DialogueBox when `isScenarioDialogue` is true
- Renders ScenarioSelectionPanel when appropriate

## User Flow

1. User approaches Character 1
2. DialogueSelectionPanel opens showing:
   - **Scenarios** section with "Scenario 1: Greetings and Introductions" button
   - **Regular Dialogues** section with 5 regular dialogues
3. User clicks on "Scenario 1" button
4. ScenarioSelectionPanel opens showing a list of scenario dialogues
5. User selects an unlocked scenario dialogue
6. DialogueBox opens and fetches from `scenario_1` table
7. User completes the dialogue
8. VocalQuizComponent opens with words from that scenario dialogue
9. Upon quiz completion, `scenario_dialogue_progress` is updated
10. User is returned to ScenarioSelectionPanel to continue with next dialogue

## Progress Tracking

### Regular Dialogues
- Tracked in `level` and `dialogue_number` columns
- Uses `phrases_X` tables

### Scenario Dialogues
- Tracked in `scenario_progress` and `scenario_dialogue_progress` columns
- Uses `scenario_X` tables
- Completely independent from regular dialogue progress

## Anonymous User Support

The feature supports anonymous users by storing progress in localStorage:
- Key: `turi_scenario_progress`
- Format: `{ scenarios: { [scenarioNumber]: [{ dialogueId, completed, score }] } }`

## Styling

Scenario buttons use a distinctive purple/pink gradient to differentiate from regular dialogues:
- Background: `from-purple-600/20 to-pink-600/20`
- Border: `border-purple-500/30`
- Hover states with increased opacity
- "Special" badge in purple theme

## Extension Points

To add more scenarios:
1. Create `scenario_2`, `scenario_3`, etc. tables in the database
2. Add scenario buttons in DialogueSelectionPanel for the appropriate characters
3. The system will automatically handle progress tracking and dialogue flow

To add scenarios to other characters:
1. Create `scenario_X` tables where X is the character ID
2. Update the condition in DialogueSelectionPanel from `characterId === 1` to include other character IDs
3. Customize the scenario name and description for each character

## Files Modified

1. `src/types/index.ts` - Added scenario fields to LanguageLevel
2. `src/components/ScenarioSelectionPanel.tsx` - New component (304 lines)
3. `src/components/DialogueSelectionPanel.tsx` - Added scenario button and section
4. `src/components/DialogueBox.tsx` - Added scenario support
5. `src/components/VocalQuizComponent.tsx` - Added scenario tracking
6. `src/services/progress.ts` - Added trackCompletedScenarioDialogue()
7. `src/scenes/City.tsx` - Integrated all scenario functionality

## Testing Recommendations

1. Test scenario button appears for character 1
2. Test scenario selection panel opens when clicking scenario button
3. Test scenario dialogues are properly locked/unlocked based on progress
4. Test dialogue fetches from correct `scenario_X` table
5. Test progress is correctly tracked in `scenario_dialogue_progress`
6. Test back button returns to main dialogue selection
7. Test anonymous user progress is saved to localStorage
8. Test authenticated user progress is saved to database
9. Test scenario progress doesn't affect regular dialogue progress and vice versa

