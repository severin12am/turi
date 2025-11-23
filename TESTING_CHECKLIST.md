# 🧪 Mission Completion Testing Checklist

## Prerequisites
✅ Code changes deployed (VocalQuizComponent.tsx, progress.ts, and types/index.ts)
✅ No database changes needed - your tables are already correct!

## Test Scenario 1: Successful Mission Completion ✅

### Steps:
1. Start development server: `npm run dev`
2. Login to your account
3. Select Spanish (or your target language)
4. Click on a mission character
5. Start Mission 1 from Mission Selection Panel
6. Complete the conversation:
   - Speak/type your responses
   - **DO NOT** click "Help Me" button
   - NPC will respond naturally
   - Complete the conversation goal
7. Click "Continue to Quiz"
8. Answer all quiz questions:
   - Take multiple attempts if needed
   - Eventually answer ALL questions correctly
   - (You can try wrong answers first - it should still pass!)
9. Click "Finish Quiz"

### Expected Results:
- ✅ Quiz shows: "Great work!" (passed)
- ✅ Score displays (e.g., 85%)
- ✅ Console logs:
  ```
  VocalQuizComponent - Quiz finished with score: 85.71... passed: true isMission: true
  VocalQuizComponent - Mission completion tracked: { actuallyCompleted: true }
  ```
- ✅ Next mission unlocks in Mission Selection Panel

### Database Verification:
```sql
-- Check mission was saved
SELECT * FROM mission_completions 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY completed_at DESC 
LIMIT 1;

-- Expected result:
-- scenario_number: 1
-- mission_number: 1
-- used_help: false
-- score: 85 (your actual score)

-- Check mission progress updated
SELECT mission_progress FROM language_levels 
WHERE user_id = 'YOUR_USER_ID';

-- Expected: mission_progress = 2 (if this was your first mission)
```

---

## Test Scenario 2: Mission with Help Used ❌

### Steps:
1. Start a new mission
2. During conversation, click "Help Me" button
3. Complete the conversation with the AI's suggestion
4. Complete the quiz (answer all correctly)

### Expected Results:
- ✅ Quiz shows: "Great work!" (passed)
- ❌ Console logs:
  ```
  VocalQuizComponent - Mission completion tracked: { 
    actuallyCompleted: false,
    reason: "Used help"
  }
  ```
- ❌ Next mission **does NOT unlock**
- ✅ Mission saved to `mission_completions` with `used_help = true`

---

## Test Scenario 3: Regular Dialogue (Non-Mission) 📚

### Steps:
1. Click on a regular character (not in mission mode)
2. Complete a pre-scripted dialogue
3. Take the quiz
4. Get 60% or higher on first try

### Expected Results:
- ✅ Quiz passes with 60%+ score
- ✅ Progress updates in `language_levels.dialogue_number`
- ✅ Word progress increases
- ✅ No mission tracking (this is expected)

---

## Test Scenario 4: Quiz Logic - Eventual Completion 🔄

### Steps:
1. Start a mission quiz with 7 questions
2. For question 1: Answer correctly ✅
3. For question 2: Try wrong answer 3 times, then correct ❌❌❌✅
4. For question 3: Answer correctly ✅
5. For question 4: Try wrong answer 5 times, then correct ❌(x5)✅
6. Continue until all 7 questions answered

### Expected Results:
- ✅ Score: Lower than 100% (e.g., 42% first-try accuracy)
- ✅ **But still PASSES** because all questions eventually answered
- ✅ Mission counts as completed
- ✅ Console shows: `passed: true isMission: true`

**This is the new behavior!** Old version would fail with < 60% first-try accuracy.

---

## Common Issues & Solutions

### Issue: "Failed to load resource: 400"
**Solution:** Table doesn't exist. Run `supabase_mission_completions_table.sql`

### Issue: "Column 'mission_progress' does not exist"
**Solution:** Run `supabase_verify_tables.sql`

### Issue: Mission tracked but progress didn't increase
**Possible causes:**
1. Used help button (check `usedHelpInMission` in logs)
2. RLS policy blocking update
3. User not authenticated

**Debug query:**
```sql
SELECT * FROM mission_completions 
WHERE user_id = 'YOUR_USER_ID' 
AND scenario_number = 1 
AND mission_number = 1;
```

### Issue: Quiz shows as failed even though I answered all questions
**Check console for:**
```
VocalQuizComponent - Quiz finished with score: X passed: false isMission: true
```

If `isMission: false`, you're not in mission mode. Make sure you:
- Clicked on a character **during mission mode**
- Mission Selection Panel was open when starting

---

## Performance Expectations

| Action | Expected Time |
|--------|--------------|
| Mission NPC response | 1-2 seconds (Groq) |
| Quiz question TTS | 0.5-1 second |
| Database save | < 500ms |
| Mission unlock | Immediate |

---

## Success Criteria ✅

All of these should work:

- [x] Code changes applied (no TypeScript errors)
- [x] SQL tables created successfully
- [x] Mission completes without help → saves to database
- [x] Mission with help → saves but doesn't unlock next
- [x] Quiz passes even with multiple attempts per question
- [x] `mission_progress` increments correctly
- [x] Next mission unlocks in UI
- [x] Console logs show success messages
- [x] No 400 errors in network tab

---

## Final Verification Query

Run this to see your complete mission history:

```sql
SELECT 
  mc.scenario_number,
  mc.mission_number,
  mc.score,
  mc.used_help,
  mc.completed_at,
  ll.mission_progress as current_unlocked_mission
FROM mission_completions mc
JOIN language_levels ll ON mc.user_id = ll.user_id
WHERE mc.user_id = 'YOUR_USER_ID'
ORDER BY mc.completed_at DESC;
```

Expected output:
```
scenario_number | mission_number | score | used_help | completed_at | current_unlocked_mission
----------------|----------------|-------|-----------|--------------|-------------------------
1               | 1              | 85    | false     | 2025-11-23   | 2
```

This shows Mission 1 completed successfully, Mission 2 now unlocked!

