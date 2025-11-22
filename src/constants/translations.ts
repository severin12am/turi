// Import the shared cache at the top to avoid issues
import { translationCache } from '../services/translationCache';

// Support for 30 most popular world languages
export type SupportedLanguage = 
  | 'en' | 'CH' | 'hi' | 'es' | 'fr' | 'ar' | 'bn' | 'pt' | 'ru' | 'id'
  | 'ur' | 'de' | 'ja' | 'sw' | 'te' | 'mr' | 'ta' | 'tr' | 'ko' | 'vi'
  | 'it' | 'th' | 'pl' | 'uk' | 'nl' | 'ro' | 'el' | 'cs' | 'sv' | 'hu';

export interface TranslationStrings {
  // Language selection
  firstQuestion?: string;
  secondQuestion?: string;
  readyQuestion?: string;
  yourLanguage?: string;
  languageToLearn?: string;
  goBack?: string;
  startJourney?: string;
  
  // Helper Robot specific
  whatLanguage?: string;
  whatToLearn?: string;
  ready?: string;
  selectDifferent?: string;
  chooseLanguage?: string;
  chooseLanguageYouSpeak?: string;
  
  // Helper robot instructions
  goToCharacter?: string;
  findNextCharacter?: string;
  levelRestriction?: string;
  dialogueControls?: string;
  quizControls?: string;
  close?: string;
  hint?: string;
  tipTitle?: string;
  
  // Login/Signup
  email?: string;
  password?: string;
  login?: string;
  signup?: string;
  createAccount?: string;
  alreadyHaveAccount?: string;
  dontHaveAccount?: string;
  skip?: string;
  saveProgress?: string;
  welcomeBack?: string;
  createAccountInfo?: string;
  loginInfo?: string;
  accountRequired?: string;
  enterEmail?: string;
  enterPassword?: string;
  logIn?: string;
  needAccount?: string;
  haveAccount?: string;
  skipForNow?: string;
  emailRequired?: string;
  
  // Character names
  characterNames?: Record<number, string>;
  
  // Dialogue selection
  selectDialogue?: string;
  dialogue?: string;
  completed?: string;
  available?: string;
  locked?: string;
  completedText?: string;
  clickToStartText?: string;
  completePreviousText?: string;
  loading?: string;
  error?: string;
  refresh?: string;
  generateAIDialogue?: string;
  
  // AI Dialogue Modal
  generateAIDialogueTitle?: string;
  aboutAIDialogues?: string;
  aiDialogueDescription?: string;
  requiredWords?: string;
  dialogueLength?: string;
  dialogueComplexity?: string;
  dialogueThemePreferences?: string;
  dialogueThemePlaceholder?: string;
  generationFailed?: string;
  aiServiceUpdating?: string;
  cancel?: string;
  generating?: string;
  aiDialogueWarning?: string;
  unknownError?: string;
  
  // Dialogue length descriptions
  lengthShort?: string;
  lengthStandard?: string;
  lengthExtended?: string;
  
  // Complexity descriptions
  complexityBeginner?: string;
  complexityIntermediate?: string;
  complexityAdvanced?: string;
  
  // Word explanation modal
  meaningAndUsage?: string;
  examples?: string;
  otherForms?: string;
  loadingExplanation?: string;
  tryAgainOrSearch?: string;
  aiExplanationWarning?: string;
  
  // Google search
  explanationWithExamples?: string;
  
  // Level labels
  levelSimple?: string;
  levelNormal?: string;
  levelComplex?: string;
  
  // Scenario-related
  scenario?: string;
  scenarioDescription?: string;
  dialoguesCompleted?: string;
  regularDialogues?: string;
  commonWordsInContext?: string;
  
  // Dialogue completion
  completeInHideOrTranslationMode?: string;
  
  // Dictionary
  pleaseSignIn?: string;
  
  // Missions
  missions?: string;
  mission?: string;
  missionDescription?: string;
  talkingTo?: string;
  start?: string;
  back?: string;
  helperRobotChecking?: string;
  waitingForApproval?: string;
  sentenceApproved?: string;
  youSaid?: string;
  helpMe?: string;
  taskCompleted?: string;
  taskCompletedMessage?: string;
  next?: string;
  
  // Scenario names (30 scenarios)
  scenario1?: string;
  scenario2?: string;
  scenario3?: string;
  scenario4?: string;
  scenario5?: string;
  scenario6?: string;
  scenario7?: string;
  scenario8?: string;
  scenario9?: string;
  scenario10?: string;
  scenario11?: string;
  scenario12?: string;
  scenario13?: string;
  scenario14?: string;
  scenario15?: string;
  scenario16?: string;
  scenario17?: string;
  scenario18?: string;
  scenario19?: string;
  scenario20?: string;
  scenario21?: string;
  scenario22?: string;
  scenario23?: string;
  scenario24?: string;
  scenario25?: string;
  scenario26?: string;
  scenario27?: string;
  scenario28?: string;
  scenario29?: string;
  scenario30?: string;
  
  // Mission goals (150 missions organized as mission{scenario}_{number})
  mission1_1?: string;
  mission1_2?: string;
  mission1_3?: string;
  mission1_4?: string;
  mission1_5?: string;
  mission2_1?: string;
  mission2_2?: string;
  mission2_3?: string;
  mission2_4?: string;
  mission2_5?: string;
  mission3_1?: string;
  mission3_2?: string;
  mission3_3?: string;
  mission3_4?: string;
  mission3_5?: string;
  mission4_1?: string;
  mission4_2?: string;
  mission4_3?: string;
  mission4_4?: string;
  mission4_5?: string;
  mission5_1?: string;
  mission5_2?: string;
  mission5_3?: string;
  mission5_4?: string;
  mission5_5?: string;
  mission6_1?: string;
  mission6_2?: string;
  mission6_3?: string;
  mission6_4?: string;
  mission6_5?: string;
  mission7_1?: string;
  mission7_2?: string;
  mission7_3?: string;
  mission7_4?: string;
  mission7_5?: string;
  mission8_1?: string;
  mission8_2?: string;
  mission8_3?: string;
  mission8_4?: string;
  mission8_5?: string;
  mission9_1?: string;
  mission9_2?: string;
  mission9_3?: string;
  mission9_4?: string;
  mission9_5?: string;
  mission10_1?: string;
  mission10_2?: string;
  mission10_3?: string;
  mission10_4?: string;
  mission10_5?: string;
  mission11_1?: string;
  mission11_2?: string;
  mission11_3?: string;
  mission11_4?: string;
  mission11_5?: string;
  mission12_1?: string;
  mission12_2?: string;
  mission12_3?: string;
  mission12_4?: string;
  mission12_5?: string;
  mission13_1?: string;
  mission13_2?: string;
  mission13_3?: string;
  mission13_4?: string;
  mission13_5?: string;
  mission14_1?: string;
  mission14_2?: string;
  mission14_3?: string;
  mission14_4?: string;
  mission14_5?: string;
  mission15_1?: string;
  mission15_2?: string;
  mission15_3?: string;
  mission15_4?: string;
  mission15_5?: string;
  mission16_1?: string;
  mission16_2?: string;
  mission16_3?: string;
  mission16_4?: string;
  mission16_5?: string;
  mission17_1?: string;
  mission17_2?: string;
  mission17_3?: string;
  mission17_4?: string;
  mission17_5?: string;
  mission18_1?: string;
  mission18_2?: string;
  mission18_3?: string;
  mission18_4?: string;
  mission18_5?: string;
  mission19_1?: string;
  mission19_2?: string;
  mission19_3?: string;
  mission19_4?: string;
  mission19_5?: string;
  mission20_1?: string;
  mission20_2?: string;
  mission20_3?: string;
  mission20_4?: string;
  mission20_5?: string;
  mission21_1?: string;
  mission21_2?: string;
  mission21_3?: string;
  mission21_4?: string;
  mission21_5?: string;
  mission22_1?: string;
  mission22_2?: string;
  mission22_3?: string;
  mission22_4?: string;
  mission22_5?: string;
  mission23_1?: string;
  mission23_2?: string;
  mission23_3?: string;
  mission23_4?: string;
  mission23_5?: string;
  mission24_1?: string;
  mission24_2?: string;
  mission24_3?: string;
  mission24_4?: string;
  mission24_5?: string;
  mission25_1?: string;
  mission25_2?: string;
  mission25_3?: string;
  mission25_4?: string;
  mission25_5?: string;
  mission26_1?: string;
  mission26_2?: string;
  mission26_3?: string;
  mission26_4?: string;
  mission26_5?: string;
  mission27_1?: string;
  mission27_2?: string;
  mission27_3?: string;
  mission27_4?: string;
  mission27_5?: string;
  mission28_1?: string;
  mission28_2?: string;
  mission28_3?: string;
  mission28_4?: string;
  mission28_5?: string;
  mission29_1?: string;
  mission29_2?: string;
  mission29_3?: string;
  mission29_4?: string;
  mission29_5?: string;
  mission30_1?: string;
  mission30_2?: string;
  mission30_3?: string;
  mission30_4?: string;
  mission30_5?: string;
}

// English is bundled with the app for fast initial load
// Other languages are loaded from Supabase on demand
export const translations: Record<'en', TranslationStrings> = {
  en: {
    firstQuestion: "Firstly, what language do you already speak?",
    secondQuestion: "Good, now choose language you want to learn:",
    readyQuestion: "Perfect! Ready to begin your language journey?",
    yourLanguage: "Your language",
    languageToLearn: "Language to learn",
    goBack: "Go Back",
    startJourney: "Start my journey",
    
    // Helper Robot specific
    whatLanguage: "Hi! I'm Turi, I will guide you on your language learning journey! Firstly, what language do you already speak?",
    whatToLearn: "Good, now choose language you want to learn",
    ready: "Ready to begin your journey!",
    selectDifferent: "Please select a different language",
    chooseLanguage: "Choose language...",
    chooseLanguageYouSpeak: "Choose your native language",
    
    // Helper robot instructions
    goToCharacter: 'Go towards next character. You can review previous levels by approaching their characters but you can`t skip levels',
    findNextCharacter: 'You finished level {level}! Good job. Now let\'s find {character}',
    levelRestriction: 'This character is for level {level}. Complete previous levels first.',
    dialogueControls: 'Click on the return button to try again or click on the sound button to hear pronunciation. You can click on any word and find info on this word (or select a group of words)',
    quizControls: 'Click "Try Again" to retry this word.',
    close: 'Close',
    hint: 'Hint',
    tipTitle: 'Tip',
    
    // Login/Signup
    email: 'Email',
    password: 'Password',
    login: 'Login',
    signup: 'Sign Up',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: 'Don\'t have an account?',
    skip: 'Skip',
    saveProgress: 'Save Your Progress',
    welcomeBack: 'Welcome Back!',
    createAccountInfo: 'Great job on your first quiz! Create an account to save your progress and continue your language journey.',
    loginInfo: 'Log in to track your learning progress across all devices.',
    accountRequired: 'Note: Creating an account is required to save your progress. Your learning journey will be lost if you continue without an account.',
    enterEmail: 'Enter your email address',
    enterPassword: 'Enter your password',
    logIn: 'Log In',
    needAccount: 'Need an account? Sign up',
    haveAccount: 'Already have an account? Log in',
    skipForNow: 'Skip for now',
    emailRequired: 'Please enter a valid email address',
    
    // Character names
    characterNames: {
      1: 'Tom',
      2: 'Noah',
      3: 'Emma',
      4: 'Olivia',
      5: 'Jack'
    },
    
    // Dialogue selection
    selectDialogue: 'Select a Dialogue',
    dialogue: 'Dialogue',
    completed: 'Completed',
    available: 'Available',
    locked: 'Locked',
    completedText: 'You have completed this dialogue.',
    clickToStartText: 'Click to start this dialogue.',
    completePreviousText: 'Complete the previous dialogue to unlock.',
    loading: 'Loading dialogues...',
    error: 'An error occurred',
    refresh: 'Refresh',
    generateAIDialogue: 'Generate AI Dialogue',
    
    // AI Dialogue Modal
    generateAIDialogueTitle: 'Generate AI Dialogue',
    aboutAIDialogues: 'About AI Dialogues',
    aiDialogueDescription: 'AI-generated dialogues are experimental and may vary in quality. They will include all required vocabulary words for Dialogue',
    requiredWords: 'Required words',
    dialogueLength: 'Dialogue Length',
    dialogueComplexity: 'Dialogue Complexity',
    dialogueThemePreferences: 'Dialogue Theme or Preferences (Optional)',
    dialogueThemePlaceholder: 'e.g., \'Make it about ordering food at a restaurant\' or \'Focus on greetings and introductions\'',
    generationFailed: 'Generation Failed',
    aiServiceUpdating: 'The AI service is being updated. Please try the original dialogue instead.',
    cancel: 'Cancel',
    generating: 'Generating...',
    aiDialogueWarning: 'AI dialogues are not stored permanently and are for practice only.',
    unknownError: 'Unknown error occurred',
    
    // Dialogue length descriptions
    lengthShort: 'Short (2 exchanges)',
    lengthStandard: 'Standard (4 exchanges)',
    lengthExtended: 'Extended (6 exchanges)',
    
    // Complexity descriptions
    complexityBeginner: 'Beginner level',
    complexityIntermediate: 'Intermediate level',
    complexityAdvanced: 'Advanced level',
    
    // Word explanation modal
    meaningAndUsage: 'Meaning & Usage',
    examples: 'Examples',
    otherForms: 'Other Forms',
    loadingExplanation: 'Loading explanation...',
    tryAgainOrSearch: 'Please try again or use the Google search instead.',
    aiExplanationWarning: 'This explanation was generated by AI and may vary in accuracy. Cross-reference with dictionaries for critical usage.',
    
    // Google search
    explanationWithExamples: 'explanation with examples',
    
    // Level labels
    levelSimple: 'Simple',
    levelNormal: 'Normal',
    levelComplex: 'Complex',
    
    // Scenario-related
    scenario: 'Scenario',
    scenarioDescription: 'Practice real-world conversation scenarios',
    dialoguesCompleted: 'dialogues completed',
    regularDialogues: 'Regular Dialogues',
    commonWordsInContext: '500 most common words in context',
    completeInHideOrTranslationMode: 'To prove you\'ve mastered this dialogue, complete in Hide or Translation mode to proceed (click visibility button)',
    pleaseSignIn: 'Please sign in to save words to your dictionary',
    
    // Missions
    missions: 'Missions',
    mission: 'Mission',
    missionDescription: 'Complete specific goals through natural conversation. Turi will guide you!',
    talkingTo: 'Talking to',
    start: 'Start',
    back: 'Back',
    helperRobotChecking: 'Turi is checking...',
    waitingForApproval: 'Waiting for approval',
    sentenceApproved: 'Sentence approved!',
    youSaid: 'You said:',
    helpMe: 'Help me',
    taskCompleted: 'Task completed!',
    taskCompletedMessage: 'Task completed, you\'re one step closer to fluency!',
    next: 'Next',
    
    // Scenario names
    scenario1: 'Social greetings and introductions',
    scenario2: 'Casual conversations with friends or acquaintances',
    scenario3: 'Family gatherings and discussions',
    scenario4: 'Dating and romantic interactions',
    scenario5: 'Professional networking and meetings',
    scenario6: 'Job interviews and career advice',
    scenario7: 'Workplace collaborations and feedback',
    scenario8: 'Academic discussions and lectures',
    scenario9: 'Everyday shopping and transactions',
    scenario10: 'Dining out and restaurant interactions',
    scenario11: 'Travel planning and bookings',
    scenario12: 'Airport and transportation logistics',
    scenario13: 'Asking for and giving directions',
    scenario14: 'Hotel and accommodation arrangements',
    scenario15: 'Medical consultations and health advice',
    scenario16: 'Emergency situations and help requests',
    scenario17: 'Banking and financial discussions',
    scenario18: 'Legal consultations and advice',
    scenario19: 'Community events and volunteering',
    scenario20: 'Sports and fitness activities',
    scenario21: 'Hobbies and leisure pursuits',
    scenario22: 'Cultural events and arts appreciation',
    scenario23: 'Media and entertainment reviews',
    scenario24: 'News and current events debates',
    scenario25: 'Politics and social issues discussions',
    scenario26: 'Environmental and sustainability talks',
    scenario27: 'Technology and gadget troubleshooting',
    scenario28: 'Customer service and complaints',
    scenario29: 'Negotiations and bargaining',
    scenario30: 'Farewells and reflective conversations',
    
    // Mission goals (150 missions)
    mission1_1: "Find out the person's full name",
    mission1_2: "Find out where the person is from",
    mission1_3: "Find out what the person does (job/study)",
    mission1_4: "Find out one thing they like to do",
    mission1_5: "Get the person's phone number",
    mission2_1: "Find out what your friend did yesterday",
    mission2_2: "Find out your friend's favorite food",
    mission2_3: "Find out if your friend is free this weekend",
    mission2_4: "Find out your friend's favorite movie or series",
    mission2_5: "Get your friend to agree to meet tomorrow",
    mission3_1: "Tell your mom about your day",
    mission3_2: "Find out what your brother/sister wants to eat",
    mission3_3: "Ask grandma how she makes her special dish",
    mission3_4: "Find out when the family is meeting next",
    mission3_5: "Get your dad to watch a movie with you tonight",
    mission4_1: "Find out if the person is single",
    mission4_2: "Find out the person's favorite café",
    mission4_3: "Get the person to go for coffee this week",
    mission4_4: "Find out what kind of music they like",
    mission4_5: "Get the person's phone number",
    mission5_1: "Find out what the person's job is",
    mission5_2: "Find out which company they work for",
    mission5_3: "Find out one thing you have in common",
    mission5_4: "Get their LinkedIn or email",
    mission5_5: "Get them to agree to have coffee soon",
    mission6_1: "Tell the interviewer why you want the job",
    mission6_2: "Describe your best skill with an example",
    mission6_3: "Ask about the salary",
    mission6_4: "Ask when they will decide",
    mission6_5: "Get them to say you are a strong candidate",
    mission7_1: "Ask your colleague to help you with something",
    mission7_2: "Offer to help your colleague",
    mission7_3: "Ask your boss for feedback",
    mission7_4: "Ask for one day off next week",
    mission7_5: "Get your teammate to agree with your idea",
    mission8_1: "Ask the teacher to explain something again",
    mission8_2: "Ask when the next exam is",
    mission8_3: "Ask a classmate for the homework",
    mission8_4: "Ask the teacher for more time on a project",
    mission8_5: "Tell the teacher you liked the lesson",
    mission9_1: "Find out the price of something you want to buy",
    mission9_2: "Ask if they have it in a different color/size",
    mission9_3: "Get a small discount",
    mission9_4: "Return something you bought yesterday",
    mission9_5: "Buy two things and pay",
    mission10_1: "Order food and a drink",
    mission10_2: "Ask if something has nuts or meat",
    mission10_3: "Ask for the waiter's recommendation",
    mission10_4: "Complain about something (cold food/slow service)",
    mission10_5: "Ask for the bill and pay",
    mission11_1: "Book a train or bus ticket",
    mission11_2: "Find out the price of a flight",
    mission11_3: "Change a booking to a different day",
    mission11_4: "Ask for a window or aisle seat",
    mission11_5: "Cancel a ticket",
    mission12_1: "Check in for your flight",
    mission12_2: "Find out the gate number",
    mission12_3: "Ask why the flight is delayed",
    mission12_4: "Report a lost bag",
    mission12_5: "Ask for a meal voucher",
    mission13_1: "Ask how to get to the train station",
    mission13_2: "Ask how to get to a bank or pharmacy",
    mission13_3: "Ask if something is close/far",
    mission13_4: "Ask where the bathroom is",
    mission13_5: "Ask how to get to the city center",
    mission14_1: "Check in to the hotel",
    mission14_2: "Ask for a quiet or better room",
    mission14_3: "Complain about something in the room",
    mission14_4: "Ask for late check-out",
    mission14_5: "Check out and pay",
    mission15_1: "Describe your symptoms to the doctor",
    mission15_2: "Ask if you need medicine",
    mission15_3: "Ask for a sick note",
    mission15_4: "Tell the doctor about an allergy",
    mission15_5: "Ask how long you will be sick",
    mission16_1: "Say you lost your wallet/passport",
    mission16_2: "Ask someone to call the police/ambulance",
    mission16_3: "Say your phone was stolen",
    mission16_4: "Say you feel very bad and need a doctor",
    mission16_5: "Ask for help finding the hospital",
    mission17_1: "Open a new bank account",
    mission17_2: "Withdraw money",
    mission17_3: "Ask why your card doesn't work",
    mission17_4: "Change dollars/euros",
    mission17_5: "Ask for a new card",
    mission18_1: "Explain your problem to the lawyer",
    mission18_2: "Ask how much it costs",
    mission18_3: "Ask what documents you need",
    mission18_4: "Make an appointment",
    mission18_5: "Ask how long it will take",
    mission19_1: "Ask how to volunteer",
    mission19_2: "Find out the next event date",
    mission19_3: "Sign up to help",
    mission19_4: "Ask what you will do",
    mission19_5: "Invite the person to volunteer together",
    mission20_1: "Book a class or court",
    mission20_2: "Ask about prices or schedule",
    mission20_3: "Invite the person to play sport",
    mission20_4: "Ask for beginner tips",
    mission20_5: "Join a gym",
    mission21_1: "Find out the person's favorite hobby",
    mission21_2: "Tell them about your hobby",
    mission21_3: "Invite them to do something together",
    mission21_4: "Ask if they play an instrument",
    mission21_5: "Ask them to show/teach you something",
    mission22_1: "Buy a ticket to an event",
    mission22_2: "Ask about discounts",
    mission22_3: "Find out start time",
    mission22_4: "Ask the person's opinion about art/music",
    mission22_5: "Invite them to a museum/concert",
    mission23_1: "Recommend a movie/series",
    mission23_2: "Ask their favorite show",
    mission23_3: "Convince them to watch something",
    mission23_4: "Find out if they like a genre",
    mission23_5: "Say why you liked/disliked something",
    mission24_1: "Tell today's big news",
    mission24_2: "Ask their opinion",
    mission24_3: "Find out where they read news",
    mission24_4: "Share one good news story",
    mission24_5: "Agree or politely disagree",
    mission25_1: "Ask who they voted for",
    mission25_2: "Ask their opinion on one topic",
    mission25_3: "Say one thing you want to change",
    mission25_4: "Ask why they think that",
    mission25_5: "Find out their view on climate change",
    mission26_1: "Ask how they help the environment",
    mission26_2: "Convince them to use less plastic",
    mission26_3: "Share three easy green tips",
    mission26_4: "Ask if they recycle",
    mission26_5: "Invite them to a clean-up",
    mission27_1: "Explain your phone problem",
    mission27_2: "Ask how to fix Wi-Fi",
    mission27_3: "Complain your device is slow",
    mission27_4: "Ask for the price of a new one",
    mission27_5: "Get free repair or accessory",
    mission28_1: "Complain about late delivery",
    mission28_2: "Return something online",
    mission28_3: "Cancel a subscription",
    mission28_4: "Complain about bad internet",
    mission28_5: "Ask for money back or compensation",
    mission29_1: "Get 20–30% off something",
    mission29_2: "Buy and get a free gift",
    mission29_3: "Sell your old phone",
    mission29_4: "Get free delivery",
    mission29_5: "Negotiate a lower price on furniture",
    mission30_1: "Find out where your friend is moving",
    mission30_2: "Get them to promise to stay in touch",
    mission30_3: "Invite them to visit you later",
    mission30_4: "Find out what they will miss",
    mission30_5: "Say a proper goodbye"
  }
};

// Synchronous translation access with cache fallback
// This checks if translations are already loaded in the cache
export const getTranslation = (language: SupportedLanguage, key: keyof TranslationStrings): string => {
  // For English, return directly
  if (language === 'en') {
    const englishTranslations = translations.en;
    if (englishTranslations && englishTranslations[key]) {
      return englishTranslations[key] as string;
    }
  }
  
  // Try to get from cache (if already loaded)
  const cachedTranslations = translationCache.get(language);
  
  if (cachedTranslations && cachedTranslations[key]) {
    return cachedTranslations[key] as string;
  }
  
  // Fallback to English
  const englishTranslations = translations.en;
  if (englishTranslations && englishTranslations[key]) {
    return englishTranslations[key] as string;
  }
  
  // Final fallback
  return key;
};

// Synchronous character name access with cache fallback
export const getCharacterName = (language: SupportedLanguage, characterId: number): string => {
  // For English, return directly
  if (language === 'en') {
    const englishTranslations = translations.en;
    if (englishTranslations?.characterNames?.[characterId]) {
      return englishTranslations.characterNames[characterId];
    }
  }
  
  // Try to get from cache (if already loaded)
  const cachedTranslations = translationCache.get(language);
  
  if (cachedTranslations?.characterNames?.[characterId]) {
    return cachedTranslations.characterNames[characterId];
  }
  
  // Fallback to English
  const englishTranslations = translations.en;
  if (englishTranslations?.characterNames?.[characterId]) {
    return englishTranslations.characterNames[characterId];
  }
  
  // Final fallback
  return `Character ${characterId}`;
};
