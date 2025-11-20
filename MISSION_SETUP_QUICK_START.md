# 🚀 Mission Completion System - Quick Setup

## ✅ Implementation Complete!

All code has been implemented. You just need to run the SQL script to create the database table.

---

## 📋 What Was Implemented

### Files Modified:
1. ✅ **DialogueBox.tsx** - Added help tracking and mission props
2. ✅ **VocalQuizComponent.tsx** - Added mission completion tracking
3. ✅ **progress.ts** - Added `trackCompletedMission()` function
4. ✅ **MissionSelectionPanel.tsx** - Added sequential unlocking logic

### Files Created:
1. ✅ **create-mission-completions-table.sql** - Database table creation script
2. ✅ **MISSION_COMPLETION_SYSTEM.md** - Complete documentation
3. ✅ **MISSION_SETUP_QUICK_START.md** - This file

---

## 🎯 Setup Steps (5 minutes)

### Step 1: Create Database Table

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `create-mission-completions-table.sql`
4. Click **Run**

### Step 2: Verify `mission_progress` Column

Run this SQL to ensure the column exists:

```sql
-- Check if column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'language_levels' 
  AND column_name = 'mission_progress';

-- If it doesn't exist, add it:
ALTER TABLE language_levels 
ADD COLUMN IF NOT EXISTS mission_progress INTEGER DEFAULT 0;
```

### Step 3: Test the System

1. **Start your app**: `npm run dev`
2. **Navigate to any scenario**
3. **Click "Missions"**
4. **Test Mission 1**:
   - Complete WITHOUT clicking "Help Me"
   - Pass the quiz (70%+)
   - ✅ Mission 2 should UNLOCK

5. **Test Help Usage**:
   - Start Mission 2 (or retry Mission 1)
   - Click "Help Me" button
   - Complete and pass quiz
   - ❌ Next mission should stay LOCKED

---

## 🔍 How It Works

### Mission Counts as Complete When:
1. ✅ User completes conversation **WITHOUT** using "Help Me"
2. ✅ User passes quiz (70%+)

### Mission Does NOT Count When:
- ❌ User clicked "Help Me" during conversation
- ❌ User failed quiz (<70%)

### Sequential Unlocking:
- Mission 1: Always unlocked
- Mission 2: Unlocked after Mission 1 complete
- Mission 3: Unlocked after Mission 2 complete
- Mission 4: Unlocked after Mission 3 complete
- Mission 5: Unlocked after Mission 4 complete

Same logic as dialogues! 🎯

---

## 📊 Check Progress

### View User's Mission Completions:

```sql
SELECT 
  scenario_number,
  mission_number,
  score,
  used_help,
  completed_at
FROM mission_completions
WHERE user_id = 'YOUR_USER_UUID'
ORDER BY scenario_number, mission_number;
```

### View Global Mission Progress:

```sql
SELECT 
  user_id,
  mission_progress,
  dialogue_number,
  word_progress
FROM language_levels
WHERE user_id = 'YOUR_USER_UUID';
```

---

## 🎮 User Flow Example

```
USER STARTS MISSION 1
  ↓
Speaks phrases
  ↓
Option: Click "Help Me"? 
  ├─ YES → usedHelp = TRUE ❌
  └─ NO → usedHelp = FALSE ✅
  ↓
NPC achieves mission goal
  ↓
Goes to Quiz
  ↓
Takes quiz on mission expressions
  ↓
Quiz Result?
  ├─ <70% FAIL → Mission NOT complete ❌
  └─ ≥70% PASS → Check help usage
                    ├─ usedHelp = TRUE → NOT complete ❌
                    └─ usedHelp = FALSE → COMPLETE ✅
                                          UNLOCK Mission 2 🎉
```

---

## 🐛 Troubleshooting

### Mission not unlocking?

Check console logs:
```javascript
// DialogueBox
[Missions] Help Me clicked
[Missions] Reset help tracking for mission: X

// VocalQuizComponent
VocalQuizComponent - Mission completion tracked: {
  scenario: 1,
  mission: 1,
  usedHelp: false,
  passed: true,
  actuallyCompleted: true
}

// MissionSelectionPanel
[MissionSelection] Checking unlock status {
  missionNumber: 2,
  previousMissionCompleted: true
}
```

### Database Issues?

1. Check if table exists:
```sql
SELECT * FROM mission_completions LIMIT 1;
```

2. Check RLS policies:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'mission_completions';
```

3. Temporarily disable RLS (testing only):
```sql
ALTER TABLE mission_completions DISABLE ROW LEVEL SECURITY;
```

---

## 📝 Key Features

✅ **No Duplicates** - UNIQUE constraint on (user_id, scenario, mission)
✅ **Retry Support** - UPSERT updates existing records
✅ **Sequential Lock** - Like dialogues, one-by-one unlocking
✅ **Atomic Completion** - Both conditions must be met
✅ **Detailed Tracking** - Stores score, help usage, timestamp
✅ **Security** - RLS policies protect user data
✅ **Simple** - Follows existing codebase patterns

---

## 🎉 That's It!

Your mission completion system is ready to go!

**Just run the SQL script and start testing.**

For detailed documentation, see: `MISSION_COMPLETION_SYSTEM.md`

