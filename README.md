# Turi Language Learning

An immersive 3D language learning platform that combines AI-powered conversations, interactive scenarios, and gamified missions to teach 30 languages through natural dialogue and contextual practice.

## Core Concept

Users navigate a 3D city environment to interact with 30 unique AI-powered NPCs, each representing different real-world scenarios (greetings, shopping, travel, business, etc.). The app uses voice recognition, natural speech synthesis, and adaptive AI conversations to simulate authentic language immersion without leaving home.

## Technical Stack

**Frontend:**
- React 18 + TypeScript
- Three.js via React Three Fiber for 3D rendering
- Zustand for state management
- Tailwind CSS for styling
- Vite for build tooling

**3D Assets:**
- Custom GLB models (city environment + 30 character models)
- GSAP for animations
- React Three Drei for 3D utilities

**Backend Services:**
- Supabase for PostgreSQL database, authentication, and real-time data
- Netlify Functions for serverless API endpoints
- Multiple AI providers via configurable router system

**Mobile:**
- Capacitor 5 for native Android deployment
- Touch controls and orientation locking
- Native haptics and splash screen

## Core Dialogue Systems

The app features two complementary learning modes, each with distinct pedagogical approaches:

### 1. Mission Dialogues (AI-Powered, Dynamic)

**Overview:** 150 goal-oriented conversations (30 scenarios × 5 missions each) where users interact with AI NPCs to achieve specific objectives.

**How It Works:**
1. **Mission Assignment**: User selects a scenario (e.g., "Shopping") and a mission (e.g., "Negotiate a discount")
2. **AI-Generated Conversation**: 
   - User speaks/types in target language
   - AI NPC (via Gemini/DeepSeek/Groq) responds naturally in real-time
   - Conversation history maintained for context-aware responses
   - NPC personality stays consistent (name, role, gender)
3. **Goal Tracking**: AI automatically detects when user completes the mission goal
4. **Live Assistance**: "Help Me" button provides grammar corrections and suggestions mid-conversation
5. **Voice Recognition**: Speech-to-text converts spoken input to text
6. **Real-Time Translation**: Each message shows original + translation + transliteration
7. **Quiz Validation**: After conversation, user takes vocabulary quiz (≥70% required to mark mission complete)
8. **Progressive Unlocking**: Next mission unlocks only after successful completion

**Example Mission Flow:**
```
Scenario 9: Shopping → Mission 3: "Get a small discount"

User: "Hola, ¿cuánto cuesta esta camisa?"
NPC (Noah): "Cuesta 45 euros. ¿Te gusta?"
User: "Sí, pero es un poco cara. ¿Hay descuento?"
NPC (Noah): "Para ti, puedo hacer 40 euros. ¿Está bien?"
User: "¡Perfecto! Gracias."

→ MISSION COMPLETE (Goal achieved: got discount)
→ Quiz: 5 words from conversation
→ Score ≥70% → Unlock Mission 4
```

**Technical Implementation:**
- User input → DialogueBox component → missionNPC.ts service
- AI prompt includes: mission goal (hidden from user), NPC role, conversation history, target language
- Response parsing: Extract NPC message + MISSION_COMPLETE status
- Character-specific voice synthesis (30 unique voices)
- Translation and transliteration run in parallel for speed
- Progress saved to `mission_completions` table

### 2. Scenario Dialogues (Pre-Scripted, Structured)

**Overview:** 300 professionally-written dialogues (30 scenarios × 10 dialogues each) for foundational vocabulary and sentence pattern learning.

**How It Works:**
1. **Dialogue Selection**: User chooses from 10 unlocked dialogues per scenario
2. **Multi-Step Playback**:
   - Each dialogue has 5-15 sequential phrases (stored in CSV files)
   - User sees phrase in target language with translation and transliteration
   - Audio plays automatically with character-specific voice
   - Can replay phrase, adjust speed (0.5x-2.0x), or hide/show text
3. **Interactive Elements**:
   - **Word Hover**: Click any word for AI-generated definition
   - **Full Dialogue Replay**: Repeat entire conversation
   - **Mode Switching**: Hide target text to test comprehension
4. **Quiz After Completion**:
   - Automatic word extraction from dialogue text
   - Match words against 1000-word common vocabulary database
   - Present 5 most relevant words for testing
   - ≥60% score required to unlock next dialogue
5. **Progressive Unlocking**: Dialogue 2 unlocks after completing Dialogue 1, etc.

**Example Scenario Dialogue:**
```
Scenario 1, Dialogue 3: "Meeting a Friend"

Step 1 (Character speaks): "¡Hola María! ¿Cómo estás?"
        Translation: "Hi Maria! How are you?"
        Transliteration: "OH-lah mah-REE-ah KOH-moh ehs-TAHS"

Step 2 (Character speaks): "Estoy muy bien, gracias. ¿Y tú?"
        Translation: "I'm very well, thanks. And you?"
        [User can click "bien" → AI explains: "good/well, adjective"]

Step 3-8: [Conversation continues...]

→ Dialogue ends
→ Quiz: "estás", "gracias", "bien", "amigo", "también"
→ Score ≥60% → Unlock Dialogue 4
```

**Technical Implementation:**
- Content stored in `scenario_1` through `scenario_30` tables (CSV-imported)
- Each row: `dialogue_id, dialogue_step, en_text, es_text, ru_text, ... [30 languages]`
- DialogueBox component handles playback sequencing
- TTS generated on-demand via Google Cloud (cached for reuse)
- Quiz words extracted by scenarioQuiz.ts service (matches against `quiz` table)
- Progress tracked in `language_levels.scenario_dialogue_progress`

### Comparison: Mission vs Scenario Dialogues

| Feature | Mission Dialogues | Scenario Dialogues |
|---------|------------------|-------------------|
| **Content Type** | AI-generated, dynamic | Pre-scripted, static |
| **User Role** | Active participant | Listener/learner |
| **Goal** | Complete specific task | Learn vocabulary/patterns |
| **Flexibility** | Infinite conversation paths | Fixed dialogue sequence |
| **Difficulty** | Higher (requires production) | Lower (comprehension focus) |
| **Interactivity** | User speaks/types freely | User listens and reads |
| **Quiz Source** | Words from conversation | Words from scripted dialogue |
| **Unlocking** | ≥70% quiz + no help used | ≥60% quiz |
| **Progress Tracking** | `mission_completions` | `language_levels.scenario_dialogue_progress` |

### Why Both Systems?

**Scenario Dialogues**: Build foundation (vocabulary recognition, sentence patterns, pronunciation)  
**Mission Dialogues**: Apply knowledge (active production, conversation skills, goal-oriented communication)

Together they create a **comprehension → production pipeline** that mirrors natural language acquisition.

## Key Features

### 3. Multi-Language Support (30 Languages)
- Target languages: English, Spanish, French, German, Italian, Portuguese, Russian, Arabic, Chinese (Mandarin), Japanese, Korean, Hindi, Turkish, Polish, Ukrainian, Dutch, Romanian, Greek, Czech, Swedish, Hungarian, Bengali, Urdu, Indonesian, Vietnamese, Thai, Tamil, Telugu, Marathi, Swahili
- Dynamic UI translation based on mother language
- Transliteration support for non-Latin scripts (Cyrillic, Arabic, Devanagari, etc.)
- AI-powered translation fallbacks with caching

### 4. Intelligent Quiz System

**Quiz Structure & Flow:**

After completing any dialogue (mission or scenario), users must pass a vocabulary quiz to unlock the next content.

**Word Extraction Algorithm:**
1. System fetches all dialogue text in target language
2. Text processing:
   - Remove punctuation (., !, ?, etc.)
   - Convert to lowercase
   - Split into individual words
   - Filter out very short words (<3 characters)
   - Remove duplicates
3. Match extracted words against `quiz` table (1000 most common words database)
4. Select up to 5 matched words for testing

**Quiz Question Format:**
```javascript
// Each quiz word becomes a multiple-choice question
{
  word: "gracias",           // Target language word
  correctAnswer: "thank you", // Mother language translation
  options: [
    "thank you",             // Correct answer
    "please",                // Distractor 1
    "hello",                 // Distractor 2
    "goodbye"                // Distractor 3
  ]
}
```

**Quiz Modes:**
- **Text Mode**: User reads word and selects translation
- **Audio Mode**: User hears word pronounced (Turi voice) and selects translation
- **Voice Recognition** (optional): User speaks the word for pronunciation practice

**Scoring & Progression:**
- **Scenario Dialogues**: ≥60% required (3/5 correct)
- **Mission Dialogues**: ≥70% required (4/5 correct) + must not have used "Help Me" button
- Score saved to database (`mission_completions.score` or progress tracking)
- Auto-complete available if no quiz words found (dialogue uses only uncommon vocabulary)

**Technical Implementation:**
```typescript
// 1. Word Extraction (src/services/scenarioQuiz.ts)
export const fetchScenarioQuizWords = async (
  characterId: number,
  dialogueId: number,
  scenarioNumber: number,
  targetLanguage: string,
  motherLanguage: string
) => {
  // Fetch dialogue from scenario_X table
  const dialogue = await supabase
    .from(`scenario_${characterId}`)
    .select('*')
    .eq('dialogue_id', dialogueId);
  
  // Extract words from target language text
  const words = extractWordsFromDialogue(dialogue.map(p => p[`${targetLanguage}_text`]));
  
  // Match against quiz table (1000 common words)
  const quizWords = await supabase
    .from('quiz')
    .select('*')
    .in(getLanguageColumn(targetLanguage), words)
    .limit(5);
  
  return quizWords;
};

// 2. Quiz Component (src/components/VocalQuizComponent.tsx)
const VocalQuizComponent = ({ words, onComplete }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  
  // Generate 4 answer options (1 correct + 3 distractors)
  const options = generateOptions(words[currentWordIndex]);
  
  // Handle answer selection
  const handleAnswer = (selectedOption) => {
    const isCorrect = selectedOption === words[currentWordIndex].translation;
    setUserAnswers([...userAnswers, isCorrect]);
    
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      // Quiz complete - calculate score
      const score = (userAnswers.filter(a => a).length / words.length) * 100;
      onComplete(score);
    }
  };
  
  return (
    <div className="quiz-container">
      <div className="word">{words[currentWordIndex].word}</div>
      <button onClick={() => playAudio(words[currentWordIndex].word)}>🔊</button>
      {options.map(option => (
        <button onClick={() => handleAnswer(option)}>{option}</button>
      ))}
    </div>
  );
};

// 3. Progress Update (src/services/progress.ts)
export const updateProgressAfterQuiz = async (score: number, quizType: 'scenario' | 'mission') => {
  if (quizType === 'scenario' && score >= 60) {
    // Unlock next scenario dialogue
    await supabase
      .from('language_levels')
      .update({ scenario_dialogue_progress: currentProgress + 1 })
      .eq('user_id', userId);
  } else if (quizType === 'mission' && score >= 70 && !usedHelp) {
    // Record mission completion
    await supabase
      .from('mission_completions')
      .upsert({
        user_id: userId,
        scenario_number: scenarioNumber,
        mission_number: missionNumber,
        score: score,
        used_help: false
      });
    
    // Unlock next mission
    await supabase
      .from('language_levels')
      .update({ mission_progress: currentProgress + 1 })
      .eq('user_id', userId);
  }
};
```

**Distractor Generation Algorithm:**
```typescript
// Generate 3 incorrect options + 1 correct answer
function generateOptions(quizWord) {
  const correctAnswer = quizWord.translation;
  
  // Get 3 random words from quiz table (same language pair)
  const distractors = getRandomWords(3, excludeWord: quizWord.id);
  
  // Shuffle options so correct answer isn't always first
  const options = shuffle([correctAnswer, ...distractors.map(d => d.translation)]);
  
  return options;
}
```

### 5. Voice Variety System
- **31 unique voices**: 30 character-specific + 1 dedicated system voice (Turi)
- Google Cloud Text-to-Speech with Neural2, WaveNet, and Chirp3-HD voices
- Optional ElevenLabs integration for premium voices
- Character voice consistency across all interactions (same NPC always sounds the same)
- Gender-appropriate voice assignment per character

### 6. 3D Interactive Environment
- Walkable city scene with 30 positioned NPCs
- First-person camera controls (WASD + mouse)
- Mobile touch controls with virtual joystick
- Distance-based interaction prompts
- Real-time coordinate tracking

### 7. Progress Tracking
- Per-language progress persistence
- Scenario and dialogue completion tracking
- Mission completion history with performance metrics
- Word count tracking (vocabulary growth)
- Time spent learning analytics

## Architecture

### State Management
```
Zustand Store (src/store/index.ts)
├── User authentication state
├── Language selection (mother + target)
├── UI state (dialogs, panels, modals)
├── Mission mode tracking
└── Movement controls
```

### AI Router System
```typescript
// src/config/aiConfig.ts + src/services/aiRouter.ts
Task-based AI provider selection with automatic fallbacks:
- NPC conversations → Gemini 1.5 Flash/Pro (primary) → DeepSeek/Groq (fallback)
- Translation → Gemini Flash (fast, cost-effective)
- Word explanations → Gemini 1.5 Pro (high quality)
- TTS → Google Cloud TTS (primary) → ElevenLabs (premium option)

Configurable percentage distribution for load balancing
Automatic retry with alternative models on failure
```

### Service Layer
```
src/services/
├── aiRouter.ts          # AI provider selection and fallback logic
├── aiService.ts         # High-level AI task wrappers
├── missionNPC.ts        # Mission conversation AI
├── gemini.ts            # Google AI integration (TTS, translation)
├── auth.ts              # Supabase authentication
├── progress.ts          # User progress tracking
├── scenarioQuiz.ts      # Quiz word extraction and validation
├── expressionExtraction.ts  # Common phrase detection
├── translationCache.ts  # Client-side translation caching
└── dictionary.ts        # Word definition lookup
```

### Netlify Functions (Serverless Backend)

All AI provider API keys are secured server-side in Netlify Functions to prevent exposure in client code.

**Function Architecture:**
```
netlify/functions/
├── AI Model Proxies (Hide API keys, add request validation)
│   ├── gemini-proxy.js          # Gemini 1.5 Flash/Pro
│   ├── deepseek-proxy.js        # DeepSeek alternative
│   └── groq-proxy.js            # Groq alternative
│
├── Text-to-Speech
│   ├── gemini-tts.js            # Google Cloud TTS (primary)
│   └── elevenlabs-tts.js        # ElevenLabs premium voices
│
└── Specialized AI Tasks
    ├── gemini-dialogue.js           # NPC conversation generation
    ├── gemini-word-explanation.js   # Contextual word definitions
    └── gemini-extract-expressions.js # Common phrase extraction
```

**Function Request/Response Flow:**
```
Client Request
    ↓
Netlify Function (validates request, adds auth headers)
    ↓
External AI Provider API (Gemini/DeepSeek/Groq/Google TTS)
    ↓
Netlify Function (normalizes response format)
    ↓
Client receives standardized response
```

**Security Features:**
- API keys stored as Netlify environment variables (never in client code)
- Request validation and sanitization
- Rate limiting (configurable per function)
- CORS headers properly configured
- Error responses sanitized (no API key leakage)

**Example Function Structure:**
```javascript
// netlify/functions/gemini-proxy.js
exports.handler = async (event) => {
  // 1. Validate request
  if (event.httpMethod !== 'POST') return { statusCode: 405 };
  
  // 2. Parse request body
  const { modelName, requestBody } = JSON.parse(event.body);
  
  // 3. Call external API with server-side key
  const response = await fetch(GEMINI_API_URL, {
    headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify(requestBody)
  });
  
  // 4. Return normalized response
  return { statusCode: 200, body: JSON.stringify(data) };
};
```

## Backend Architecture

### Overview

The backend follows a **hybrid architecture** combining:
- **Supabase** (PostgreSQL + Auth + Real-time): User data, dialogue content, progress tracking
- **Netlify Functions** (Serverless): AI provider proxies, API key security, business logic
- **External AI Providers**: Gemini, DeepSeek, Groq (via router with fallbacks)
- **Google Cloud Services**: Text-to-Speech API

### Backend Components

**1. Database Layer (Supabase)**
- **Purpose**: Persistent storage for users, content, and progress
- **Features**:
  - Row Level Security (RLS) policies ensure users only access their data
  - Real-time subscriptions (currently unused, available for future features)
  - Built-in authentication with JWT tokens
  - Automatic connection pooling and scaling

**2. Serverless API Layer (Netlify Functions)**
- **Purpose**: Secure API key management and request routing
- **Benefits**:
  - Zero server maintenance
  - Automatic scaling based on demand
  - Cold start optimization via esbuild bundling
  - Geographic distribution (CDN edge network)
- **Cost**: Pay-per-invocation (very cost-effective for bursty AI workloads)

**3. AI Router & Fallback System**
- **Purpose**: Intelligent provider selection and automatic failover
- **Logic**:
  ```
  1. Select provider based on task + percentage configuration
  2. Try primary model (e.g., Gemini 1.5 Flash)
  3. If fails → Try fallback models for same provider
  4. If all fail → Try alternative providers (DeepSeek → Groq)
  5. If all providers fail → Return error to user
  ```
- **Configuration**: `src/config/aiConfig.ts` allows adjusting provider percentages per task

**4. Caching Strategy**
- **Translation Cache**: IndexedDB stores AI translations client-side (reduces API calls by ~60%)
- **TTS Audio Cache**: MP3 files cached in browser for frequently used phrases
- **Quiz Word Cache**: Common words stored locally to speed up quiz generation
- **Supabase Cache**: Dialogue content cached after first fetch (30-day TTL)

**5. Authentication & Authorization**
- **Supabase Auth**: Email/password authentication with secure password hashing
- **JWT Tokens**: Session tokens stored in localStorage with automatic refresh
- **Anonymous Mode**: Users can try app without account (local storage fallback)
- **RLS Policies**: Database-level security prevents cross-user data access

**6. Error Handling & Resilience**
- **Exponential Backoff**: Failed AI requests retry with increasing delays
- **Graceful Degradation**: If TTS fails, user sees text-only dialogue
- **Offline Support**: Cached content remains accessible without internet
- **Error Logging**: Client-side logger service tracks errors for debugging

### Request Flow Examples

**Scenario Dialogue Playback:**
```
1. User clicks "Dialogue 3" button
2. React component → progress.ts service checks if unlocked
3. If unlocked → Supabase query: SELECT * FROM scenario_X WHERE dialogue_id = 3
4. Dialogue phrases loaded → Display first phrase
5. TTS request → aiRouter.ts selects Google TTS
6. Netlify Function (gemini-tts.js) → Google Cloud TTS API
7. Audio returned as base64 → Decoded → Audio element plays
8. User clicks "Next" → Repeat for each phrase
9. Dialogue ends → Quiz triggered (scenarioQuiz.ts)
10. Quiz completed → progress.ts updates language_levels table
```

**Mission Conversation:**
```
1. User starts Mission 2 for Scenario 5
2. DialogueBox loads mission details from constants/missions.ts
3. User speaks into microphone → Web Speech API transcribes
4. Transcribed text → missionNPC.ts builds AI prompt
5. aiRouter.ts → selects Gemini 1.5 Flash (70% of time)
6. Netlify Function (gemini-proxy.js) → Gemini API with mission context
7. AI generates NPC response + MISSION_COMPLETE flag
8. Response parsed → NPC text extracted
9. TTS generated for NPC speech → Audio plays
10. AI translation service translates both user + NPC messages
11. Transliteration generated for non-Latin scripts
12. All data displayed in DialogueBox with formatting
13. User responds → Loop continues until mission complete
14. Mission complete → Quiz → Score ≥70% + no help → Update mission_completions table
```

**AI Fallback in Action:**
```
User request → Gemini 1.5 Flash (fails, 500 error)
            → Gemini 1.5 Pro (fails, rate limit)
            → DeepSeek Chat (succeeds!) ✓
            → Response returned to user
            
(Total fallback time: ~3-5 seconds)
```

## Database Schema

### Supabase PostgreSQL Tables

**1. Users & Authentication**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT,  -- Hashed via Supabase Auth
  mother_language TEXT DEFAULT 'en',
  target_language TEXT DEFAULT 'ru',
  total_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
- Stores user accounts and language preferences
- `total_minutes` tracks cumulative learning time
- RLS enabled: Users can only read/update their own row

**2. Progress Tracking**
```sql
CREATE TABLE language_levels (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mother_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  scenario_progress INTEGER DEFAULT 1,           -- Current scenario (1-30)
  scenario_dialogue_progress INTEGER DEFAULT 0,  -- Completed dialogues in current scenario
  word_progress INTEGER DEFAULT 0,               -- Total words learned
  mission_progress INTEGER DEFAULT 1,            -- Highest unlocked mission (1-150)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_language)
);
```
- One row per user per target language (supports learning multiple languages)
- `scenario_dialogue_progress`: 0-10 (reset to 0 when moving to next scenario)
- `mission_progress`: Tracks highest unlocked mission globally

**3. Mission Completions (Detailed History)**
```sql
CREATE TABLE mission_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scenario_number INTEGER CHECK (scenario_number BETWEEN 1 AND 30),
  mission_number INTEGER CHECK (mission_number BETWEEN 1 AND 5),
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  used_help BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, scenario_number, mission_number)
);
```
- Records every mission completion attempt
- `used_help`: If true, mission doesn't count toward unlocking next mission
- `UNIQUE` constraint: Only one completion record per mission (updates on retry)

**4. Dialogue Content (30 Tables)**
```sql
-- Example: scenario_1 (Social Greetings)
CREATE TABLE scenario_1 (
  id BIGSERIAL PRIMARY KEY,
  dialogue_id INTEGER NOT NULL,      -- Which dialogue (1-10)
  dialogue_step INTEGER NOT NULL,    -- Step within dialogue (1-15)
  
  -- Text in all 30 languages
  en_text TEXT,
  es_text TEXT,
  ru_text TEXT,
  fr_text TEXT,
  de_text TEXT,
  it_text TEXT,
  pt_text TEXT,
  ar_text TEXT,
  ch_text TEXT,
  ja_text TEXT,
  ko_text TEXT,
  hi_text TEXT,
  tr_text TEXT,
  pl_text TEXT,
  uk_text TEXT,
  nl_text TEXT,
  ro_text TEXT,
  el_text TEXT,
  cs_text TEXT,
  sv_text TEXT,
  hu_text TEXT,
  bn_text TEXT,
  ur_text TEXT,
  id_text TEXT,
  vi_text TEXT,
  th_text TEXT,
  ta_text TEXT,
  te_text TEXT,
  mr_text TEXT,
  sw_text TEXT
);

-- Repeated for scenario_2 through scenario_30
```
- 30 tables total (one per scenario)
- Each table: ~80 rows (10 dialogues × ~8 phrases each)
- No audio URLs stored (TTS generated on-demand)
- **Mission dialogues NOT stored** (AI-generated dynamically)

**5. Quiz Vocabulary Database**
```sql
CREATE TABLE quiz (
  id SERIAL PRIMARY KEY,
  english TEXT,
  spanish TEXT,
  russian TEXT,
  french TEXT,
  german TEXT,
  italian TEXT,
  portuguese TEXT,
  arabic TEXT,
  chinese TEXT,
  japanese TEXT,
  -- ... 20 more language columns
);
```
- Contains 1000 most common words in each language
- Used to match dialogue words against known vocabulary
- Query: `SELECT * FROM quiz WHERE spanish IN ('hola', 'gracias', 'por favor')`
- Returns words for quiz generation

**Database Size Estimates:**
- Users: ~100 bytes per user
- Language levels: ~200 bytes per user per language
- Mission completions: ~50 bytes per completion
- Scenario tables: ~80 rows × 30 languages × 100 bytes = ~240KB per scenario (7.2MB total)
- Quiz table: 1000 rows × 30 languages × 20 bytes = ~600KB

**Total estimated DB size for 10,000 users:** ~50MB (very lightweight)

### Data Flow

**Scenario Dialogue Playback (Pre-Scripted):**
```
User clicks dialogue → DialogueBox component → Supabase query
                                                    ↓
                                        Fetch from scenario_X table
                                                    ↓
Display phrase → TTS generation (Google Cloud) → Audio playback
     ↓                                                   ↓
Translation shown ← Cache check ← Gemini translation (if needed)
     ↓
Quiz triggered → Extract words → Match against quiz table → Present questions
     ↓
Score ≥60% → Update language_levels.scenario_dialogue_progress → Unlock next
```

**Mission Dialogue Flow (AI-Generated):**
```
User speaks/types → Speech recognition (if voice) → DialogueBox component
                                                            ↓
                                          missionNPC.ts service
                                                            ↓
                    Build prompt: goal + history + NPC role + target language
                                                            ↓
                            Netlify Function (gemini-dialogue.js)
                                                            ↓
                        AI Provider (Gemini/DeepSeek/Groq) with fallbacks
                                                            ↓
                Parse response: NPC text + MISSION_COMPLETE status
                                    ↓                       ↓
                Generate TTS audio                  If complete → Quiz
                                    ↓                       ↓
            Display with translation         Score ≥70% + no help used
                                    ↓                       ↓
                Add to conversation history    Update mission_completions
                                    ↓                       ↓
                User responds again...         Unlock next mission
```

## Application Flow (Frontend & Backend)

### Complete User Journey: First-Time User

**1. App Launch & Initialization**
```
Browser loads index.html → Vite loads React app → main.tsx renders <App />
                                                              ↓
App.tsx mounts → useEffect hooks trigger:
  - initializeModels() → Preload 30 character GLB models
  - Supabase auth check → getSession() (5 second timeout)
  - Mobile detection → useMobile() hook activates touch controls
                                                              ↓
TuriLoadingScreen component displays
  - Animated Turi logo with pulsing circles
  - "Loading Turi..." text with animated dots
  - Minimum 2 second display time
                                                              ↓
Auth check completes:
  - No session found → isLoading = false
  - Check localStorage for saved user → None found
  - needsLanguageSelection = true
                                                              ↓
TuriLoadingScreen fades out → Language selection screen appears
```

**2. Language Selection Flow**
```
HelperRobot (3D animated character) appears top-left
    ↓
LanguagePanel modal opens automatically (z-index: 100)
    ↓
User sees two-step selection:
  Step 1: "Select language you already know" (Mother Language)
    - 30 flag buttons (react-flag-kit components)
    - User clicks "English" → motherLanguage state updates
    ↓
  Step 2: "Select language you want to learn" (Target Language)
    - Same 30 flags, except mother language is disabled
    - User clicks "Spanish" → targetLanguage state updates
    ↓
Both selected → "Start Learning" button appears
    ↓
User clicks button:
  - setLanguages('en', 'es') → Zustand store updated
  - setIsLanguageSelected(true)
  - preloadTranslations() → Fetch UI translations for Spanish
  - LanguagePanel closes
    ↓
3D City Scene loads (CityScene component mounts)
```

**3. 3D City Scene Initialization**
```
CityScene.tsx renders:
    ↓
React Three Fiber <Canvas> initializes WebGL context
    ↓
Parallel loading:
  - CityModel.glb loads (city environment)
  - 30 Character models preload (character1.glb → character30.glb)
  - Supabase query: Fetch character positions from constants/characters.ts
    ↓
Player spawns at position (53, 1.7, 11)
  - First-person camera attached
  - Movement controls initialized (WASD + mouse look)
  - Mobile: Virtual joystick appears
    ↓
30 NPCs render at their positions:
  Character 1 (Alex) at (45, 0, 15) - "Social Greetings" scenario
  Character 2 (Maya) at (52, 0, 8) - "Casual Conversations"
  ... [28 more characters]
    ↓
HelperRobotInstructions appear (bottom-right):
  "Use WASD to walk around. Click on characters to talk!"
    ↓
User can now move and explore
```

**4. First NPC Interaction (Scenario Dialogue)**
```
User walks toward Character 1 (Alex)
    ↓
useFrame() hook calculates distance every frame:
  distance = √((playerX - npcX)² + (playerY - npcY)² + (playerZ - npcZ)²)
    ↓
When distance < 3.5 units:
  - Interaction prompt appears above NPC: "Press E to talk with Alex"
  - DirectionArrow component renders (green arrow pointing to NPC)
    ↓
User presses E or clicks NPC:
  - DialogueSelectionPanel opens (z-index: 50)
  - Movement disabled (setIsMovementDisabled(true))
  - Background blurred via CSS backdrop-filter
    ↓
Panel shows:
  - Character info: "Alex - Social Greetings"
  - "Scenario Dialogues" section (10 dialogues)
  - "Missions" section (5 missions, only Mission 1 unlocked)
    ↓
User clicks "Dialogue 1: First Meeting"
```

**5. Scenario Dialogue Playback Flow**
```
Frontend:
DialogueBox component opens (replaces selection panel)
  ↓
Fetch dialogue data:
  const { data } = await supabase
    .from('scenario_1')
    .select('*')
    .eq('dialogue_id', 1)
    .order('dialogue_step', 'asc');
  
  Returns ~8 phrases for this dialogue
    ↓
Display first phrase:
  - Target language text (top): "¡Hola! Me llamo Alex."
  - Translation (middle): "Hello! My name is Alex."
  - Transliteration (bottom): "OH-lah may YAH-moh Alex"
    ↓
Backend (TTS Generation):
  1. aiRouter.ts → routeTTSRequest({ text, language: 'es', characterId: 1 })
  2. Selects Google Cloud TTS (90% of time) or ElevenLabs (10%)
  3. Netlify Function (gemini-tts.js):
      - Looks up character voice: getCharacterVoice(1, 'male', 'es-ES')
      - Returns: "es-ES-Neural2-C"
      - Calls Google TTS API with server-side key
      - Returns base64 MP3 audio
  4. Audio decoded and cached in browser
  5. Audio plays through <audio> element
    ↓
User interactions available:
  - 🔊 Replay phrase
  - ⚙️ Adjust speed (0.5x, 1x, 2x)
  - 👁️ Hide/show target text (test comprehension)
  - Click any word → AI explains it
  - ⏭️ Next phrase
    ↓
User clicks through all 8 phrases
    ↓
Dialogue ends → Quiz triggered
```

**6. Quiz Flow**
```
VocalQuizComponent opens (overlays DialogueBox)
    ↓
Backend word extraction:
  scenarioQuiz.ts → fetchScenarioQuizWords(1, 1, 1, 'es', 'en')
    ↓
  1. Fetch all dialogue text in Spanish
  2. Extract words: ["hola", "llamo", "nombre", "gusto", "conocerte"]
  3. Query quiz table:
      SELECT * FROM quiz WHERE spanish IN ('hola', 'llamo', 'nombre', 'gusto', 'conocerte')
  4. Return 5 matched words with English translations
    ↓
Frontend displays quiz:
  Question 1/5: "hola"
  [🔊 Play audio]
  
  Options (shuffled):
  A) hello ✓
  B) goodbye
  C) thank you  
  D) please
    ↓
User selects A → isCorrect = true, score = 1/5
    ↓
Repeat for all 5 words
    ↓
Final score: 4/5 (80%) → PASS (≥60% required)
    ↓
Backend progress update:
  await supabase
    .from('language_levels')
    .update({ 
      scenario_dialogue_progress: 1,  // Unlocks Dialogue 2
      word_progress: currentWords + 5  // Add learned words
    })
    .eq('user_id', userId)
    .eq('target_language', 'es');
    ↓
Success message: "¡Bien hecho! Dialogue 2 unlocked!"
    ↓
DialogueBox closes → Back to DialogueSelectionPanel
  (Dialogue 2 now shows unlocked icon)
```

**7. First Mission Interaction (AI-Powered)**
```
User clicks "Mission 1: Find out the person's full name"
    ↓
DialogueBox opens in MISSION MODE
  - Shows mission goal at top
  - "Help Me" button visible (grammar assistance)
  - Text input + microphone button
  - Empty conversation history
    ↓
User clicks microphone icon 🎤
  - Web Speech API starts: recognition.start()
  - "Listening..." indicator pulses
  - User says: "Hola, ¿cómo te llamas?"
  - Speech recognition returns text
    ↓
Text appears in input field
  - Auto-translation shown below: "Hello, what's your name?"
  - "Send" button enabled
    ↓
User clicks Send
```

**8. Mission AI Conversation Flow**
```
Frontend → Backend:
  handleMissionNPCResponse(userText: "Hola, ¿cómo te llamas?")
    ↓
  missionNPC.ts → generateNPCResponse({
    targetLanguage: 'es',
    motherLanguage: 'en',
    missionGoal: "Find out the person's full name",
    npcRole: "a friendly person you just met",
    npcName: "Alex",
    npcGender: "male",
    conversationHistory: [],
    userLatestMessage: "Hola, ¿cómo te llamas?"
  });
    ↓
  aiRouter.ts → routeAIRequest({
    task: 'npc-response',
    prompt: `You are Alex (a friendly person, male). Reply in Spanish ONLY.
    
    Learner's goal (secret): "Find out the person's full name"
    
    Learner: "Hola, ¿cómo te llamas?"
    
    Reply with 1-2 SHORT sentences in Spanish.
    Then on new line: MISSION_COMPLETE: true or false.`
  });
    ↓
  Provider selection: Gemini 1.5 Flash (selected)
    ↓
  Netlify Function (gemini-proxy.js):
    POST to https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
    Headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY }
    ↓
  Gemini responds:
    "Me llamo Alex Rodríguez. ¿Y tú?
    MISSION_COMPLETE: true"
    ↓
  Response parsed:
    - npcResponse = "Me llamo Alex Rodríguez. ¿Y tú?"
    - missionCompleted = true (user got full name!)
    ↓
Backend → Frontend:
  Return { response, missionCompleted }
    ↓
Frontend parallel processing:
  Promise.all([
    translateWithAI(npcResponse, 'es', 'en'),  // "My name is Alex Rodriguez. And you?"
    generateTransliteration(npcResponse, 'es') // "may YAH-moh Alex ro-DREE-gess ee too"
  ]);
    ↓
  routeTTSRequest({ text: npcResponse, characterId: 1, gender: 'male' })
  → Google TTS generates audio → Plays
    ↓
Display NPC message in conversation:
  [NPC Avatar] Alex:
  "Me llamo Alex Rodríguez. ¿Y tú?"
  Translation: "My name is Alex Rodriguez. And you?"
  Transliteration: "may YAH-moh..."
    ↓
Mission complete detected!
  - Success animation plays
  - "Mission Complete! Now take the quiz." message
  - Quiz button appears
```

**9. Mission Quiz & Unlocking**
```
User clicks "Take Quiz"
    ↓
Extract words from conversation:
  - User said: "Hola, ¿cómo te llamas?"
  - NPC said: "Me llamo Alex Rodríguez. ¿Y tú?"
  - Combined words: ["hola", "cómo", "llamas", "llamo", "rodríguez"]
  - Match against quiz table → 4 words found
    ↓
Quiz displays 4 questions (70% threshold = 3/4 correct required)
    ↓
User completes quiz: 4/4 (100%) → PASS
    ↓
Backend checks mission completion criteria:
  if (score >= 70 && !usedHelpButton) {
    // Record completion
    await supabase.from('mission_completions').upsert({
      user_id: userId,
      scenario_number: 1,
      mission_number: 1,
      score: 100,
      used_help: false,
      completed_at: new Date()
    });
    
    // Unlock next mission
    await supabase.from('language_levels').update({
      mission_progress: 2  // Unlock Mission 2
    });
  }
    ↓
Success screen:
  "🎉 Mission 1 Complete! Mission 2 Unlocked"
  - Stats: 100% quiz, No help used
  - +50 XP, +4 words learned
    ↓
Return to MissionSelectionPanel
  - Mission 1: ✓ Complete (green checkmark)
  - Mission 2: 🔓 Unlocked (clickable)
  - Mission 3-5: 🔒 Locked (grayed out)
```

**10. Helper Robot Panel Flow (Progress Tracking)**
```
User clicks HelperRobot (Turi) in top-left corner
    ↓
HelperRobotPanel opens (center screen, z-index: 40)
    ↓
Fetch user progress:
  const { data } = await supabase
    .from('language_levels')
    .select('*')
    .eq('user_id', userId)
    .eq('target_language', 'es')
    .single();
    ↓
Display progress visualization:
  - Scenario Progress: 1/30 (3%)
  - Dialogues Completed: 1/10 in current scenario
  - Missions Completed: 1/150 (0.7%)
  - Words Learned: 9 words
  - Time Spent: 12 minutes
  - Learning Streak: 1 day
    ↓
Tabs available:
  - Progress: Current stats
  - Achievements: Badges earned
  - Settings: Change languages, audio settings
  - Logout: End session
```

### Component Interaction Diagram

```
App.tsx (Root)
├── TuriLoadingScreen (initial load)
├── LoginForm (authentication)
├── HelperRobot (always visible)
│   └── Opens: HelperRobotPanel
│       └── Shows: ProgressVisualization
├── CityScene (Three.js)
│   ├── CityModel.glb
│   ├── Player (camera + controls)
│   │   ├── WASD movement (desktop)
│   │   └── MobileControls (touch devices)
│   ├── Character × 30 (NPCs)
│   │   └── DirectionArrow (when near)
│   └── Triggers: DialogueSelectionPanel
├── DialogueSelectionPanel
│   ├── Shows: Available dialogues & missions
│   └── Opens: DialogueBox
├── DialogueBox (Scenario Mode)
│   ├── Displays: Phrase text + translation
│   ├── Plays: TTS audio
│   ├── WordHoverActions (click words for definitions)
│   └── Triggers: VocalQuizComponent
├── DialogueBox (Mission Mode)
│   ├── Voice input (Web Speech API)
│   ├── Text input
│   ├── Conversation history
│   ├── "Help Me" button → Shows corrections
│   └── Triggers: VocalQuizComponent
└── VocalQuizComponent
    ├── Displays: Multiple choice questions
    ├── Plays: Word audio (Turi voice)
    └── Completes: Updates progress → Unlocks content
```

### State Management Flow (Zustand)

```typescript
// Global state updates trigger component re-renders

User action → Component → Store action → State updates → Components re-render

Examples:
1. Language selection:
   LanguageSelector → setLanguages('en', 'es') → motherLanguage/targetLanguage update
                   → App re-renders with city scene

2. Dialogue opens:
   Character click → setIsDialogueOpen(true) → isDialogueOpen = true
                  → DialogueBox renders, Player movement disabled

3. Mission mode:
   Mission click → setMissionMode(true) → isMissionMode = true
                → DialogueBox switches to mission UI

4. Quiz active:
   Quiz starts → setIsQuizActive(true) → isQuizActive = true
              → HelperRobotInstructions show quiz tips
```

### Error Handling Flow

```
API Call Fails
    ↓
try/catch in service layer
    ↓
Log error: logger.error('AI request failed', { error, context })
    ↓
Check if fallback available:
  - AI providers → Try next provider
  - TTS → Show text-only mode
  - Translation → Use cached translation
  - Database → Use localStorage backup
    ↓
If all fallbacks fail:
  - Show user-friendly error message
  - Offer retry button
  - Don't crash app
    ↓
User clicks retry → Attempt request again
```

## Content Structure

### 30 Scenarios with Dual Learning Paths
Each of the 30 scenarios provides two complementary learning experiences:

**Path 1: Scenario Dialogues (Pre-Scripted)**
- 10 dialogues per scenario = **300 total dialogues**
- Professionally written, translated to 30 languages
- Stored in CSV format → imported to database tables `scenario_1` through `scenario_30`
- Each dialogue: 5-15 sequential phrases with translations and audio
- Focus: Vocabulary acquisition and pattern recognition

**Path 2: Mission Dialogues (AI-Generated)**
- 5 missions per scenario = **150 total missions**
- Dynamic, goal-oriented conversations
- AI generates responses on-demand based on user input
- No pre-written content (infinite conversational possibilities)
- Focus: Active production and real-world communication

**Thematic Progression:**
```
Scenario 1: Social Greetings
  ├── 10 scripted dialogues (listening practice)
  └── 5 missions (speaking practice)
      - Mission 1: Get person's name
      - Mission 2: Find out where they're from
      - Mission 3: Learn their occupation
      - Mission 4: Discover their hobby
      - Mission 5: Exchange phone numbers

Scenario 9: Shopping
  ├── 10 scripted dialogues
  └── 5 missions
      - Mission 3: Negotiate a discount ← AI dynamically responds

Scenario 30: Farewells
  ├── 10 scripted dialogues
  └── 5 missions
      - Mission 5: Say proper goodbye
```

## AI Integration

### Multi-Provider Strategy
**Primary:** Google Gemini (1.5 Flash/Pro) - fast, reliable, multilingual  
**Secondary:** DeepSeek (cost-effective alternative)  
**Tertiary:** Groq (high-speed inference fallback)  

### AI Tasks
1. **NPC Conversation Generation** - Context-aware responses that track mission completion
2. **Translation** - Source ↔ Target with transliteration for non-Latin scripts
3. **Word Explanations** - Contextual definitions in user's mother language
4. **Expression Extraction** - Identify common phrases from dialogue text
5. **Grammar Checking** - "Help Me" feature for sentence correction

### Safety & Rate Limiting
- Client-side rate limiting (1 req/sec for translation, 1 req/2sec for AI dialogue)
- API key protection via Netlify Functions
- Configurable safety thresholds for content filtering
- Exponential backoff on provider failures

## Development & Deployment

### Local Development
```bash
npm install
npm run dev          # Start Vite dev server (localhost:5173)
```

### Production Build
```bash
npm run build        # Builds to /dist
```

### Mobile Build
```bash
npm run build:mobile      # Production build for Capacitor
npm run mobile:sync       # Sync web assets to Android
npm run mobile:run        # Run on Android device/emulator
```

### Deployment (Netlify)
- Automatic deploys from `main` branch
- Environment variables configured in Netlify dashboard
- Serverless functions deployed automatically
- SPA routing via `netlify.toml` redirects

### Environment Variables Required
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
GOOGLE_CLOUD_API_KEY=           # For TTS
GEMINI_API_KEY=                 # For AI conversations
DEEPSEEK_API_KEY=               # (Optional) fallback provider
GROQ_API_KEY=                   # (Optional) fallback provider
ELEVENLABS_API_KEY=             # (Optional) premium TTS
```

## Security Features

1. **API Key Protection**: All AI provider keys stored server-side in Netlify Functions
2. **Row Level Security**: Supabase RLS policies ensure users only access their own data
3. **Anonymous Mode**: Allows usage without authentication (local storage fallback)
4. **Content Safety**: Configurable AI safety filters for inappropriate content
5. **HTTPS Only**: Enforced via Netlify and Capacitor Android config

## Performance Optimizations

- **Translation Caching**: Client-side IndexedDB cache reduces redundant API calls
- **Model Preloading**: All 30 character GLB models preloaded on app init
- **Audio Caching**: TTS responses cached to avoid regeneration
- **Lazy Loading**: Dialogue data fetched on-demand per scenario
- **Parallel AI Requests**: Translation and transliteration run concurrently
- **CDN Delivery**: Static assets served via Netlify Edge network

## Browser/Platform Support

- **Web**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile**: Android 7.0+ (via Capacitor)
- **iOS**: Supported via Capacitor (build configuration present)
- **WebGL Required**: For 3D rendering

## Known Limitations

- Mission AI requires stable internet connection
- Voice recognition accuracy varies by accent/microphone quality
- Some languages have fewer TTS voice options (3-4 vs 13+ for English)
- 3D scene performance dependent on GPU (mobile devices may experience frame drops)

## Project Structure

```
Turi-Beta/
├── src/
│   ├── components/          # React components (dialogue, panels, UI)
│   ├── scenes/              # Three.js 3D scenes (City, Character, HelperRobot)
│   ├── services/            # Business logic (AI, auth, progress tracking)
│   ├── config/              # Configuration (AI providers, security)
│   ├── constants/           # Static data (characters, scenarios, languages, voices)
│   ├── hooks/               # React hooks (useMobile, useTranslations)
│   ├── store/               # Zustand state management
│   ├── types/               # TypeScript interfaces
│   └── data/csv/            # Dialogue content (300 CSV files)
├── netlify/functions/       # Serverless API endpoints
├── public/models/           # 3D assets (city.glb + 30 character models)
├── android/                 # Capacitor Android project
└── dist/                    # Production build output
```

## License

[Add your license information here]

## Credits

Built with React, Three.js, Supabase, and Google AI.

