/**
 * Character definitions for all 30 NPCs in the city
 * Each character corresponds to one scenario (with 5 missions each)
 * Characters maintain consistent name, role, and gender across all their missions
 */

export type Gender = 'male' | 'female';

export interface NPCCharacter {
  id: number;
  name: string;
  role: string;
  gender: Gender;
  scenarioNumber: number; // Which scenario (1-30) this character is associated with
}

/**
 * All 30 NPC characters with their names, roles, and genders
 * Each character is the main NPC for their corresponding scenario
 */
export const NPC_CHARACTERS: Record<number, NPCCharacter> = {
  1: {
    id: 1,
    name: 'Alex',
    role: 'Friendly Local',
    gender: 'male',
    scenarioNumber: 1
  },
  2: {
    id: 2,
    name: 'Maya',
    role: 'Friend',
    gender: 'female',
    scenarioNumber: 2
  },
  3: {
    id: 3,
    name: 'Jamie',
    role: 'Family Member',
    gender: 'male',
    scenarioNumber: 3
  },
  4: {
    id: 4,
    name: 'Sophie',
    role: 'Someone Special',
    gender: 'female',
    scenarioNumber: 4
  },
  5: {
    id: 5,
    name: 'Marcus',
    role: 'Business Professional',
    gender: 'male',
    scenarioNumber: 5
  },
  6: {
    id: 6,
    name: 'Diana',
    role: 'HR Manager',
    gender: 'female',
    scenarioNumber: 6
  },
  7: {
    id: 7,
    name: 'Chris',
    role: 'Colleague',
    gender: 'male',
    scenarioNumber: 7
  },
  8: {
    id: 8,
    name: 'Professor Lee',
    role: 'Teacher',
    gender: 'female',
    scenarioNumber: 8
  },
  9: {
    id: 9,
    name: 'Noah',
    role: 'Shop Assistant',
    gender: 'male',
    scenarioNumber: 9
  },
  10: {
    id: 10,
    name: 'Emma',
    role: 'Server',
    gender: 'female',
    scenarioNumber: 10
  },
  11: {
    id: 11,
    name: 'Ryan',
    role: 'Travel Agent',
    gender: 'male',
    scenarioNumber: 11
  },
  12: {
    id: 12,
    name: 'Olivia',
    role: 'Airport Staff',
    gender: 'female',
    scenarioNumber: 12
  },
  13: {
    id: 13,
    name: 'Tom',
    role: 'Helpful Local',
    gender: 'male',
    scenarioNumber: 13
  },
  14: {
    id: 14,
    name: 'Isabella',
    role: 'Hotel Receptionist',
    gender: 'female',
    scenarioNumber: 14
  },
  15: {
    id: 15,
    name: 'Dr. Chen',
    role: 'Doctor',
    gender: 'male',
    scenarioNumber: 15
  },
  16: {
    id: 16,
    name: 'Officer Sarah',
    role: 'Police Officer',
    gender: 'female',
    scenarioNumber: 16
  },
  17: {
    id: 17,
    name: 'James',
    role: 'Bank Teller',
    gender: 'male',
    scenarioNumber: 17
  },
  18: {
    id: 18,
    name: 'Attorney Rodriguez',
    role: 'Lawyer',
    gender: 'female',
    scenarioNumber: 18
  },
  19: {
    id: 19,
    name: 'Kevin',
    role: 'Community Organizer',
    gender: 'male',
    scenarioNumber: 19
  },
  20: {
    id: 20,
    name: 'Zoe',
    role: 'Fitness Trainer',
    gender: 'female',
    scenarioNumber: 20
  },
  21: {
    id: 21,
    name: 'Lucas',
    role: 'Hobbyist',
    gender: 'male',
    scenarioNumber: 21
  },
  22: {
    id: 22,
    name: 'Mia',
    role: 'Box Office Clerk',
    gender: 'female',
    scenarioNumber: 22
  },
  23: {
    id: 23,
    name: 'Tyler',
    role: 'Friend',
    gender: 'male',
    scenarioNumber: 23
  },
  24: {
    id: 24,
    name: 'Rachel',
    role: 'Friend',
    gender: 'female',
    scenarioNumber: 24
  },
  25: {
    id: 25,
    name: 'Jordan',
    role: 'Friend',
    gender: 'male',
    scenarioNumber: 25
  },
  26: {
    id: 26,
    name: 'Lily',
    role: 'Environmental Activist',
    gender: 'female',
    scenarioNumber: 26
  },
  27: {
    id: 27,
    name: 'Eric',
    role: 'Tech Support',
    gender: 'male',
    scenarioNumber: 27
  },
  28: {
    id: 28,
    name: 'Nina',
    role: 'Customer Service Rep',
    gender: 'female',
    scenarioNumber: 28
  },
  29: {
    id: 29,
    name: 'Victor',
    role: 'Merchant',
    gender: 'male',
    scenarioNumber: 29
  },
  30: {
    id: 30,
    name: 'Ava',
    role: 'Friend Moving Away',
    gender: 'female',
    scenarioNumber: 30
  }
};

/**
 * Get character by ID
 */
export const getCharacterById = (id: number): NPCCharacter | undefined => {
  return NPC_CHARACTERS[id];
};

/**
 * Get character by scenario number
 */
export const getCharacterByScenario = (scenarioNumber: number): NPCCharacter | undefined => {
  return NPC_CHARACTERS[scenarioNumber];
};

/**
 * Get all characters as an array
 */
export const getAllCharacters = (): NPCCharacter[] => {
  return Object.values(NPC_CHARACTERS);
};

/**
 * Constants
 */
export const TOTAL_CHARACTERS = 30;

