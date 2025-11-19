# NPC Character System Implementation

## Overview
Centralized character management system with 30 unique NPCs, each with consistent name, role, and gender across all 5 missions in their scenario.

## What Was Implemented

### 1. New Character Constants File
**File**: `src/constants/characters.ts`

Created a centralized database of all 30 NPCs with:
- **Name**: Unique name for each character
- **Role**: Job/role that matches their scenario theme
- **Gender**: Male or female (consistent across all 5 missions)
- **Scenario Number**: Which of the 30 scenarios (1-30) they're associated with

### 2. Character List (All 30 NPCs)

| ID | Name | Role | Gender | Scenario |
|----|------|------|--------|----------|
| 1 | Alex | Friendly Local | Male | Social greetings & introductions |
| 2 | Maya | Friend | Female | Casual conversations |
| 3 | Jamie | Family Member | Male | Family gatherings |
| 4 | Sophie | Someone Special | Female | Dating & romantic |
| 5 | Marcus | Business Professional | Male | Professional networking |
| 6 | Diana | HR Manager | Female | Job interviews |
| 7 | Chris | Colleague | Male | Workplace collaborations |
| 8 | Professor Lee | Teacher | Female | Academic discussions |
| 9 | Noah | Shop Assistant | Male | Shopping & transactions |
| 10 | Emma | Server | Female | Dining out |
| 11 | Ryan | Travel Agent | Male | Travel planning |
| 12 | Olivia | Airport Staff | Female | Airport & transportation |
| 13 | Tom | Helpful Local | Male | Directions |
| 14 | Isabella | Hotel Receptionist | Female | Hotel arrangements |
| 15 | Dr. Chen | Doctor | Male | Medical consultations |
| 16 | Officer Sarah | Police Officer | Female | Emergency situations |
| 17 | James | Bank Teller | Male | Banking & financial |
| 18 | Attorney Rodriguez | Lawyer | Female | Legal consultations |
| 19 | Kevin | Community Organizer | Male | Community events |
| 20 | Zoe | Fitness Trainer | Female | Sports & fitness |
| 21 | Lucas | Hobbyist | Male | Hobbies & leisure |
| 22 | Mia | Box Office Clerk | Female | Cultural events |
| 23 | Tyler | Friend | Male | Media & entertainment |
| 24 | Rachel | Friend | Female | News & current events |
| 25 | Jordan | Friend | Male | Politics & social issues |
| 26 | Lily | Environmental Activist | Female | Environmental talks |
| 27 | Eric | Tech Support | Male | Technology troubleshooting |
| 28 | Nina | Customer Service Rep | Female | Customer service |
| 29 | Victor | Merchant | Male | Negotiations & bargaining |
| 30 | Ava | Friend Moving Away | Female | Farewells |

### 3. Updated Files

#### A. `src/constants/characters.ts` (NEW)
- Exports `NPC_CHARACTERS` object with all character data
- Helper functions:
  - `getCharacterById(id)` - Get character by ID
  - `getCharacterByScenario(scenarioNumber)` - Get character by scenario
  - `getAllCharacters()` - Get all characters as array

#### B. `src/scenes/City.tsx` (UPDATED)
- Imports `NPC_CHARACTERS` from characters constants
- Updated all 30 character setups to use centralized names and roles
- Position and scale data preserved from original setup
- Example:
  ```typescript
  setCharacter({
    id: 1,
    name: NPC_CHARACTERS[1].name,  // "Alex"
    role: NPC_CHARACTERS[1].role,  // "Friendly Local"
    position_x: 53,
    // ... other positioning data
  });
  ```

#### C. `src/services/missionNPC.ts` (UPDATED)
- Updated `MissionNPCParams` interface to include:
  - `npcName: string` - Character's name
  - `npcGender: 'male' | 'female'` - Character's gender
- Updated AI prompt to include:
  - Character name
  - Character gender
  - Character role
- This ensures the AI voice and behavior matches the character's gender

#### D. `src/components/DialogueBox.tsx` (UPDATED)
- Imports `getCharacterByScenario` from characters constants
- Updated `generateNPCResponse` call to:
  1. Look up character data using mission's scenario number
  2. Pass character name and gender to the AI service
  ```typescript
  const character = getCharacterByScenario(mission!.scenarioNumber);
  
  const npcResponse = await generateNPCResponse({
    // ... other params
    npcName: character?.name || 'NPC',
    npcGender: character?.gender || 'male',
  });
  ```

### 4. Key Features

#### Gender Consistency
- Each character maintains the same gender across all 5 missions in their scenario
- AI is informed of the character's gender to match voice and personality

#### Role Alignment
- Each character's role matches their scenario theme
- Example: Scenario 9 (Shopping) uses Noah, a Shop Assistant
- Example: Scenario 15 (Medical) uses Dr. Chen, a Doctor

#### Centralized Management
- All character data in one file: `src/constants/characters.ts`
- Easy to update names, roles, or genders without touching multiple files
- Type-safe with TypeScript interfaces

#### Diverse Names
- Mix of traditional and modern names
- Culturally diverse: Alex, Maya, Chen, Rodriguez, etc.
- Professional titles where appropriate: Dr., Officer, Professor, Attorney

### 5. Gender Distribution

**15 Male Characters**: Alex, Jamie, Marcus, Chris, Noah, Ryan, Tom, Dr. Chen, James, Kevin, Lucas, Tyler, Jordan, Eric, Victor

**15 Female Characters**: Maya, Sophie, Diana, Professor Lee, Emma, Olivia, Isabella, Officer Sarah, Attorney Rodriguez, Zoe, Mia, Rachel, Lily, Nina, Ava

Perfect 50/50 balance between male and female characters.

### 6. How It Works

1. **User selects a mission** → Mission knows its scenario number
2. **System looks up character** → Uses `getCharacterByScenario(scenarioNumber)`
3. **Character data retrieved** → Name, role, gender
4. **AI receives full context** → Generates responses matching character's gender and role
5. **Voice synthesis** → Can use gender-appropriate voice settings

### 7. Benefits

✅ **No more voice/gender mismatches** - AI knows character gender  
✅ **Consistent character identity** - Same name/gender across all 5 missions  
✅ **Easy maintenance** - All data in one centralized file  
✅ **Type-safe** - TypeScript ensures correct usage  
✅ **Scalable** - Easy to add new characters or modify existing ones  
✅ **Role alignment** - Character roles match scenario themes  

## Files Modified

1. ✅ `src/constants/characters.ts` (NEW)
2. ✅ `src/scenes/City.tsx` (updated character setup)
3. ✅ `src/services/missionNPC.ts` (added name/gender to interface and prompt)
4. ✅ `src/components/DialogueBox.tsx` (passes character data to NPC service)

## Testing Recommendations

1. Test all 30 scenarios to verify character names display correctly
2. Verify AI uses gender-appropriate language in responses
3. Check voice synthesis matches character gender
4. Confirm character consistency across all 5 missions in each scenario

## Future Enhancements

- Add character personality traits
- Add character age ranges
- Add character backstories for richer interactions
- Support for character portraits/avatars
- Voice preference settings per character

