/**
 * Mission definitions for language learning scenarios
 * Each scenario has 5 missions with specific goals
 * Total: 30 scenarios × 5 missions = 150 missions
 */

export interface Mission {
  id: number;
  scenarioNumber: number;
  missionNumber: number; // 1-5 within the scenario
  goal: string; // The mission goal in English
  npcRole: string; // Role of the NPC for this mission
}

/**
 * All 150 missions organized by scenario
 */
export const MISSIONS: Record<number, Mission[]> = {
  1: [ // Social greetings & introductions
    { id: 1, scenarioNumber: 1, missionNumber: 1, goal: "Find out the person's full name", npcRole: "a friendly person you just met" },
    { id: 2, scenarioNumber: 1, missionNumber: 2, goal: "Find out where the person is from", npcRole: "a friendly person you just met" },
    { id: 3, scenarioNumber: 1, missionNumber: 3, goal: "Find out what the person does (job/study)", npcRole: "a friendly person you just met" },
    { id: 4, scenarioNumber: 1, missionNumber: 4, goal: "Find out one thing they like to do", npcRole: "a friendly person you just met" },
    { id: 5, scenarioNumber: 1, missionNumber: 5, goal: "Get the person's phone number", npcRole: "a friendly person you just met" }
  ],
  2: [ // Casual conversations with friends
    { id: 6, scenarioNumber: 2, missionNumber: 1, goal: "Find out what your friend did yesterday", npcRole: "your friend" },
    { id: 7, scenarioNumber: 2, missionNumber: 2, goal: "Find out your friend's favorite food", npcRole: "your friend" },
    { id: 8, scenarioNumber: 2, missionNumber: 3, goal: "Find out if your friend is free this weekend", npcRole: "your friend" },
    { id: 9, scenarioNumber: 2, missionNumber: 4, goal: "Find out your friend's favorite movie or series", npcRole: "your friend" },
    { id: 10, scenarioNumber: 2, missionNumber: 5, goal: "Get your friend to agree to meet tomorrow", npcRole: "your friend" }
  ],
  3: [ // Family gatherings & discussions
    { id: 11, scenarioNumber: 3, missionNumber: 1, goal: "Tell your mom about your day", npcRole: "your mom" },
    { id: 12, scenarioNumber: 3, missionNumber: 2, goal: "Find out what your brother/sister wants to eat", npcRole: "your sibling" },
    { id: 13, scenarioNumber: 3, missionNumber: 3, goal: "Ask grandma how she makes her special dish", npcRole: "your grandma" },
    { id: 14, scenarioNumber: 3, missionNumber: 4, goal: "Find out when the family is meeting next", npcRole: "your family member" },
    { id: 15, scenarioNumber: 3, missionNumber: 5, goal: "Get your dad to watch a movie with you tonight", npcRole: "your dad" }
  ],
  4: [ // Dating & romantic interactions
    { id: 16, scenarioNumber: 4, missionNumber: 1, goal: "Find out if the person is single", npcRole: "someone you're interested in" },
    { id: 17, scenarioNumber: 4, missionNumber: 2, goal: "Find out the person's favorite café", npcRole: "someone you're interested in" },
    { id: 18, scenarioNumber: 4, missionNumber: 3, goal: "Get the person to go for coffee this week", npcRole: "someone you're interested in" },
    { id: 19, scenarioNumber: 4, missionNumber: 4, goal: "Find out what kind of music they like", npcRole: "someone you're interested in" },
    { id: 20, scenarioNumber: 4, missionNumber: 5, goal: "Get the person's phone number", npcRole: "someone you're interested in" }
  ],
  5: [ // Professional networking & meetings
    { id: 21, scenarioNumber: 5, missionNumber: 1, goal: "Find out what the person's job is", npcRole: "a professional contact" },
    { id: 22, scenarioNumber: 5, missionNumber: 2, goal: "Find out which company they work for", npcRole: "a professional contact" },
    { id: 23, scenarioNumber: 5, missionNumber: 3, goal: "Find out one thing you have in common", npcRole: "a professional contact" },
    { id: 24, scenarioNumber: 5, missionNumber: 4, goal: "Get their LinkedIn or email", npcRole: "a professional contact" },
    { id: 25, scenarioNumber: 5, missionNumber: 5, goal: "Get them to agree to have coffee soon", npcRole: "a professional contact" }
  ],
  6: [ // Job interviews & career advice
    { id: 26, scenarioNumber: 6, missionNumber: 1, goal: "Tell the interviewer why you want the job", npcRole: "an interviewer" },
    { id: 27, scenarioNumber: 6, missionNumber: 2, goal: "Describe your best skill with an example", npcRole: "an interviewer" },
    { id: 28, scenarioNumber: 6, missionNumber: 3, goal: "Ask about the salary", npcRole: "an interviewer" },
    { id: 29, scenarioNumber: 6, missionNumber: 4, goal: "Ask when they will decide", npcRole: "an interviewer" },
    { id: 30, scenarioNumber: 6, missionNumber: 5, goal: "Get them to say you are a strong candidate", npcRole: "an interviewer" }
  ],
  7: [ // Workplace collaborations & feedback
    { id: 31, scenarioNumber: 7, missionNumber: 1, goal: "Ask your colleague to help you with something", npcRole: "your colleague" },
    { id: 32, scenarioNumber: 7, missionNumber: 2, goal: "Offer to help your colleague", npcRole: "your colleague" },
    { id: 33, scenarioNumber: 7, missionNumber: 3, goal: "Ask your boss for feedback", npcRole: "your boss" },
    { id: 34, scenarioNumber: 7, missionNumber: 4, goal: "Ask for one day off next week", npcRole: "your boss" },
    { id: 35, scenarioNumber: 7, missionNumber: 5, goal: "Get your teammate to agree with your idea", npcRole: "your teammate" }
  ],
  8: [ // Academic discussions & lectures
    { id: 36, scenarioNumber: 8, missionNumber: 1, goal: "Ask the teacher to explain something again", npcRole: "your teacher" },
    { id: 37, scenarioNumber: 8, missionNumber: 2, goal: "Ask when the next exam is", npcRole: "your teacher" },
    { id: 38, scenarioNumber: 8, missionNumber: 3, goal: "Ask a classmate for the homework", npcRole: "your classmate" },
    { id: 39, scenarioNumber: 8, missionNumber: 4, goal: "Ask the teacher for more time on a project", npcRole: "your teacher" },
    { id: 40, scenarioNumber: 8, missionNumber: 5, goal: "Tell the teacher you liked the lesson", npcRole: "your teacher" }
  ],
  9: [ // Everyday shopping & transactions
    { id: 41, scenarioNumber: 9, missionNumber: 1, goal: "Find out the price of something you want to buy", npcRole: "a shop assistant" },
    { id: 42, scenarioNumber: 9, missionNumber: 2, goal: "Ask if they have it in a different color/size", npcRole: "a shop assistant" },
    { id: 43, scenarioNumber: 9, missionNumber: 3, goal: "Get a small discount", npcRole: "a shop assistant" },
    { id: 44, scenarioNumber: 9, missionNumber: 4, goal: "Return something you bought yesterday", npcRole: "a shop assistant" },
    { id: 45, scenarioNumber: 9, missionNumber: 5, goal: "Buy two things and pay", npcRole: "a shop assistant" }
  ],
  10: [ // Dining out & restaurant interactions
    { id: 46, scenarioNumber: 10, missionNumber: 1, goal: "Order food and a drink", npcRole: "a waiter" },
    { id: 47, scenarioNumber: 10, missionNumber: 2, goal: "Ask if something has nuts or meat", npcRole: "a waiter" },
    { id: 48, scenarioNumber: 10, missionNumber: 3, goal: "Ask for the waiter's recommendation", npcRole: "a waiter" },
    { id: 49, scenarioNumber: 10, missionNumber: 4, goal: "Complain about something (cold food/slow service)", npcRole: "a waiter" },
    { id: 50, scenarioNumber: 10, missionNumber: 5, goal: "Ask for the bill and pay", npcRole: "a waiter" }
  ],
  11: [ // Travel planning & bookings
    { id: 51, scenarioNumber: 11, missionNumber: 1, goal: "Book a train or bus ticket", npcRole: "a ticket agent" },
    { id: 52, scenarioNumber: 11, missionNumber: 2, goal: "Find out the price of a flight", npcRole: "a travel agent" },
    { id: 53, scenarioNumber: 11, missionNumber: 3, goal: "Change a booking to a different day", npcRole: "a booking agent" },
    { id: 54, scenarioNumber: 11, missionNumber: 4, goal: "Ask for a window or aisle seat", npcRole: "a ticket agent" },
    { id: 55, scenarioNumber: 11, missionNumber: 5, goal: "Cancel a ticket", npcRole: "a booking agent" }
  ],
  12: [ // Airport & transportation logistics
    { id: 56, scenarioNumber: 12, missionNumber: 1, goal: "Check in for your flight", npcRole: "an airline staff member" },
    { id: 57, scenarioNumber: 12, missionNumber: 2, goal: "Find out the gate number", npcRole: "an airport staff member" },
    { id: 58, scenarioNumber: 12, missionNumber: 3, goal: "Ask why the flight is delayed", npcRole: "an airline staff member" },
    { id: 59, scenarioNumber: 12, missionNumber: 4, goal: "Report a lost bag", npcRole: "a baggage staff member" },
    { id: 60, scenarioNumber: 12, missionNumber: 5, goal: "Ask for a meal voucher", npcRole: "an airline staff member" }
  ],
  13: [ // Asking for & giving directions
    { id: 61, scenarioNumber: 13, missionNumber: 1, goal: "Ask how to get to the train station", npcRole: "a local person" },
    { id: 62, scenarioNumber: 13, missionNumber: 2, goal: "Ask how to get to a bank or pharmacy", npcRole: "a local person" },
    { id: 63, scenarioNumber: 13, missionNumber: 3, goal: "Ask if something is close/far", npcRole: "a local person" },
    { id: 64, scenarioNumber: 13, missionNumber: 4, goal: "Ask where the bathroom is", npcRole: "a staff member" },
    { id: 65, scenarioNumber: 13, missionNumber: 5, goal: "Ask how to get to the city center", npcRole: "a local person" }
  ],
  14: [ // Hotel & accommodation arrangements
    { id: 66, scenarioNumber: 14, missionNumber: 1, goal: "Check in to the hotel", npcRole: "a hotel receptionist" },
    { id: 67, scenarioNumber: 14, missionNumber: 2, goal: "Ask for a quiet or better room", npcRole: "a hotel receptionist" },
    { id: 68, scenarioNumber: 14, missionNumber: 3, goal: "Complain about something in the room", npcRole: "hotel staff" },
    { id: 69, scenarioNumber: 14, missionNumber: 4, goal: "Ask for late check-out", npcRole: "a hotel receptionist" },
    { id: 70, scenarioNumber: 14, missionNumber: 5, goal: "Check out and pay", npcRole: "a hotel receptionist" }
  ],
  15: [ // Medical consultations & health advice
    { id: 71, scenarioNumber: 15, missionNumber: 1, goal: "Describe your symptoms to the doctor", npcRole: "a doctor" },
    { id: 72, scenarioNumber: 15, missionNumber: 2, goal: "Ask if you need medicine", npcRole: "a doctor" },
    { id: 73, scenarioNumber: 15, missionNumber: 3, goal: "Ask for a sick note", npcRole: "a doctor" },
    { id: 74, scenarioNumber: 15, missionNumber: 4, goal: "Tell the doctor about an allergy", npcRole: "a doctor" },
    { id: 75, scenarioNumber: 15, missionNumber: 5, goal: "Ask how long you will be sick", npcRole: "a doctor" }
  ],
  16: [ // Emergency situations & help requests
    { id: 76, scenarioNumber: 16, missionNumber: 1, goal: "Say you lost your wallet/passport", npcRole: "a police officer or staff member" },
    { id: 77, scenarioNumber: 16, missionNumber: 2, goal: "Ask someone to call the police/ambulance", npcRole: "a helpful person nearby" },
    { id: 78, scenarioNumber: 16, missionNumber: 3, goal: "Say your phone was stolen", npcRole: "a police officer" },
    { id: 79, scenarioNumber: 16, missionNumber: 4, goal: "Say you feel very bad and need a doctor", npcRole: "a helpful person nearby" },
    { id: 80, scenarioNumber: 16, missionNumber: 5, goal: "Ask for help finding the hospital", npcRole: "a local person" }
  ],
  17: [ // Banking & financial discussions
    { id: 81, scenarioNumber: 17, missionNumber: 1, goal: "Open a new bank account", npcRole: "a bank teller" },
    { id: 82, scenarioNumber: 17, missionNumber: 2, goal: "Withdraw money", npcRole: "a bank teller" },
    { id: 83, scenarioNumber: 17, missionNumber: 3, goal: "Ask why your card doesn't work", npcRole: "a bank teller" },
    { id: 84, scenarioNumber: 17, missionNumber: 4, goal: "Change dollars/euros", npcRole: "a bank teller" },
    { id: 85, scenarioNumber: 17, missionNumber: 5, goal: "Ask for a new card", npcRole: "a bank teller" }
  ],
  18: [ // Legal consultations & advice
    { id: 86, scenarioNumber: 18, missionNumber: 1, goal: "Explain your problem to the lawyer", npcRole: "a lawyer" },
    { id: 87, scenarioNumber: 18, missionNumber: 2, goal: "Ask how much it costs", npcRole: "a lawyer" },
    { id: 88, scenarioNumber: 18, missionNumber: 3, goal: "Ask what documents you need", npcRole: "a lawyer" },
    { id: 89, scenarioNumber: 18, missionNumber: 4, goal: "Make an appointment", npcRole: "a lawyer's receptionist" },
    { id: 90, scenarioNumber: 18, missionNumber: 5, goal: "Ask how long it will take", npcRole: "a lawyer" }
  ],
  19: [ // Community events & volunteering
    { id: 91, scenarioNumber: 19, missionNumber: 1, goal: "Ask how to volunteer", npcRole: "a community organizer" },
    { id: 92, scenarioNumber: 19, missionNumber: 2, goal: "Find out the next event date", npcRole: "a community organizer" },
    { id: 93, scenarioNumber: 19, missionNumber: 3, goal: "Sign up to help", npcRole: "a volunteer coordinator" },
    { id: 94, scenarioNumber: 19, missionNumber: 4, goal: "Ask what you will do", npcRole: "a volunteer coordinator" },
    { id: 95, scenarioNumber: 19, missionNumber: 5, goal: "Invite the person to volunteer together", npcRole: "a friend or acquaintance" }
  ],
  20: [ // Sports & fitness activities
    { id: 96, scenarioNumber: 20, missionNumber: 1, goal: "Book a class or court", npcRole: "a gym receptionist" },
    { id: 97, scenarioNumber: 20, missionNumber: 2, goal: "Ask about prices or schedule", npcRole: "a gym staff member" },
    { id: 98, scenarioNumber: 20, missionNumber: 3, goal: "Invite the person to play sport", npcRole: "a friend" },
    { id: 99, scenarioNumber: 20, missionNumber: 4, goal: "Ask for beginner tips", npcRole: "a trainer or coach" },
    { id: 100, scenarioNumber: 20, missionNumber: 5, goal: "Join a gym", npcRole: "a gym manager" }
  ],
  21: [ // Hobbies & leisure pursuits
    { id: 101, scenarioNumber: 21, missionNumber: 1, goal: "Find out the person's favorite hobby", npcRole: "a new acquaintance" },
    { id: 102, scenarioNumber: 21, missionNumber: 2, goal: "Tell them about your hobby", npcRole: "a new acquaintance" },
    { id: 103, scenarioNumber: 21, missionNumber: 3, goal: "Invite them to do something together", npcRole: "a new acquaintance" },
    { id: 104, scenarioNumber: 21, missionNumber: 4, goal: "Ask if they play an instrument", npcRole: "a new acquaintance" },
    { id: 105, scenarioNumber: 21, missionNumber: 5, goal: "Ask them to show/teach you something", npcRole: "a hobbyist" }
  ],
  22: [ // Cultural events & arts appreciation
    { id: 106, scenarioNumber: 22, missionNumber: 1, goal: "Buy a ticket to an event", npcRole: "a ticket seller" },
    { id: 107, scenarioNumber: 22, missionNumber: 2, goal: "Ask about discounts", npcRole: "a ticket seller" },
    { id: 108, scenarioNumber: 22, missionNumber: 3, goal: "Find out start time", npcRole: "a staff member" },
    { id: 109, scenarioNumber: 22, missionNumber: 4, goal: "Ask the person's opinion about art/music", npcRole: "a fellow attendee" },
    { id: 110, scenarioNumber: 22, missionNumber: 5, goal: "Invite them to a museum/concert", npcRole: "a friend" }
  ],
  23: [ // Media & entertainment reviews
    { id: 111, scenarioNumber: 23, missionNumber: 1, goal: "Recommend a movie/series", npcRole: "a friend" },
    { id: 112, scenarioNumber: 23, missionNumber: 2, goal: "Ask their favorite show", npcRole: "a friend" },
    { id: 113, scenarioNumber: 23, missionNumber: 3, goal: "Convince them to watch something", npcRole: "a friend" },
    { id: 114, scenarioNumber: 23, missionNumber: 4, goal: "Find out if they like a genre", npcRole: "a friend" },
    { id: 115, scenarioNumber: 23, missionNumber: 5, goal: "Say why you liked/disliked something", npcRole: "a friend" }
  ],
  24: [ // News & current events debates
    { id: 116, scenarioNumber: 24, missionNumber: 1, goal: "Tell today's big news", npcRole: "a friend" },
    { id: 117, scenarioNumber: 24, missionNumber: 2, goal: "Ask their opinion", npcRole: "a friend" },
    { id: 118, scenarioNumber: 24, missionNumber: 3, goal: "Find out where they read news", npcRole: "a friend" },
    { id: 119, scenarioNumber: 24, missionNumber: 4, goal: "Share one good news story", npcRole: "a friend" },
    { id: 120, scenarioNumber: 24, missionNumber: 5, goal: "Agree or politely disagree", npcRole: "a friend" }
  ],
  25: [ // Politics & social issues discussions
    { id: 121, scenarioNumber: 25, missionNumber: 1, goal: "Ask who they voted for", npcRole: "a friend or acquaintance" },
    { id: 122, scenarioNumber: 25, missionNumber: 2, goal: "Ask their opinion on one topic", npcRole: "a friend" },
    { id: 123, scenarioNumber: 25, missionNumber: 3, goal: "Say one thing you want to change", npcRole: "a friend" },
    { id: 124, scenarioNumber: 25, missionNumber: 4, goal: "Ask why they think that", npcRole: "a friend" },
    { id: 125, scenarioNumber: 25, missionNumber: 5, goal: "Find out their view on climate change", npcRole: "a friend" }
  ],
  26: [ // Environmental & sustainability talks
    { id: 126, scenarioNumber: 26, missionNumber: 1, goal: "Ask how they help the environment", npcRole: "an environmentally conscious person" },
    { id: 127, scenarioNumber: 26, missionNumber: 2, goal: "Convince them to use less plastic", npcRole: "a friend" },
    { id: 128, scenarioNumber: 26, missionNumber: 3, goal: "Share three easy green tips", npcRole: "a friend" },
    { id: 129, scenarioNumber: 26, missionNumber: 4, goal: "Ask if they recycle", npcRole: "a neighbor" },
    { id: 130, scenarioNumber: 26, missionNumber: 5, goal: "Invite them to a clean-up", npcRole: "a friend" }
  ],
  27: [ // Technology & gadget troubleshooting
    { id: 131, scenarioNumber: 27, missionNumber: 1, goal: "Explain your phone problem", npcRole: "a tech support person" },
    { id: 132, scenarioNumber: 27, missionNumber: 2, goal: "Ask how to fix Wi-Fi", npcRole: "a tech support person" },
    { id: 133, scenarioNumber: 27, missionNumber: 3, goal: "Complain your device is slow", npcRole: "a tech support person" },
    { id: 134, scenarioNumber: 27, missionNumber: 4, goal: "Ask for the price of a new one", npcRole: "a store assistant" },
    { id: 135, scenarioNumber: 27, missionNumber: 5, goal: "Get free repair or accessory", npcRole: "a tech support person" }
  ],
  28: [ // Customer service & complaints
    { id: 136, scenarioNumber: 28, missionNumber: 1, goal: "Complain about late delivery", npcRole: "a customer service representative" },
    { id: 137, scenarioNumber: 28, missionNumber: 2, goal: "Return something online", npcRole: "a customer service representative" },
    { id: 138, scenarioNumber: 28, missionNumber: 3, goal: "Cancel a subscription", npcRole: "a customer service representative" },
    { id: 139, scenarioNumber: 28, missionNumber: 4, goal: "Complain about bad internet", npcRole: "an ISP support person" },
    { id: 140, scenarioNumber: 28, missionNumber: 5, goal: "Ask for money back or compensation", npcRole: "a customer service manager" }
  ],
  29: [ // Negotiations & bargaining
    { id: 141, scenarioNumber: 29, missionNumber: 1, goal: "Get 20–30% off something", npcRole: "a seller" },
    { id: 142, scenarioNumber: 29, missionNumber: 2, goal: "Buy and get a free gift", npcRole: "a seller" },
    { id: 143, scenarioNumber: 29, missionNumber: 3, goal: "Sell your old phone", npcRole: "a buyer or shop" },
    { id: 144, scenarioNumber: 29, missionNumber: 4, goal: "Get free delivery", npcRole: "a seller" },
    { id: 145, scenarioNumber: 29, missionNumber: 5, goal: "Negotiate a lower price on furniture", npcRole: "a furniture seller" }
  ],
  30: [ // Farewells & reflective conversations
    { id: 146, scenarioNumber: 30, missionNumber: 1, goal: "Find out where your friend is moving", npcRole: "a friend who's moving away" },
    { id: 147, scenarioNumber: 30, missionNumber: 2, goal: "Get them to promise to stay in touch", npcRole: "a friend who's moving away" },
    { id: 148, scenarioNumber: 30, missionNumber: 3, goal: "Invite them to visit you later", npcRole: "a friend who's moving away" },
    { id: 149, scenarioNumber: 30, missionNumber: 4, goal: "Find out what they will miss", npcRole: "a friend who's moving away" },
    { id: 150, scenarioNumber: 30, missionNumber: 5, goal: "Say a proper goodbye", npcRole: "a friend who's moving away" }
  ]
};

/**
 * Get missions for a specific scenario
 */
export const getMissionsForScenario = (scenarioNumber: number): Mission[] => {
  return MISSIONS[scenarioNumber] || [];
};

/**
 * Get a specific mission by ID
 */
export const getMissionById = (missionId: number): Mission | undefined => {
  for (const missions of Object.values(MISSIONS)) {
    const mission = missions.find(m => m.id === missionId);
    if (mission) return mission;
  }
  return undefined;
};

/**
 * Get total number of missions
 */
export const getTotalMissions = (): number => {
  return Object.values(MISSIONS).reduce((total, missions) => total + missions.length, 0);
};

/**
 * Constants
 */
export const MISSIONS_PER_SCENARIO = 5;
export const TOTAL_SCENARIOS = 30;

