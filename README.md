# Turi Language Learning Platform

**An immersive 3D language learning application combining AI-powered conversations, interactive scenarios, and gamified missions to teach 30 languages through natural dialogue and contextual practice.**

---

## 📋 Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Dialogue System - Complete Guide](#dialogue-system---complete-guide)
- [Mission System](#mission-system)
- [Quiz System](#quiz-system)
- [Word Interaction System](#word-interaction-system)
- [Architecture](#architecture)
- [Setup & Development](#setup--development)
- [Deployment](#deployment)

---

## Overview

Turi is a language learning platform where users navigate a 3D city environment to interact with 30 AI-powered NPCs. Each NPC represents a real-world scenario (greetings, shopping, travel, business, etc.) and provides two complementary learning experiences:

1. **Scenario Dialogues** (Pre-scripted): 300 professionally-written conversations for vocabulary and pattern recognition
2. **Mission Dialogues** (AI-powered): 150 goal-oriented conversations for active production and real-world communication

The app uses voice recognition, neural speech synthesis, and adaptive AI to simulate authentic language immersion.

---

## Tech Stack

### Frontend
- **React 18.3.1** with TypeScript 5.3.3
- **Vite 4.4.8** for build tooling
- **Three.js** via React Three Fiber for 3D rendering
- **Zustand 4.5.6** for state management
- **Tailwind CSS 3.4.1** for styling
- **GSAP 3.12.2** for animations

### Backend & Services
- **Supabase 2.49.8** (PostgreSQL + Auth + Real-time)
- **Netlify Functions** for serverless API endpoints
- **AI Providers**: Google Gemini, Groq (configurable router with automatic fallbacks)
- **TTS**: Google Cloud TTS (primary) + ElevenLabs (premium voices)

### Mobile
- **Capacitor 5** for Android deployment
- Touch controls with virtual joystick
- Native haptics and splash screens

---

## Core Features

### 30 Language Support
- **Languages**: English, Spanish, French, German, Italian, Portuguese, Russian, Arabic, Chinese, Japanese, Korean, Hindi, Turkish, Polish, Ukrainian, Dutch, Romanian, Greek, Czech, Swedish, Hungarian, Bengali, Urdu, Indonesian, Vietnamese, Thai, Tamil, Telugu, Marathi, Swahili
- Dynamic UI translation based on mother language
- Transliteration for non-Latin scripts (Cyrillic, Arabic, Devanagari, etc.)
- AI-powered translation fallbacks with client-side caching

### 3D Interactive Environment
- Walkable city scene with 30 positioned NPCs
- First-person camera controls (WASD + mouse)
- Mobile touch controls with virtual joystick
- Distance-based interaction prompts
- Real-time coordinate tracking

### Voice Variety System
- **31 unique voices**: 30 character-specific + 1 Turi system voice
- Google Cloud Text-to-Speech with Neural2 and Chirp3-HD voices
- Optional ElevenLabs integration for premium voices
- Character voice consistency (same NPC always sounds the same)
- Gender-appropriate voice assignment per character

### Progress Tracking
- Per-language progress persistence
- Scenario and dialogue completion tracking
- Mission completion history with performance metrics
- Word count tracking (vocabulary growth)
- Time spent learning analytics
- Sequential unlocking system (must complete previous content to unlock next)

---

## Dialogue System - Complete Guide

The dialogue system is the heart of Turi, featuring two complementary modes with distinct pedagogical approaches.

---

### 1. Scenario Dialogues (Pre-Scripted Learning)

**Purpose**: Build foundational vocabulary and sentence patterns through structured, professionally-written conversations.

#### Structure
- **300 total dialogues** (30 scenarios × 10 dialogues each)
- Each dialogue contains 5-15 sequential phrases
- All content stored in database tables (`scenario_1` through `scenario_30`)
- Translations available in all 30 supported languages

#### Flow Diagram
```
User selects scenario → Dialogue selection panel opens
    ↓
User clicks "Dialogue 1" → DialogueBox component loads
    ↓
Fetch dialogue from database (scenario_X table)
    ↓
Display phrase in 3 formats:
├── Target language text (top): "¡Hola! Me llamo Alex."
├── Translation (middle): "Hello! My name is Alex."
└── Transliteration (bottom): "OH-lah may YAH-moh Alex"
    ↓
Generate TTS audio → Character-specific voice plays
    ↓
User can:
├── 🔊 Replay phrase
├── ⚙️ Adjust speed (0.5x, 1x, 2x)
├── 👁️ Hide/show target text
├── 🔍 Click any word for AI explanation
└── ⏭️ Move to next phrase
    ↓
All phrases completed → Quiz triggered
    ↓
Quiz passed (≥60%) → Unlock next dialogue
```

#### Key Features

**1. Three-Format Display**
- **Target Language**: The phrase user is learning (e.g., Spanish)
- **Translation**: User's mother language for comprehension
- **Transliteration**: Pronunciation guide for non-Latin scripts

Example for Russian learner:
```
Привет! Как дела?
Hello! How are you?
pree-VYET kak dee-LAH
```

**2. Playback Controls**
```typescript
// Available controls in DialogueBox
{
  replay: true,              // Replay current phrase
  speedControl: [0.5, 1, 2], // Playback speed options
  hideText: true,            // Test comprehension mode
  fullReplay: true,          // Replay entire dialogue
  stepBack: true             // Return to previous phrase
}
```

**3. Interactive Word Exploration**

Users can interact with words in two modes:

**Hover Mode** (Quick lookup):
```
Hover over word → Light highlight + 4 buttons appear above
    ↓
Available actions:
├── 🔊 Play pronunciation (TTS)
├── ℹ️ Show AI explanation (meaning + examples)
├── 🔍 Search in Google
└── 📚 Add to dictionary (requires login)
    ↓
Mouse leaves → Highlight disappears
```

**Click-to-Select Mode** (Phrase building):
```
Click word → Persistent blue highlight + panel at bottom
    ↓
Click more words → All stay highlighted
    ↓
Panel shows 4 buttons for combined selection
    ↓
Actions work on entire phrase:
├── 🔊 Pronounce "thank you very much"
├── ℹ️ Explain phrase meaning
├── 🔍 Google search phrase
└── 📚 Save phrase to dictionary
    ↓
Clear: Click outside, press Escape, or click X
```

**Conflict Prevention**: Only one mode active at a time. If words are selected (click mode), hover mode is disabled.

**4. Sentence Structure Explanation**

Users can click a button to get AI-powered grammar analysis:
```typescript
Input: "¿Cómo estás hoy?"
    ↓
AI analyzes structure → Returns breakdown:
{
  structure: "Question word + verb + adverb",
  breakdown: [
    "¿Cómo = How (question word)",
    "estás = you are (informal, 2nd person singular)",
    "hoy = today (time adverb)"
  ],
  notes: "Inverted question marks used in Spanish"
}
```

**5. Progress Requirements**

To unlock next dialogue:
- Complete all phrases in current dialogue
- Pass vocabulary quiz with ≥60% score
- (Optional) Complete in "Hide Text" mode for mastery

#### Database Schema (Scenario Dialogues)
```sql
-- Example: scenario_1 (Social Greetings)
CREATE TABLE scenario_1 (
  id BIGSERIAL PRIMARY KEY,
  dialogue_id INTEGER,      -- Which dialogue (1-10)
  dialogue_step INTEGER,    -- Step within dialogue (1-15)
  
  -- Text in all 30 languages
  en_text TEXT,
  es_text TEXT,
  ru_text TEXT,
  -- ... 27 more language columns
  
  UNIQUE(dialogue_id, dialogue_step)
);
```

---

### 2. Mission Dialogues (AI-Powered Conversations)

**Purpose**: Apply learned vocabulary through goal-oriented, free-form conversations that simulate real-world interactions.

#### Structure
- **150 total missions** (30 scenarios × 5 missions each)
- Each mission has a specific goal (e.g., "Get a discount", "Find out their name")
- AI generates responses dynamically based on user input
- No pre-scripted content - infinite conversation possibilities

#### Flow Diagram
```
User selects mission → Mission goal displayed
    ↓
Mission briefing shown (hidden from NPC):
"Goal: Find out the person's full name"
"NPC: Alex (Friendly Local, Male)"
    ↓
User has 2 input options:
├── 1. Click "Speak" → Voice recognition (primary method)
└── 2. Click "Help Me" → AI suggests sentence to speak
    ↓
User submits message → Sent to AI router
    ↓
AI generates NPC response:
├── Considers: Mission goal, NPC role, conversation history
├── Response in target language only
└── Detects if goal achieved → Returns MISSION_COMPLETE flag
    ↓
Display conversation with 3 formats:
├── User message: Target + translation + transliteration
├── NPC response: Target + translation + transliteration
└── TTS audio for NPC (character-specific voice)
    ↓
Conversation continues until:
├── User achieves mission goal → "Task completed!" message
└── User gives up → Can retry mission
    ↓
Mission complete → Quiz triggered
    ↓
Quiz requirements:
├── Score ≥70% (higher than scenario dialogues)
└── "Help Me" button NOT used during conversation
    ↓
Both requirements met → Next mission unlocked
```

#### Key Features

**1. Voice Input (Speech Recognition)**
```typescript
// Web Speech API integration
const recognition = new webkitSpeechRecognition();
recognition.lang = getRecognitionLanguage(targetLanguage); // e.g., 'es-ES'
recognition.continuous = false;
recognition.interimResults = false;

// User clicks "Speak" button
recognition.start();
    ↓
User speaks: "Hola, ¿cómo te llamas?"
    ↓
Recognition returns text → Auto-fills input field
    ↓
User reviews and clicks "Send"
```

**2. AI Help System**

When user clicks "Help Me" button:
```
User's situation: Stuck in conversation, needs suggestion
    ↓
System sends to AI:
{
  task: 'helper-robot',
  context: {
    missionGoal: "Find out their name",
    conversationHistory: ["Hola", "¡Hola! ¿Cómo estás?"],
    targetLanguage: 'es',
    motherLanguage: 'en'
  }
}
    ↓
AI generates contextual suggestion:
"You could ask: ¿Cómo te llamas?"
With translation: "What's your name?"
    ↓
User can:
├── Use suggestion (mark mission as help-used)
└── Ignore and speak their own message
    ↓
Note: Using help prevents mission from counting toward progress
```

**3. Mission Completion Detection**

AI analyzes conversation context to detect goal achievement:
```typescript
// AI prompt includes hidden goal
const prompt = `
You are ${npcName} (${npcRole}, ${npcGender}).
Reply in ${targetLanguage} ONLY.

SECRET GOAL (user is trying to): ${missionGoal}
DO NOT mention this goal explicitly.

Conversation so far:
${conversationHistory}

User just said: "${userMessage}"

Respond naturally. Then on new line write:
MISSION_COMPLETE: true/false
`;

// AI response parsing
const response = "Me llamo Alex Rodríguez.\nMISSION_COMPLETE: true";
const [npcText, statusLine] = response.split('\n');
const missionComplete = statusLine.includes('true');
```

**4. Conversation History Tracking**

Full conversation preserved for context-aware responses:
```typescript
interface ConversationMessage {
  role: 'user' | 'npc';
  text: string;
  translation?: string;
  transliteration?: string;
  timestamp: number;
}

// Example conversation state
[
  { role: 'user', text: 'Hola', translation: 'Hello' },
  { role: 'npc', text: '¡Hola! ¿Cómo estás?', translation: 'Hello! How are you?' },
  { role: 'user', text: '¿Cómo te llamas?', translation: "What's your name?" },
  { role: 'npc', text: 'Me llamo Alex.', translation: 'My name is Alex.' }
]
```

**5. Character Consistency**

Each mission uses the same NPC for all 5 missions in a scenario:
```typescript
// Character data (from constants/characters.ts)
{
  id: 9,
  name: 'Noah',
  role: 'Shop Assistant',
  gender: 'male',
  scenarioNumber: 9 // Shopping scenario
}

// All 5 missions in Scenario 9 use Noah
// Voice: Consistent male voice for Noah across all conversations
// Personality: Same friendly shop assistant demeanor
```

**6. Progressive Unlocking**

Strict sequential unlocking prevents skipping ahead:
```typescript
// Unlock rules
Mission 1 of Scenario 1: Always unlocked (starting point)
Mission 2-5 of Scenario 1: Requires previous mission completed
Mission 1 of Scenario 2: Requires ALL 5 missions of Scenario 1 completed
Mission 1 of Scenario 3: Requires ALL 5 missions of Scenario 2 completed
// ... and so on

// Global mission IDs (1-150)
Scenario 1: Missions 1-5   (IDs: 1-5)
Scenario 2: Missions 1-5   (IDs: 6-10)
Scenario 3: Missions 1-5   (IDs: 11-15)
// ...
Scenario 30: Missions 1-5  (IDs: 146-150)
```

#### Mission Database Schema
```sql
-- Mission completions tracking
CREATE TABLE mission_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  scenario_number INTEGER CHECK (scenario_number BETWEEN 1 AND 30),
  mission_number INTEGER CHECK (mission_number BETWEEN 1 AND 5),
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  used_help BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, scenario_number, mission_number)
);

-- Progress tracking
CREATE TABLE language_levels (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  target_language TEXT,
  scenario_progress INTEGER DEFAULT 1,
  scenario_dialogue_progress INTEGER DEFAULT 0,
  mission_progress INTEGER DEFAULT 1, -- Global mission ID (1-150)
  word_progress INTEGER DEFAULT 0,
  UNIQUE(user_id, target_language)
);
```

---

### 3. Dialogue Comparison: Scenario vs Mission

| Feature | Scenario Dialogues | Mission Dialogues |
|---------|-------------------|-------------------|
| **Content Type** | Pre-scripted, static | AI-generated, dynamic |
| **User Role** | Listener/learner (passive) | Active participant (speaker) |
| **Primary Goal** | Learn vocabulary patterns | Apply knowledge in conversation |
| **Flexibility** | Fixed dialogue sequence | Infinite conversation paths |
| **Difficulty** | Lower (comprehension) | Higher (production) |
| **Interactivity** | Click through phrases | User speaks via voice input |
| **Quiz Threshold** | ≥60% to unlock next | ≥70% to unlock next |
| **Help System** | Word explanations | AI sentence suggestions |
| **Voice Input** | Not used | Primary input method |
| **Progress Tracking** | `scenario_dialogue_progress` | `mission_progress` + `mission_completions` |
| **Unlocking** | Complete previous dialogue | Complete previous mission + no help used |

---

### 4. Dialogue Technical Implementation

#### Component Structure
```
DialogueBox.tsx (5,700+ lines)
├── Props handling (mission vs scenario mode)
├── State management (20+ useState hooks)
├── Database queries (Supabase)
├── AI integration (via aiService.ts)
├── TTS generation (character-specific voices)
├── Speech recognition (Web Speech API)
├── Word interaction (hover + click-to-select)
├── Quiz integration (VocalQuizComponent)
└── Translation/transliteration display
```

#### Key State Variables
```typescript
// Dialogue content
const [phrases, setPhrases] = useState<Phrase[]>([]);
const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

// Mission mode
const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
const [missionCompleted, setMissionCompleted] = useState(false);
const [usedHelpInMission, setUsedHelpInMission] = useState(false);

// Audio
const [isPlaying, setIsPlaying] = useState(false);
const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

// Voice input
const [isListening, setIsListening] = useState(false);
const [transcript, setTranscript] = useState('');

// Word interaction
const [hoveredWord, setHoveredWord] = useState<string | null>(null);
const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());

// UI state
const [showQuiz, setShowQuiz] = useState(false);
const [hideTargetText, setHideTargetText] = useState(false);
```

#### AI Service Integration
```typescript
// All AI calls go through centralized router
import { 
  generateNPCResponse,      // Mission conversations
  generateWordExplanation,  // Word definitions
  generateTextExplanation,  // Sentence structure
  generateHelpSuggestion,   // Mission help
  checkUserSentence,        // Grammar checking
  translateWithAI,          // Translation fallback
  generateSpeech            // TTS generation
} from '../services/aiService';

// Example: Mission NPC response
const response = await generateNPCResponse({
  missionGoal: mission.goal,
  npcName: character.name,
  npcRole: mission.npcRole,
  npcGender: character.gender,
  targetLanguage: targetLanguage,
  motherLanguage: motherLanguage,
  conversationHistory: conversationHistory,
  userMessage: userInput
});

// Router automatically:
// 1. Selects provider (Groq 75%, Gemini 25%)
// 2. Tries fallbacks if primary fails
// 3. Returns structured response
```

#### Translation & Transliteration Flow
```typescript
// Parallel processing for speed
const [translationResult, transliterationResult] = await Promise.all([
  translateWithAI(text, targetLanguage, motherLanguage),
  generateTransliteration(text, targetLanguage)
]);

// Display all three formats
<div className="phrase-display">
  <div className="target-text">{targetText}</div>
  <div className="translation">{translationResult}</div>
  <div className="transliteration">{transliterationResult}</div>
</div>
```

#### TTS Generation
```typescript
// Character-specific voice selection
const audioUrl = await generateSpeech({
  text: phraseText,
  language: targetLanguage,
  characterId: characterId,
  voiceType: 'npc', // vs 'turi' for quiz
  gender: character.gender
});

// Audio caching
const audio = new Audio(audioUrl);
audio.playbackRate = playbackSpeed; // 0.5x, 1x, or 2x
audio.play();
```

---

## Quiz System

After completing any dialogue (scenario or mission), users must pass a vocabulary quiz to unlock the next content.

### Word Extraction Algorithm
```typescript
// 1. Fetch all dialogue text in target language
const dialogueText = phrases.map(p => p[`${targetLanguage}_text`]).join(' ');

// 2. Process text
const words = dialogueText
  .toLowerCase()
  .replace(/[.,!?;:()"""''']/g, '') // Remove punctuation
  .split(/\s+/) // Split by whitespace
  .filter(word => word.length >= 3) // Filter short words
  .filter((word, index, self) => self.indexOf(word) === index); // Remove duplicates

// 3. Match against quiz database (1000 common words)
const { data: quizWords } = await supabase
  .from('quiz')
  .select('*')
  .in(getLanguageColumn(targetLanguage), words)
  .limit(5);

// 4. If < 5 words found, auto-complete dialogue
if (quizWords.length < 5) {
  markDialogueComplete();
  unlockNext();
}
```

### Quiz Question Format
```typescript
interface QuizQuestion {
  word: string;           // "gracias"
  correctAnswer: string;  // "thank you"
  options: string[];      // ["thank you", "please", "hello", "goodbye"]
}

// Generate distractors from random quiz words
function generateOptions(correctWord: QuizWord): string[] {
  const distractors = getRandomWords(3, { exclude: correctWord.id });
  const options = [
    correctWord[motherLanguage], // Correct answer
    ...distractors.map(d => d[motherLanguage])
  ];
  return shuffle(options);
}
```

### Quiz Modes
1. **Text Mode**: User reads word and selects translation
2. **Audio Mode**: User hears word (Turi voice) and selects translation
3. **Voice Recognition** (optional): User speaks the word for pronunciation practice

### Scoring Rules

**Scenario Dialogues**:
- ≥60% required (3/5 correct)
- Can retry incorrectly answered questions
- Passing score: Eventually answer all questions correctly

**Mission Dialogues**:
- ≥70% required (4/5 correct)
- Can retry incorrectly answered questions
- Additional requirement: "Help Me" button NOT used during conversation
- Passing score: Eventually answer all questions correctly + no help used

```typescript
// Mission completion logic
if (score >= 70 && !usedHelpInMission) {
    await supabase.from('mission_completions').upsert({
      user_id: userId,
    scenario_number: scenarioNumber,
    mission_number: missionNumber,
    score: Math.round(score),
    used_help: false
  });
  
    await supabase.from('language_levels').update({
    mission_progress: currentProgress + 1
  });
  
  showSuccessMessage();
  unlockNextMission();
} else if (usedHelpInMission) {
  showMessage("Mission not counted - you used help. Try again!");
}
```

---

## Word Interaction System

Two non-conflicting modes for word exploration during dialogues.

### Mode 1: Hover (Quick Lookup)
```
User action: Hover mouse over word
    ↓
Light highlight appears
4 buttons show above word:
├── 🔊 Play pronunciation
├── ℹ️ AI explanation
├── 🔍 Google search
└── 📚 Save to dictionary
    ↓
User clicks button → Action executes
Mouse leaves → Everything disappears
```

### Mode 2: Click-to-Select (Phrase Building)
```
User action: Click on "thank"
    ↓
Blue persistent highlight with border
Panel appears at bottom with 4 buttons
    ↓
User clicks "you" → Both words highlighted
User clicks "very" → Three words highlighted
    ↓
Panel actions work on combined text "thank you very"
    ↓
User presses Escape → Selection clears
```

### Conflict Prevention
```typescript
const hasAnySelection = selectedWords.size > 0;

// In word rendering
onMouseEnter={() => {
  if (!hasAnySelection) { // Hover disabled when selection exists
    setHoveredWord(wordKey);
  }
}}

// Only one panel renders at a time
{!hasAnySelection && hoveredWord && <HoverPanel />}
{hasAnySelection && <PersistentPanel />}
```

---

## Architecture

### State Management (Zustand)
```typescript
interface UserState {
  // Auth
  user: User | null;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  
  // Languages
  motherLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  isLanguageSelected: boolean;
  
  // UI
  isHelperRobotOpen: boolean;
  isDialogueOpen: boolean;
  isQuizActive: boolean;
  isMovementDisabled: boolean;
  
  // Progress
  languageLevel: LanguageLevel | null;
  
  // Instructions
  instructionType: InstructionType;
  showInstructions: boolean;
  
  // Mission mode
  isMissionMode: boolean;
}
```

### AI Router System
```typescript
// Task-based provider selection with automatic fallbacks
const AI_CONFIG = {
  'npc-response': [
    { provider: 'groq', percentage: 100, model: 'llama-3.3-70b-versatile' }
  ],
  'word-explanation': [
    { provider: 'gemini', percentage: 60, model: 'gemini-2.5-flash-lite' },
    { provider: 'groq', percentage: 40, model: 'llama-3.3-70b-versatile' }
  ],
  'translation': [
    { provider: 'gemini', percentage: 70, model: 'gemini-2.5-flash-lite' },
    { provider: 'groq', percentage: 30, model: 'llama-3.3-70b-versatile' }
  ],
  'tts-npc': [
    { provider: 'elevenlabs', percentage: 100 }
  ],
  'tts-turi': [
    { provider: 'google', percentage: 80 },
    { provider: 'elevenlabs', percentage: 20 }
  ]
};

// Automatic fallback chain
Groq → Gemini → Browser TTS (for TTS failures)
```

### Service Layer Architecture
```
src/services/
├── aiRouter.ts          # Provider selection & fallback logic
├── aiService.ts         # High-level AI task wrappers
├── auth.ts              # Supabase authentication
├── progress.ts          # User progress tracking
├── scenarioQuiz.ts      # Quiz word extraction
├── translationCache.ts  # Client-side caching
├── translationFallback.ts # Database fallback
├── translationLoader.ts # UI translation loading
├── dictionary.ts        # User dictionary management
├── security.ts          # Input validation & rate limiting
├── supabase.ts          # Database client
├── logger.ts            # Event logging
└── version.ts           # App version tracking
```

### Database Schema
```sql
-- Core tables
users (id, email, mother_language, target_language, total_minutes)
language_levels (user_id, target_language, scenario_progress, mission_progress, word_progress)
mission_completions (user_id, scenario_number, mission_number, score, used_help)

-- Content tables (30 tables)
scenario_1 to scenario_30 (dialogue_id, dialogue_step, en_text, es_text, ru_text, ...)

-- Quiz database
quiz (id, english, spanish, russian, french, ...)
```

---

## Setup & Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Netlify account (for deployment)

### Environment Variables
```bash
# .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Netlify environment variables (server-side)
GOOGLE_CLOUD_API_KEY=your_google_key
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
ELEVENLABS_API_KEY=your_elevenlabs_key (optional)
```

### Installation
```bash
npm install
npm run dev  # Start development server on localhost:5173
```

### Build
```bash
npm run build  # Builds to /dist
npm run preview  # Preview production build
```

### Mobile Build (Android)
```bash
npm run build
npx cap sync android
npx cap run android
```

---

## Deployment

### Netlify Deployment
```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Environment Setup
1. Create Netlify site
2. Connect GitHub repository
3. Add environment variables in Netlify dashboard
4. Push to main branch → Automatic deployment

---

## Performance Optimizations

- **Translation Caching**: IndexedDB reduces API calls by ~60%
- **Model Preloading**: All 30 character GLB models preloaded on init
- **Audio Caching**: TTS responses cached in browser
- **Lazy Loading**: Dialogue data fetched on-demand per scenario
- **Parallel AI Requests**: Translation + transliteration run concurrently
- **Vendor Chunk Splitting**: React, Three.js, and Supabase in separate bundles
- **CDN Delivery**: Static assets via Netlify Edge network

---

## Security Features

1. **API Key Protection**: All AI provider keys secured server-side via Netlify Functions
2. **Row Level Security**: Supabase RLS ensures users only access their own data
3. **Anonymous Mode**: Local storage fallback when authentication unavailable
4. **Input Validation**: XSS and SQL injection prevention
5. **Rate Limiting**: 60 requests/minute, 1000/hour per user
6. **Session Management**: Automatic refresh with secure JWT tokens

---

## Browser Support

- **Web**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile**: Android 7.0+ via Capacitor
- **iOS**: Supported via Capacitor (build configuration present)
- **WebGL Required**: For 3D rendering
- **Speech Recognition**: Chrome/Edge (best support), limited on Firefox/Safari

---

## Known Limitations

- Mission AI requires stable internet connection
- Voice recognition accuracy varies by accent/microphone quality
- Some languages have fewer TTS voice options
- 3D scene performance dependent on GPU (mobile may experience frame drops)
- Transliteration only generated for select languages

---

## Project Structure
```
Turi-Beta/
├── src/
│   ├── components/          # 23 React components
│   │   ├── DialogueBox.tsx  # Main dialogue component (5,700+ lines)
│   │   ├── VocalQuizComponent.tsx
│   │   ├── MissionSelectionPanel.tsx
│   │   └── ...
│   ├── scenes/              # Three.js 3D scenes
│   │   ├── City.tsx
│   │   ├── Character.tsx
│   │   └── HelperRobotModel.tsx
│   ├── services/            # Business logic (14 files)
│   ├── config/              # Configuration
│   ├── constants/           # Static data (30 languages, 150 missions)
│   ├── hooks/               # React hooks
│   ├── store/               # Zustand state
│   └── types/               # TypeScript interfaces
├── netlify/functions/       # 9 serverless API endpoints
├── public/models/           # 31 GLB 3D models
├── dist/                    # Production build
└── android/                 # Capacitor Android project
```

---

## License

[Add your license here]

---

## Credits

Built with React, Three.js, Supabase, Google AI, and Groq.

**Developed in November 2025**
