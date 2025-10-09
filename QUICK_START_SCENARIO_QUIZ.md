# 🚀 Quick Start: Scenario Quiz System

## ⚡ Immediate Next Steps

### 1. Create Quiz Table in Supabase (5 minutes)

```sql
-- Run this in Supabase SQL Editor
CREATE TABLE quiz (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  spanish TEXT,
  english TEXT,
  russian TEXT,
  french TEXT,
  german TEXT,
  italian TEXT,
  portuguese TEXT,
  arabic TEXT,
  chinese TEXT,
  japanese TEXT,
  turkish TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add some initial test data
INSERT INTO quiz (spanish, english, russian) VALUES
  ('hola', 'hello', 'привет'),
  ('casa', 'house', 'дом'),
  ('comer', 'eat', 'есть'),
  ('agua', 'water', 'вода'),
  ('tiempo', 'time', 'время'),
  ('día', 'day', 'день'),
  ('noche', 'night', 'ночь'),
  ('mucho', 'much', 'много'),
  ('poco', 'little', 'мало'),
  ('bueno', 'good', 'хороший');
```

### 2. Enable Public Read Access

```sql
-- Allow anyone to read from quiz table
CREATE POLICY "Public read access for quiz"
  ON quiz
  FOR SELECT
  TO public
  USING (true);

-- Enable RLS
ALTER TABLE quiz ENABLE ROW LEVEL SECURITY;
```

### 3. Verify Setup

```bash
# Run from your project root
node setup-quiz-table.js
```

**Expected output:**
```
✅ Quiz table exists with 10 rows
📊 Sample data from quiz table:
  Spanish: hola (hello)
  Spanish: casa (house)
  ...
✅ Found 3 matches in quiz table
```

### 4. Test Locally

```bash
# Start dev server
npm run dev

# In browser:
# 1. Login
# 2. Select a scenario
# 3. Complete first dialogue
# 4. Click quiz button
# 5. Check console for:
#    📚 Fetching scenario quiz words from common words table
#    ✅ Found X quiz words for scenario
```

### 5. Check Progress Saving

After completing quiz:

**Console should show:**
```
🔄 Updating scenario progress: {...}
✅ Scenario progress updated successfully: {...}
```

**Supabase dashboard:**
1. Open `language_levels` table
2. Find your user row
3. Check columns:
   - `scenario_dialogue_progress` should be = 1
   - `scenario_progress` should be = 1

### 6. Deploy to Netlify

1. **Set environment variables:**
   - Go to: Site Settings → Environment Variables
   - Add: `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_1xJsmAztvoDl8Qgz1B9mFg_g_qWGYrT`
   - Add: `VITE_SUPABASE_URL` = `https://fjvltffpcafcbbpwzyml.supabase.co`

2. **Redeploy:**
   - Deploys → Trigger deploy → Clear cache and deploy site

3. **Verify:**
   - Check console: `✅ Using new publishable key format`
   - Test login
   - Test scenario quiz

## 🎯 Quick Test Checklist

- [ ] Quiz table created in Supabase
- [ ] RLS policy added
- [ ] Test data inserted (at least 10 rows)
- [ ] `setup-quiz-table.js` runs successfully
- [ ] Local dev server starts
- [ ] Can complete scenario dialogue
- [ ] Quiz shows after dialogue
- [ ] Console shows `✅ Found X quiz words`
- [ ] Progress saves (check console for ✅)
- [ ] Next dialogue unlocks
- [ ] Netlify env vars set
- [ ] Production site works

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `quiz table not found` | Create table in Supabase SQL Editor |
| `No quiz words matched` | Insert more common Spanish words |
| `setup-quiz-table.js error` | Check `.env` has correct Supabase keys |
| `Progress not saving` | Check console for ❌ error messages |
| `401 Unauthorized` | Verify publishable key in Netlify |

## 📞 Need Help?

Check these files for detailed info:
- `SCENARIO_QUIZ_FEATURE.md` - Complete feature docs
- `IMPLEMENTATION_SUMMARY_SCENARIO_QUIZ.md` - What was built
- `NETLIFY_DEPLOYMENT_CHECKLIST.md` - Deployment guide
- `setup-quiz-table.js` - Table verification script

## 💡 Pro Tips

1. **Start with 100+ common words** in quiz table for best results
2. **Test with diverse dialogues** to see 0, 1-4, and 5 word scenarios
3. **Check console logs** - they're detailed and helpful
4. **Use Supabase Table Editor** to manually verify progress
5. **Clear browser cache** if changes don't appear

## 🎨 Expected User Flow

```
Complete Scenario Dialogue 1
  ↓
Quiz with 3-5 words (or auto-complete)
  ↓
Get 60%+ correct
  ↓
See "Excellent! You scored X%!"
  ↓
Dialogue 2 is now unlocked ✅
```

---

**Ready?** Start with step 1 above! 🚀

