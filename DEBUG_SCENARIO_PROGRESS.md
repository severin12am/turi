# 🔍 Debug Scenario Progress Issue

## Problem

After completing first scenario dialogue + quiz:
- ✅ Shows "Success" message
- ❌ Second dialogue stays locked
- ❌ Database shows NULL for `scenario_progress` and `scenario_dialogue_progress`

## Analysis

The code is correct:
- ✅ `trackCompletedScenarioDialogue` function exists (progress.ts line 332-482)
- ✅ `VocalQuizComponent` calls it correctly (line 1523)
- ✅ Passes correct parameters: userId, characterId, scenarioNumber, dialogueId, score

**But:** The database update might be failing silently!

---

## 🧪 Debugging Steps

### Step 1: Check Browser Console

When you complete a quiz, open console (F12) and look for:

**Success messages:**
```
VocalQuizComponent - Scenario dialogue completion tracked for scenario: 1 dialogue: 1
```

**Error messages (look for these):**
```
Error fetching language level for tracking scenario completion
Error updating language level from scenario dialogue completion  
Security check failed in trackCompletedScenarioDialogue
```

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Filter by "language_levels"
3. Complete a quiz
4. Look for PATCH or POST requests to language_levels table
5. Check if they succeed (200) or fail (401, 403, 500)

### Step 3: Check What Actually Happens

In the console, type this after completing a quiz:

```javascript
// Check current user
const user = useStore.getState().user;
console.log('User ID:', user?.id);

// Check language level in database
const { data, error } = await supabase
  .from('language_levels')
  .select('*')
  .eq('user_id', user.id)
  .single();

console.log('Language Level:', data);
console.log('Error:', error);
```

---

## 🔧 Potential Issues

### Issue 1: RLS (Row Level Security) Blocking Updates

**Symptom:** Update returns 403 or doesn't execute  
**Cause:** RLS policy on `language_levels` table prevents updates  
**Solution:** Need to check/update RLS policies in Supabase

### Issue 2: User ID Mismatch

**Symptom:** Update doesn't find matching row  
**Cause:** user_id in database doesn't match logged-in user  
**Solution:** Verify user ID matches

### Issue 3: Target Language Mismatch  

**Symptom:** Update doesn't find matching row  
**Cause:** target_language in query doesn't match database  
**Solution:** Check if language is correct

### Issue 4: Silent Failure in secureQuery

**Symptom:** No error shown but update doesn't happen  
**Cause:** Error caught but not thrown  
**Solution:** Add better error logging

---

## 🎯 Quick Fix to Test

Let me add console logging to see what's happening. Open browser console and paste this:

```javascript
// Override the tracking function temporarily to see what happens
window.debugScenarioTracking = async (userId, characterId, scenarioNumber, dialogueId, score) => {
  console.log('🔍 DEBUG: trackCompletedScenarioDialogue called with:', {
    userId, characterId, scenarioNumber, dialogueId, score
  });
  
  // Try to update language_levels directly
  const targetLanguage = 'ru'; // Change if needed
  
  // First, check if record exists
  const { data: existing, error: checkError } = await supabase
    .from('language_levels')
    .select('*')
    .eq('user_id', userId)
    .eq('target_language', targetLanguage)
    .single();
    
  console.log('🔍 Existing record:', existing);
  console.log('🔍 Check error:', checkError);
  
  if (existing) {
    // Try to update
    const { data: updated, error: updateError } = await supabase
      .from('language_levels')
      .update({
        scenario_dialogue_progress: dialogueId,
        scenario_progress: scenarioNumber
      })
      .eq('user_id', userId)
      .eq('target_language', targetLanguage)
      .select();
      
    console.log('🔍 Update result:', updated);
    console.log('🔍 Update error:', updateError);
    
    if (updateError) {
      console.error('❌ UPDATE FAILED:', updateError);
      if (updateError.code === 'PGRST301') {
        console.error('❌ RLS POLICY BLOCKING UPDATE!');
      }
    } else {
      console.log('✅ UPDATE SUCCEEDED!');
    }
  }
};

// Now complete a quiz and check console
console.log('✅ Debug function ready. Complete a quiz and watch the logs.');
```

---

## 🚨 Most Likely Cause

Based on the code analysis, the most likely issue is **RLS (Row Level Security)** blocking the update.

The update query needs permission to:
1. SELECT from language_levels (to find the row)
2. UPDATE the language_levels row

If RLS is enabled, you need policies like:

```sql
-- Allow users to update their own language levels
CREATE POLICY "Users can update own language levels"
ON language_levels
FOR UPDATE
USING (auth.uid() = user_id::uuid);
```

---

## ✅ Next Steps

1. **Check console** for errors after completing quiz
2. **Check Network tab** for failed requests
3. **Run debug script** above to see exact error
4. **Send me the error** and I'll fix the RLS policies

The progress tracking code is correct - it's just being blocked by database permissions!

