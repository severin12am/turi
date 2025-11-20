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
  helpMe?: string;
  taskCompleted?: string;
  taskCompletedMessage?: string;
  next?: string;
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
    helpMe: 'Help me',
    taskCompleted: 'Task completed!',
    taskCompletedMessage: 'Task completed, you\'re one step closer to fluency!',
    next: 'Next'
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
