# 🎯 Mission Completion System - Implementation Complete

## Overview

This document explains the mission completion and sequential unlocking system. A mission is **only counted as completed** when the user:
1. ✅ Completes the conversation **WITHOUT** using the "Help Me" button from Tutri
2. ✅ Passes the quiz (70%+) after the mission

## 🔑 Key Features

### 1. Help Tracking
- **Location**: `DialogueBox.tsx`
- Tracks when user clicks "Help Me" button
- Sets `usedHelpInMission = true` when help is requested
- Resets to `false` when a new mission starts

### 2. Mission Progress Tracking
- **Location**: `src/services/progress.ts` - `trackCompletedMission()`
- **Database Tables**:
  - `language_levels.mission_progress` - Global mission counter (1-150)
  - `mission_completions` - Detailed completion records per mission

### 3. Sequential Unlocking
- **Location**: `MissionSelectionPanel.tsx`
- Mission 1 is always unlocked
- Mission N requires Mission N-1 to be completed
- Just like dialogues: 2nd unlocks after 1st, 3rd after 2nd, etc.

### 4. Quiz Integration
- **Location**: `VocalQuizComponent.tsx`
- Receives mission tracking props from DialogueBox
- Calls `trackCompletedMission()` after quiz completion
- Only updates progress if `!usedHelp && quizPassed`

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────┐
│  USER STARTS MISSION                        │
│  - usedHelpInMission = false                │
│  - Mission goal displayed                   │
└──────────────────┬──────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────┐
│  USER SPEAKS                                │
│  - Tutri validates sentence                 │
│  - NPC responds if approved                 │
│                                             │
│  IF "HELP ME" CLICKED:                      │
│    usedHelpInMission = TRUE  ❌             │
└──────────────────┬──────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────┐
│  MISSION GOAL ACHIEVED                      │
│  - NPC detects completion                   │
│  - Shows [Replay] [Go to Quiz]              │
└──────────────────┬──────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────┐
│  QUIZ STARTS                                │
│  - AI extracts expressions from conversation│
│  - Quiz props include:                      │
│    * missionScenarioNumber                  │
│    * missionNumber                          │
│    * usedHelpInMission                      │
└──────────────────┬──────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────┐
│  QUIZ COMPLETED                             │
│  - Calculate score (correctCount / total)   │
│  - quizPassed = (score >= 70%)              │
└──────────────────┬──────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────┐
│  trackCompletedMission() CALLED             │
│                                             │
│  CHECK: !usedHelp && quizPassed             │
│                                             │
│  IF BOTH TRUE ✅:                            │
│    1. Calculate globalMissionId             │
│       = (scenarioNumber - 1) * 5 + mission# │
│    2. Update mission_progress               │
│    3. Insert into mission_completions       │
│    4. UNLOCK NEXT MISSION                   │
│                                             │
│  IF FALSE ❌:                                │
│    - Mission NOT counted as complete        │
│    - User can retry same mission            │
│    - Next mission stays LOCKED              │
└─────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Table: `mission_completions`

```sql
CREATE TABLE mission_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  scenario_number INTEGER NOT NULL CHECK (1-30),
  mission_number INTEGER NOT NULL CHECK (1-5),
  score INTEGER NOT NULL CHECK (0-100),
  used_help BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, scenario_number, mission_number)
);
```

**Purpose**: Detailed tracking of each mission attempt
- Stores whether help was used
- Stores quiz score
- Uses UPSERT to handle retries (updates existing record)

### Table: `language_levels`
**Added Column**: `mission_progress INTEGER`

**Purpose**: Global mission counter (1-150)
- Sequential across all scenarios
- Example values:
  - Scenario 1, Mission 1 = `1`
  - Scenario 1, Mission 5 = `5`
  - Scenario 2, Mission 1 = `6`
  - Scenario 30, Mission 5 = `150`

---

## 🔧 Implementation Details

### 1. DialogueBox.tsx Changes

**Added State**:
```typescript
const [usedHelpInMission, setUsedHelpInMission] = useState(false);
```

**Modified `handleHelpMe()`**:
```typescript
const handleHelpMe = async () => {
  setUsedHelpInMission(true); // Track help usage
  // ... rest of help logic
};
```

**Added Reset Effect**:
```typescript
useEffect(() => {
  if (isMissionMode && mission) {
    setUsedHelpInMission(false); // Reset for new mission
  }
}, [isMissionMode, mission?.id]);
```

**Updated VocalQuizComponent Props**:
```typescript
<VocalQuizComponent
  // ... existing props
  missionScenarioNumber={isMissionMode ? scenarioNumber : undefined}
  missionNumber={isMissionMode ? mission?.missionNumber : undefined}
  usedHelpInMission={usedHelpInMission}
/>
```

### 2. VocalQuizComponent.tsx Changes

**Updated Interface**:
```typescript
interface VocalQuizProps {
  // ... existing props
  missionScenarioNumber?: number;
  missionNumber?: number;
  usedHelpInMission?: boolean;
}
```

**Added Mission Tracking in `finishQuiz()`**:
```typescript
// NEW: Track mission completion if this is a mission quiz
if (isMission && missionScenarioNumber !== undefined && missionNumber !== undefined) {
  const { trackCompletedMission } = await import('../services/progress');
  
  const missionTracked = await trackCompletedMission(
    user.id,
    missionScenarioNumber,
    missionNumber,
    usedHelpInMission,
    passed,
    passPercentage
  );
}
```

### 3. progress.ts - New Function

**Function**: `trackCompletedMission()`
- **Parameters**: `userId, scenarioNumber, missionNumber, usedHelp, quizPassed, score`
- **Returns**: `boolean` (true if mission counted as complete)

**Key Logic**:
```typescript
// CRITICAL: Mission only counts if NO HELP and QUIZ PASSED
const missionActuallyCompleted = !usedHelp && quizPassed;

if (!missionActuallyCompleted) {
  logger.warn('Mission not counted as completed');
  return false; // Don't update progress
}

// Calculate global mission ID
const globalMissionId = (scenarioNumber - 1) * 5 + missionNumber;

// Update mission_progress
const newMissionProgress = Math.max(globalMissionId, currentMissionProgress);

// Save to mission_completions table (with UPSERT for retries)
await supabase.from('mission_completions').upsert([{...}]);
```

### 4. MissionSelectionPanel.tsx Changes

**Load Completed Missions**:
```typescript
if (user?.id) {
  const { data: completedData } = await supabase
    .from('mission_completions')
    .select('mission_number')
    .eq('user_id', user.id)
    .eq('scenario_number', scenarioNumber);
  
  const completed = new Set(completedData.map(m => m.mission_number));
  setCompletedMissions(completed);
}
```

**Sequential Unlocking Logic**:
```typescript
const isMissionUnlocked = (missionNumber: number): boolean => {
  if (missionNumber === 1) return true; // First always unlocked
  
  // Check if previous mission is completed
  return completedMissions.has(missionNumber - 1);
};
```

---

## 🎮 User Experience

### Scenario 1: Mission Completed Properly ✅

```
1. User starts Mission 1
2. User speaks sentences WITHOUT clicking "Help Me"
3. NPC responds, mission goal achieved
4. User goes to quiz
5. User scores 80% (passed)

Result:
✅ Mission 1 marked as completed
✅ Mission 2 UNLOCKED
✅ mission_progress = 1
✅ Record saved to mission_completions
```

### Scenario 2: User Used Help ❌

```
1. User starts Mission 1
2. User clicks "Help Me" (usedHelpInMission = true)
3. Tutri provides suggestion
4. User completes mission and quiz with 85%

Result:
❌ Mission 1 NOT counted as complete
❌ Mission 2 stays LOCKED
⚠️ User can retry Mission 1
```

### Scenario 3: Quiz Failed ❌

```
1. User starts Mission 1
2. User speaks without help (usedHelpInMission = false)
3. Mission goal achieved
4. User scores 60% on quiz (failed)

Result:
❌ Mission 1 NOT counted as complete
❌ Mission 2 stays LOCKED
⚠️ User can retry Mission 1
```

### Scenario 4: Retry After Using Help ✅

```
1. First attempt: Used help, quiz passed → NOT counted
2. User retries Mission 1
3. Second attempt: No help, quiz passed

Result:
✅ Mission 1 NOW marked as completed
✅ Mission 2 UNLOCKED
✅ mission_completions record UPDATED (UPSERT)
```

---

## 📝 Setup Instructions

### Step 1: Run SQL Script

Execute the SQL script to create the table:
```bash
# In Supabase SQL Editor, run:
create-mission-completions-table.sql
```

### Step 2: Verify `mission_progress` Column Exists

Check that `language_levels` table has:
```sql
ALTER TABLE language_levels 
ADD COLUMN IF NOT EXISTS mission_progress INTEGER DEFAULT 0;
```

### Step 3: Test the System

1. Start Mission 1 in any scenario
2. Complete without help → Pass quiz → Should unlock Mission 2
3. Start Mission 2 (or retry Mission 1)
4. Click "Help Me" → Pass quiz → Should NOT unlock next mission
5. Retry without help → Pass quiz → Should NOW unlock

---

## 🔍 Debugging

### Check Mission Progress

```sql
-- View user's mission progress
SELECT 
  scenario_number,
  mission_number,
  score,
  used_help,
  completed_at
FROM mission_completions
WHERE user_id = 'USER_UUID'
ORDER BY scenario_number, mission_number;

-- View global mission progress
SELECT 
  user_id,
  mission_progress,
  target_language
FROM language_levels
WHERE user_id = 'USER_UUID';
```

### Console Logs

Look for these log messages:
- `[Missions] Help Me clicked` - Help was used
- `[Missions] Mission completed!` - NPC detected goal achieved
- `VocalQuizComponent - Mission completion tracked` - Quiz tracking
- `Mission not counted as completed` - Failed requirements
- `[MissionSelection] Checking unlock status` - Lock/unlock logic

---

## 🎯 Mission Progress Formula

**Global Mission ID** = `(scenarioNumber - 1) * 5 + missionNumber`

### Examples:
| Scenario | Mission | Calculation | Global ID |
|----------|---------|-------------|-----------|
| 1        | 1       | (1-1)*5 + 1 | **1**     |
| 1        | 5       | (1-1)*5 + 5 | **5**     |
| 2        | 1       | (2-1)*5 + 1 | **6**     |
| 2        | 5       | (2-1)*5 + 5 | **10**    |
| 5        | 3       | (5-1)*5 + 3 | **23**    |
| 30       | 5       | (30-1)*5 + 5| **150**   |

---

## ✅ Features Summary

1. **Help Tracking** - Monitors "Help Me" button usage
2. **Atomic Completion** - Requires BOTH no-help AND quiz-pass
3. **Sequential Unlocking** - Like dialogues, missions unlock one-by-one
4. **Detailed Records** - `mission_completions` stores all attempts
5. **Global Progress** - `mission_progress` tracks overall advancement
6. **Retry Support** - Users can retry missions (UPSERT updates records)
7. **No Duplicates** - UNIQUE constraint prevents duplicate completions
8. **Security** - RLS policies protect user data
9. **Logging** - Comprehensive logging for debugging
10. **Simple & Clean** - Follows existing codebase patterns

---

## 🚀 Ready to Use

The system is fully implemented and ready for testing! Users will now need to complete missions properly (without help, with quiz pass) to unlock subsequent missions.

**Next Steps**:
1. Run the SQL script in Supabase
2. Test with a user account
3. Verify missions unlock sequentially
4. Check that help usage blocks completion
5. Confirm quiz failure blocks completion

Enjoy the new mission system! 🎉

