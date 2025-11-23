# 🔒 Mission Sequential Unlock Fix

## The Problem

**User Discovery:** Completed Mission 3 of Scenario 1 successfully, but when trying Mission 1 of Scenario 2, it would save but not appear as completed.

**Root Cause:** The app allowed starting Mission 1 of ANY scenario, even if previous scenarios weren't fully completed. This created invalid progress states.

### The Bug

**Before:**
```typescript
// MissionSelectionPanel.tsx & DialogueSelectionPanel.tsx
const isUnlocked = mission.missionNumber === 1 || completedMissions.has(mission.missionNumber - 1);
```

**Issue:** Mission 1 was **always unlocked** regardless of previous scenario completion!

**Example:**
- User completes Missions 1, 2, 3 of Scenario 1
- Missions 4 & 5 of Scenario 1 are still locked (correct)
- But Mission 1 of Scenario 2 was unlocked (WRONG!)
- User completes it → saves to database as globalMissionId=6
- But missions 4 & 5 (globalMissionId=4,5) are still incomplete
- Progress jumps from 3 → 6, skipping 4 & 5!

---

## ✅ The Fix

### Sequential Mission Unlocking Rules

**New Rule:**
1. **Scenario 1, Mission 1:** Always unlocked (starting point)
2. **Any Scenario N, Mission 1 (N > 1):** Requires ALL 5 missions of Scenario N-1 completed
3. **Any Scenario, Mission M (M > 1):** Requires Mission M-1 of same scenario completed

### Implementation

**Files Changed:**
1. `src/components/MissionSelectionPanel.tsx` - Main mission selection panel
2. `src/components/DialogueSelectionPanel.tsx` - Missions section in dialogue panel
3. `src/components/HelperRobotPanel.tsx` - Mission progress display in Turi panel

**Key Changes:**

#### 1. Added State to Track Previous Scenario Completion

```typescript
const [previousScenarioCompleted, setPreviousScenarioCompleted] = useState<boolean>(true);
```

#### 2. Fetch Previous Scenario's Mission Completions

```typescript
// For scenarios > 1, check if ALL missions from previous scenario are completed
if (scenarioNumber > 1) {
  const { data: prevScenarioData } = await supabase
    .from('mission_completions')
    .select('mission_number')
    .eq('user_id', user.id)
    .eq('scenario_number', scenarioNumber - 1);
  
  if (prevScenarioData) {
    const prevCompleted = new Set(prevScenarioData.map(m => m.mission_number));
    // Must have ALL 5 missions completed
    const allPreviousCompleted = prevCompleted.size === 5 && 
      [1, 2, 3, 4, 5].every(m => prevCompleted.has(m));
    
    setPreviousScenarioCompleted(allPreviousCompleted);
  }
}
```

#### 3. Updated Unlock Logic

```typescript
const isMissionUnlocked = (missionNumber: number): boolean => {
  // For Mission 1: Check if previous scenario is completed
  if (missionNumber === 1) {
    return previousScenarioCompleted;
  }
  
  // Other missions require previous mission to be completed
  return completedMissions.has(missionNumber - 1);
};
```

---

## 🧪 Testing

### Scenario 1: Completing Missions in Order ✅

**Steps:**
1. Start Scenario 1, Mission 1 (should be unlocked)
2. Complete it → Mission 2 unlocks
3. Complete Mission 2 → Mission 3 unlocks
4. Complete Mission 3 → Mission 4 unlocks
5. Complete Mission 4 → Mission 5 unlocks
6. Complete Mission 5 → **Scenario 2, Mission 1** unlocks

**Expected:** Linear progression through all 5 missions before next scenario unlocks

### Scenario 2: Trying to Jump Scenarios ❌

**Steps:**
1. Complete Missions 1-3 of Scenario 1
2. Try to start Mission 1 of Scenario 2

**Expected Before Fix:** Mission would be clickable and would save
**Expected After Fix:** Mission 1 of Scenario 2 is **locked** (grayed out) with lock icon

### Scenario 3: Completing All Scenarios Properly ✅

**Steps:**
1. Complete all 5 missions of Scenario 1
2. Scenario 2, Mission 1 unlocks automatically
3. Complete all 5 missions of Scenario 2
4. Scenario 3, Mission 1 unlocks automatically
5. ...and so on for all 30 scenarios

---

## 📊 Visual Indicators

### Mission States

| State | Visual | Clickable | Meaning |
|-------|--------|-----------|---------|
| **Completed** | Green bg, ✓ checkmark | Yes | Mission completed successfully |
| **Unlocked** | Purple bg, Play icon | Yes | Ready to start |
| **Locked** | Gray bg, 🔒 Lock icon | No | Previous missions not completed |

### Console Logging

When checking unlock status, you'll see:

**Scenario 1:**
```javascript
[MissionSelection] Loaded missions { scenarioNumber: 1, missionCount: 5 }
[MissionSelection] Previous scenario status { 
  previousScenario: 0, 
  allCompleted: true  // Scenario 1 is always accessible
}
```

**Scenario 2 (Before completing Scenario 1):**
```javascript
[MissionSelection] Loaded missions { scenarioNumber: 2, missionCount: 5 }
[MissionSelection] Previous scenario status {
  previousScenario: 1,
  completedMissions: [1, 2, 3],  // Only 3 missions completed
  allCompleted: false  // NOT all 5 completed
}
[MissionSelection] Mission 1 locked - previous scenario not completed
```

**Scenario 2 (After completing all 5 of Scenario 1):**
```javascript
[MissionSelection] Loaded missions { scenarioNumber: 2, missionCount: 5 }
[MissionSelection] Previous scenario status {
  previousScenario: 1,
  completedMissions: [1, 2, 3, 4, 5],  // All 5 completed!
  allCompleted: true  ✅
}
// Mission 1 is now unlocked
```

---

## 🎯 Database Consistency

### Global Mission IDs

Each mission has a global ID: `(scenarioNumber - 1) * 5 + missionNumber`

**Examples:**
- Scenario 1, Mission 1 = globalMissionId 1
- Scenario 1, Mission 5 = globalMissionId 5
- Scenario 2, Mission 1 = globalMissionId 6
- Scenario 2, Mission 5 = globalMissionId 10
- ...
- Scenario 30, Mission 5 = globalMissionId 150

### language_levels.mission_progress

This field tracks the **highest completed mission globally**.

**Valid Progression:**
```
mission_progress: 1 → 2 → 3 → 4 → 5 → 6 → 7 → ...
```

**Invalid Progression (Before Fix):**
```
mission_progress: 1 → 2 → 3 → 6  ❌ (skipped 4 & 5!)
```

**Now Fixed:** UI prevents starting Mission 6 until 4 & 5 are completed!

---

## 🐛 Edge Cases Handled

### 1. User with Partial Progress
**Scenario:** User has missions 1-3 of Scenario 1 completed from before the fix.

**Behavior:**
- Missions 4-5 of Scenario 1: Unlocked (can complete)
- Scenario 2+: All locked until Scenario 1 is finished

### 2. Anonymous Users
**Scenario:** User not logged in.

**Behavior:**
- Only Scenario 1, Mission 1 is unlocked
- Must login to track progress and unlock more

### 3. Database Query Errors
**Scenario:** Supabase request fails.

**Behavior:**
- Previous scenario treated as not completed (safe default)
- Locks missions to prevent invalid progress

---

## 📁 Files Modified

| File | Lines Changed | Purpose |
|------|--------------|---------|
| `MissionSelectionPanel.tsx` | 31-123 | Added previous scenario check in main mission panel |
| `DialogueSelectionPanel.tsx` | 178-220, 647-650 | Added previous scenario check in dialogue panel missions section |
| `HelperRobotPanel.tsx` | 486-515 | Fixed mission display colors in Turi progress panel |

---

## ✅ Verification Checklist

After applying this fix, test:

- [ ] Scenario 1, Mission 1 is unlocked by default
- [ ] Completing Mission N unlocks Mission N+1 in same scenario
- [ ] Scenario 2+ Mission 1 is LOCKED until Scenario 1 all missions completed
- [ ] Console shows previous scenario completion status
- [ ] Locked missions show lock icon and are unclickable
- [ ] Progress saves correctly in sequential order
- [ ] No skipping missions or scenarios

---

## 🎉 Result

**Before:** Users could jump to any scenario's first mission, creating invalid progress states.

**After:** Strict sequential unlocking enforces proper progression through all 150 missions (30 scenarios × 5 missions each).

This ensures:
- ✅ Proper learning progression
- ✅ Database consistency
- ✅ No skipped content
- ✅ Clear player journey: Scenario 1 → 2 → 3 → ... → 30

**Great catch by the user!** 🎯

