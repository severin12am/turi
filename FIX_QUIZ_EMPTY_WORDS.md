# 🔧 Fix: Quiz Showing Empty Words

## Problem Identified ✅

Your `quiz` table has **1000 Spanish words** but **NO translations** in other languages!

```
✅ Quiz table exists: 1000 rows
❌ Spanish: como, English: (empty), Russian: (empty)
❌ Spanish: yo, English: (empty), Russian: (empty)
```

## Quick Fix (5 minutes)

### Step 1: Run SQL Script in Supabase

1. Go to Supabase Dashboard
2. Click "SQL Editor" in left sidebar
3. Click "New query"
4. Copy the contents of `populate-quiz-translations.sql`
5. Paste and click "Run"

This will add English translations for ~120 most common Spanish words.

### Step 2: Verify It Worked

After running the SQL, you should see:
```sql
-- Query result:
total_words: 1000
words_with_english: 120+
words_with_spanish: 1000
```

### Step 3: Test the Quiz

1. Refresh your browser (Ctrl+R or Cmd+R)
2. Complete a scenario dialogue
3. Check the quiz - should now show words like:
   - "How do you say **house** in Spanish?" (instead of empty)

## What Was Fixed

### Before:
```
How do you say "" in Spanish?  ❌ Empty!
```

### After (without translations):
```
How do you say [casa] (translation missing) in Spanish?
⚠️ Shows Spanish word as fallback
```

### After (with translations from SQL):
```
How do you say "house" in Spanish?  ✅ Perfect!
```

## If You Have More Words to Translate

The SQL script only covers ~120 common words. To add more:

```sql
-- Add more translations
UPDATE quiz SET english = 'your_translation' WHERE spanish = 'your_spanish_word';

-- Example:
UPDATE quiz SET english = 'cat' WHERE spanish = 'gato';
UPDATE quiz SET english = 'dog' WHERE spanish = 'perro';
```

Or you can bulk import from a CSV:
1. Prepare CSV with columns: `spanish, english`
2. In Supabase, go to Table Editor → quiz
3. Click "..." → Import data from CSV
4. Match columns and import

## Code Changes Made

I've updated `VocalQuizComponent` to:
- ✅ Show Spanish word as fallback if translation is missing
- ✅ Display helpful warning message
- ✅ Log to console what's happening
- ✅ Still work even with incomplete data

But for the **best user experience**, populate the English column in your quiz table!

## Expected Console Output

After the fix, you should see in browser console:

```
🔄 Using available word as target: casa
⚠️ Quiz table missing translations! Only Spanish words are populated.
```

Or after adding translations:
```
🔍 getCurrentWord DEBUG: {
  targetWord: "casa",
  motherWord: "house",  ✅ Has translation!
  ...
}
```

---

**Action Required:** Run `populate-quiz-translations.sql` in Supabase SQL Editor now!

