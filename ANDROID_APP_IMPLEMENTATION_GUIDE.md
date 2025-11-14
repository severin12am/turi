# Android Language Learning App - Complete Implementation Instructions

## 📋 IMPORTANT: Instructions for AI/Developer

**READ THIS FIRST:**

### Code Quality Requirements
1. **Use SIMPLE, ROBUST, and MODULAR code**
   - Each component should have a single responsibility
   - Functions should be small and focused
   - Use clear variable and function names
   - Avoid over-engineering or complex patterns
   - Prefer composition over inheritance

2. **Explain ALL code changes**
   - Add comments explaining WHY, not just WHAT
   - Document any non-obvious logic
   - Explain design decisions
   - Write clear commit messages

3. **Follow these instructions EXACTLY**
   - Do NOT come up with new ideas or features
   - Do NOT deviate from the specified architecture
   - Do NOT add features not mentioned here
   - If something is unclear, ask - don't assume

4. **Testing and Validation**
   - Test each component individually before integration
   - Verify database connections work before proceeding
   - Check all API calls return expected data
   - Validate user flows end-to-end

---

## 📱 App Overview

**Turi Mobile** - A scenario-based language learning app where users practice conversations through 30 progressive scenarios. Each scenario contains multiple dialogues with advanced features like speed control, text visibility modes, and voice recognition quizzes.

### Core Concept
- **NO 3D map** - Simple list-based navigation
- **NO phrases_X tables** - Only scenario_X tables (1-30)
- **NO words_quiz table** - Use quiz table for vocabulary
- **Android ONLY** - No iOS implementation needed

---

## 🎯 Complete Feature Set

### 1. Language Selection Screen
**Purpose:** User selects mother language and target language on first launch

**Features:**
- Dropdown/picker for mother language (what user speaks)
- Dropdown/picker for target language (what user wants to learn)
- Supported languages: English, Russian, Spanish, French, German, Italian, Arabic, Chinese, Japanese, Turkish
- Save selection to local storage
- "Start Learning" button to proceed

### 2. Scenario List Screen (Home)
**Purpose:** Shows all 30 scenarios with progress tracking

**Features:**
- Scrollable list of 30 scenarios
- Each scenario card shows:
  - Scenario number (1-30)
  - Scenario title (e.g., "Greetings and Introductions")
  - Progress: X/Y dialogues completed
  - Lock icon 🔒 if locked, checkmark ✅ if complete, play ▶️ if available
- **Unlocking Logic:**
  - Scenario 1 always unlocked
  - Scenario N unlocks after completing ALL dialogues in Scenario N-1
- Pull-to-refresh to sync progress from cloud
- Tap scenario to view dialogue list

### 3. Dialogue List Screen
**Purpose:** Shows all dialogues within selected scenario

**Features:**
- Back button to return to scenario list
- Scenario title at top
- List of dialogues (typically 5-10 per scenario)
- Each dialogue card shows:
  - Dialogue number
  - Lock 🔒 / Available ▶️ / Complete ✅ status
  - Brief description (optional)
- **Unlocking Logic:**
  - Dialogue 1 in scenario always unlocked
  - Dialogue N unlocks after completing Dialogue N-1
- Tap dialogue to start

### 4. Dialogue Screen (Most Complex)
**Purpose:** Interactive conversation practice

**Core Flow:**
1. NPC speaks first (auto-plays with TTS)
2. User's turn - must speak the phrase
3. Speech recognition validates
4. Alternates NPC → User → NPC → User
5. Records all user audio
6. After final phrase, show completion screen

**Features:**

#### A. Text Visibility Modes (6 modes, cycle with button)
- **📖 All** - Phrase + Transcription + Translation (default)
- **📝 P+T** - Phrase + Transcription only
- **🔤 P+Tr** - Phrase + Translation only  
- **👁️ P** - Phrase only (target language)
- **🌍 Tr** - Translation only (mother language)
- **🙈 Hide** - Nothing visible (REQUIRED to unlock quiz)

**Implementation:**
```kotlin
enum class VisibilityMode {
    ALL,           // Show all three lines
    PHRASE_TRANS,  // Show phrase + transcription
    PHRASE_TRANSL, // Show phrase + translation
    PHRASE_ONLY,   // Show only target language phrase
    TRANSLATION_ONLY, // Show only mother language translation
    NONE           // Show nothing (hide mode - required for quiz)
}
```

**Rendering Logic:**
- Always show dialogue box structure (don't hide boxes)
- Conditionally render text content based on mode
- Keep all buttons (replay, continue) visible
- In Hide mode: Show empty box with hint "Speak from memory"

#### B. Playback Speed Control (6 speeds, cycle with button)
- **0.6x 🐢** - Very slow (beginners)
- **0.8x 🚶** - Slow
- **1.0x ▶️** - Normal (default)
- **1.2x 🏃** - Fast
- **1.4x ⚡** - Very fast
- **2.0x 🚀** - Maximum speed

**Apply to:**
- NPC Text-to-Speech (`.setSpeechRate()`)
- User recording playback (`.setPlaybackParams()`)
- Full dialogue replay

#### C. Replay Features
1. **Individual Phrase Replay:**
   - 🔊 button on NPC phrases (replays TTS)
   - 🎙️ button on completed user phrases (replays recording)
   - Respects current speed setting

2. **Full Dialogue Replay** (after completion):
   - Button: "🎭 Replay Full Dialogue"
   - Plays entire conversation sequentially
   - Alternates NPC TTS and user recordings
   - 500ms pause between speakers
   - Uses current speed setting
   - Can stop mid-playback

#### D. Hide Mode Requirement (CRITICAL)
**Rule:** User MUST complete dialogue in 🙈 Hide mode to unlock quiz

**Implementation:**
```kotlin
var completedInHideMode by mutableStateOf(false)

// When dialogue completes (final phrase spoken):
if (visibilityMode == VisibilityMode.NONE) {
    completedInHideMode = true
    // Enable "Continue to Quiz" button
} else {
    completedInHideMode = false
    // Show warning message
}
```

**UI States:**
- **If NOT completed in Hide mode:**
  - Show warning: "⚠️ Complete in Hide mode (🙈) to proceed"
  - Show instruction box:
    ```
    📚 Memory Challenge Required!
    1. Click visibility button → switch to 🙈 Hide mode
    2. Click reset button to restart dialogue
    3. Complete entire dialogue from memory!
    ```
  - Disable "Continue to Quiz" button (grayed out)
  - Button text: "🔒 Complete in Hide Mode First"

- **If completed in Hide mode:**
  - Show success: "🎉 Great job! You've completed the dialogue!"
  - Enable "Continue to Quiz" button (green)
  - Button text: "Continue to Quiz →"

#### E. Dialogue Box Structure
Each dialogue entry shows (based on visibility mode):
```
┌─────────────────────────────────┐
│ 🤖 NPC (or 👤 You)              │
├─────────────────────────────────┤
│ Target Language Phrase          │ ← Shown unless mode is NONE or TRANSLATION_ONLY
│ [Transcription in mother alphabet] │ ← Shown only in ALL or PHRASE_TRANS
│ Mother Language Translation     │ ← Shown only in ALL, PHRASE_TRANSL, or TRANSLATION_ONLY
├─────────────────────────────────┤
│ [🔊 Replay] [🎙️ Record]         │ ← Always visible
└─────────────────────────────────┘
```

#### F. Speech Recognition Flow
1. User taps microphone button or auto-starts on user turn
2. Show listening indicator 🎤
3. Capture audio with Android SpeechRecognizer
4. Compare recognized text with expected phrase
5. Calculate similarity score (allow minor variations)
6. If match ≥ 70%, mark as complete and proceed
7. If < 70%, show try again message
8. Allow manual skip (for testing/accessibility)

#### G. Audio Recording
- Record user's voice for each phrase using MediaRecorder
- Store as Blob/ByteArray in memory
- Save to local cache
- Use for replay features
- Clear on app restart (optional: save to cloud)

### 5. Quiz Screen
**Purpose:** Test vocabulary from completed dialogue

**Flow:**
1. Extract all words from dialogue text (target language)
2. Query quiz table: `SELECT * FROM quiz WHERE [target_language] IN (extracted_words) LIMIT 5`
3. Show 0-5 matching words
4. User must pronounce each word (speech recognition)
5. Calculate score: (correct/total) × 100
6. Pass if score ≥ 60%
7. If 0 words matched: auto-complete with 100% score

**Features:**
- Question counter: "Question 1/5"
- Show word in mother language
- User speaks word in target language
- Visual feedback: ✅ correct, ❌ incorrect
- Final score display
- Retry button if failed
- Continue button if passed

**Special Case: 0 Words Matched**
```
┌─────────────────────────────────┐
│ 🎉 Great job!                   │
│                                 │
│ This dialogue completed         │
│ successfully!                   │
│                                 │
│ (No common words available      │
│  for quiz)                      │
│                                 │
│ Score: 100%                     │
│                                 │
│ [Continue →]                    │
└─────────────────────────────────┘
```

### 6. Progress Tracking
**Purpose:** Save completion state and unlock next content

**When quiz passes (≥60% or auto-complete):**
1. Update `language_levels` table:
   - `scenario_progress` = current scenario number
   - `scenario_dialogue_progress` = MAX(current dialogue_id, existing value)
   - `word_progress` += count of words in quiz
2. Unlock next dialogue (if exists)
3. If all dialogues in scenario complete: unlock next scenario
4. Show success message
5. Return to dialogue list screen

**Progress Persistence:**
- Primary: Supabase cloud database
- Fallback: Local SharedPreferences (offline support)
- Sync on app launch and after each completion

---

## 🗄️ Database Structure (Supabase)

### Required Tables

#### 1. `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `language_levels`
```sql
CREATE TABLE language_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mother_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  scenario_progress INTEGER DEFAULT 1,
  scenario_dialogue_progress INTEGER DEFAULT 0,
  word_progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_language)
);

-- Create index for faster queries
CREATE INDEX idx_language_levels_user_id ON language_levels(user_id);
CREATE INDEX idx_language_levels_target_lang ON language_levels(target_language);
```

#### 3. `scenario_1` through `scenario_30` (30 tables)
```sql
-- Template (repeat for scenario_1, scenario_2, ..., scenario_30)
CREATE TABLE scenario_1 (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  dialogue_id INTEGER NOT NULL,
  dialogue_step INTEGER NOT NULL,
  speaker TEXT NOT NULL CHECK (speaker IN ('NPC', 'User')),
  
  -- English
  en_text TEXT,
  en_text_ru TEXT, -- English in Cyrillic for Russian speakers
  
  -- Russian
  ru_text TEXT,
  ru_text_en TEXT, -- Russian in Latin for non-Russian speakers
  
  -- Spanish
  es_text TEXT,
  es_text_ru TEXT, -- Spanish in Cyrillic
  
  -- French
  fr_text TEXT,
  fr_text_ru TEXT,
  
  -- German
  de_text TEXT,
  de_text_ru TEXT,
  
  -- Italian
  it_text TEXT,
  it_text_ru TEXT,
  
  -- Arabic
  ar_text TEXT,
  ar_text_ru TEXT,
  
  -- Chinese
  ch_text TEXT,
  ch_text_ru TEXT,
  
  -- Japanese
  ja_text TEXT,
  ja_text_ru TEXT,
  
  -- Turkish
  tr_text TEXT,
  tr_text_ru TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_scenario_1_dialogue_id ON scenario_1(dialogue_id);
CREATE INDEX idx_scenario_1_dialogue_step ON scenario_1(dialogue_step);

-- Example data for scenario_1:
INSERT INTO scenario_1 (dialogue_id, dialogue_step, speaker, en_text, en_text_ru, ru_text, ru_text_en, es_text, es_text_ru)
VALUES 
  (1, 1, 'NPC', 'Hello! How are you?', 'Хэллоу! Хау ар ю?', 'Привет! Как дела?', 'Privet! Kak dela?', '¡Hola! ¿Cómo estás?', 'Ола! Комо эстас?'),
  (1, 2, 'User', 'I''m fine, thank you!', 'Айм файн, сэнк ю!', 'Хорошо, спасибо!', 'Horosho, spasibo!', '¡Bien, gracias!', 'Бьен, грасиас!'),
  (1, 3, 'NPC', 'What''s your name?', 'Уотс ёр нэйм?', 'Как тебя зовут?', 'Kak tebya zovut?', '¿Cómo te llamas?', 'Комо те ямас?'),
  (1, 4, 'User', 'My name is Anna.', 'Май нэйм из Анна.', 'Меня зовут Анна.', 'Menya zovut Anna.', 'Me llamo Anna.', 'Ме ямо Анна.');
```

**IMPORTANT:** You must create all 30 tables: `scenario_1`, `scenario_2`, ... `scenario_30`

#### 4. `quiz` (Common Words Table)
```sql
CREATE TABLE quiz (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  english TEXT,
  russian TEXT,
  spanish TEXT,
  french TEXT,
  german TEXT,
  italian TEXT,
  portuguese TEXT,
  arabic TEXT,
  chinese TEXT,
  japanese TEXT,
  turkish TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_quiz_english ON quiz(english);
CREATE INDEX idx_quiz_russian ON quiz(russian);
CREATE INDEX idx_quiz_spanish ON quiz(spanish);
CREATE INDEX idx_quiz_french ON quiz(french);
CREATE INDEX idx_quiz_german ON quiz(german);
CREATE INDEX idx_quiz_italian ON quiz(italian);
CREATE INDEX idx_quiz_arabic ON quiz(arabic);
CREATE INDEX idx_quiz_chinese ON quiz(chinese);
CREATE INDEX idx_quiz_japanese ON quiz(japanese);
CREATE INDEX idx_quiz_turkish ON quiz(turkish);

-- Example common words:
INSERT INTO quiz (english, russian, spanish, french, german, italian, arabic, chinese, japanese, turkish)
VALUES 
  ('hello', 'привет', 'hola', 'bonjour', 'hallo', 'ciao', 'مرحبا', '你好', 'こんにちは', 'merhaba'),
  ('goodbye', 'пока', 'adiós', 'au revoir', 'tschüss', 'ciao', 'وداعا', '再见', 'さようなら', 'hoşça kal'),
  ('thank you', 'спасибо', 'gracias', 'merci', 'danke', 'grazie', 'شكرا', '谢谢', 'ありがとう', 'teşekkür ederim'),
  ('yes', 'да', 'sí', 'oui', 'ja', 'sì', 'نعم', '是', 'はい', 'evet'),
  ('no', 'нет', 'no', 'non', 'nein', 'no', 'لا', '不', 'いいえ', 'hayır');

-- NOTE: Populate this table with 1000+ common words for best quiz quality
```

---

## 🔑 API Keys & Environment Configuration

### 1. Supabase Setup
1. Go to https://supabase.com
2. Create free account
3. Create new project
4. Go to Settings → API
5. Copy:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon/Public Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. Android Configuration
Create `local.properties` file (NOT committed to git):
```properties
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

Or use BuildConfig:
```kotlin
// In build.gradle
android {
    defaultConfig {
        buildConfigField "String", "SUPABASE_URL", "\"https://your-project.supabase.co\""
        buildConfigField "String", "SUPABASE_KEY", "\"your_anon_key_here\""
    }
}

// In code
val supabaseUrl = BuildConfig.SUPABASE_URL
val supabaseKey = BuildConfig.SUPABASE_KEY
```

### 3. Optional: Google Gemini API (for enhanced TTS)
- Get from: https://ai.google.dev/aistudio
- Add to BuildConfig or local.properties
- NOT required for MVP

---

## 📱 Android App Implementation

### Technology Stack
- **Language:** Kotlin
- **UI Framework:** Jetpack Compose
- **Architecture:** MVVM (Model-View-ViewModel)
- **Database:** Supabase Kotlin Client
- **Navigation:** Compose Navigation
- **Dependency Injection:** Manual (keep it simple)
- **Speech:** Android Speech Recognition API
- **Audio:** MediaRecorder, MediaPlayer, TextToSpeech

### Dependencies (build.gradle)

#### Project-level build.gradle
```gradle
buildscript {
    ext {
        compose_version = '1.5.4'
        kotlin_version = '1.9.10'
    }
    dependencies {
        classpath "com.android.tools.build:gradle:8.1.0"
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}
```

#### App-level build.gradle
```gradle
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
    id 'org.jetbrains.kotlin.plugin.serialization' version '1.9.10'
}

android {
    namespace 'com.turi.language'
    compileSdk 34

    defaultConfig {
        applicationId "com.turi.language"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary true
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = '17'
    }

    buildFeatures {
        compose true
        buildConfig true
    }

    composeOptions {
        kotlinCompilerExtensionVersion '1.5.3'
    }

    packaging {
        resources {
            excludes += '/META-INF/{AL2.0,LGPL2.1}'
        }
    }
}

dependencies {
    // Kotlin
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.lifecycle:lifecycle-runtime-ktx:2.6.2'

    // Compose
    implementation "androidx.compose.ui:ui:1.5.4"
    implementation "androidx.compose.material3:material3:1.1.2"
    implementation "androidx.compose.ui:ui-tooling-preview:1.5.4"
    implementation "androidx.lifecycle:lifecycle-viewmodel-compose:2.6.2"
    implementation "androidx.lifecycle:lifecycle-runtime-compose:2.6.2"
    implementation 'androidx.activity:activity-compose:1.8.0'
    
    // Navigation
    implementation "androidx.navigation:navigation-compose:2.7.5"
    
    // Supabase
    implementation 'io.github.jan-tennert.supabase:postgrest-kt:1.4.7'
    implementation 'io.github.jan-tennert.supabase:realtime-kt:1.4.7'
    implementation 'io.ktor:ktor-client-android:2.3.5'
    implementation 'io.ktor:ktor-client-core:2.3.5'
    implementation 'io.ktor:ktor-utils:2.3.5'
    
    // Serialization
    implementation 'org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0'
    
    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3'
    
    // DataStore (for preferences)
    implementation "androidx.datastore:datastore-preferences:1.0.0"
    
    // Testing
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
    androidTestImplementation "androidx.compose.ui:ui-test-junit4:1.5.4"
    debugImplementation "androidx.compose.ui:ui-tooling:1.5.4"
    debugImplementation "androidx.compose.ui:ui-test-manifest:1.5.4"
}
```

### Project Structure (Modular Architecture)
```
app/src/main/java/com/turi/language/
├── MainActivity.kt                    # Entry point
├── TuriApp.kt                        # Main Compose app with navigation
│
├── data/                             # Data layer
│   ├── models/                       # Data classes
│   │   ├── User.kt
│   │   ├── LanguageLevel.kt
│   │   ├── DialoguePhrase.kt
│   │   ├── QuizWord.kt
│   │   └── Language.kt
│   │
│   ├── repository/                   # Data sources
│   │   ├── SupabaseClient.kt        # Supabase configuration
│   │   ├── UserRepository.kt        # User CRUD operations
│   │   ├── LanguageLevelRepository.kt
│   │   ├── ScenarioRepository.kt    # Fetch dialogues
│   │   └── QuizRepository.kt        # Quiz word matching
│   │
│   └── local/                        # Local storage
│       ├── PreferencesManager.kt    # SharedPreferences wrapper
│       └── LocalProgress.kt         # Offline progress cache
│
├── domain/                           # Business logic
│   ├── usecase/                      # Use cases
│   │   ├── GetScenariosUseCase.kt
│   │   ├── CompleteDialogueUseCase.kt
│   │   └── CalculateQuizScoreUseCase.kt
│   │
│   └── util/                         # Utilities
│       ├── WordExtractor.kt         # Extract words from text
│       ├── SimilarityCalculator.kt  # Compare spoken vs expected
│       └── LanguageMapper.kt        # Map language codes
│
├── ui/                               # Presentation layer
│   ├── screens/                      # Screen composables
│   │   ├── LanguageSelectionScreen.kt
│   │   ├── ScenarioListScreen.kt
│   │   ├── DialogueListScreen.kt
│   │   ├── DialogueScreen.kt
│   │   └── QuizScreen.kt
│   │
│   ├── components/                   # Reusable components
│   │   ├── ScenarioCard.kt
│   │   ├── DialogueCard.kt
│   │   ├── DialogueBox.kt
│   │   ├── VisibilityButton.kt
│   │   ├── SpeedButton.kt
│   │   ├── LoadingIndicator.kt
│   │   └── ErrorMessage.kt
│   │
│   ├── theme/                        # Theming
│   │   ├── Theme.kt
│   │   ├── Color.kt
│   │   └── Type.kt
│   │
│   └── navigation/                   # Navigation
│       ├── NavGraph.kt
│       └── Screen.kt                # Screen routes
│
├── viewmodel/                        # ViewModels
│   ├── LanguageSelectionViewModel.kt
│   ├── ScenarioListViewModel.kt
│   ├── DialogueViewModel.kt
│   └── QuizViewModel.kt
│
└── service/                          # Android services
    ├── SpeechRecognitionService.kt  # Speech-to-text
    ├── TextToSpeechService.kt       # Text-to-speech
    └── AudioRecordingService.kt     # Record user audio
```

---

## 📄 Complete Code Implementation

### 1. Data Models

**DialoguePhrase.kt**
```kotlin
package com.turi.language.data.models

import kotlinx.serialization.Serializable

/**
 * Represents a single phrase in a dialogue
 * Contains text in all supported languages
 */
@Serializable
data class DialoguePhrase(
    val id: Long,
    val dialogue_id: Int,
    val dialogue_step: Int,
    val speaker: String, // "NPC" or "User"
    
    // Language texts and transcriptions
    val en_text: String? = null,
    val en_text_ru: String? = null, // English in Cyrillic
    val ru_text: String? = null,
    val ru_text_en: String? = null, // Russian in Latin
    val es_text: String? = null,
    val es_text_ru: String? = null,
    val fr_text: String? = null,
    val fr_text_ru: String? = null,
    val de_text: String? = null,
    val de_text_ru: String? = null,
    val it_text: String? = null,
    val it_text_ru: String? = null,
    val ar_text: String? = null,
    val ar_text_ru: String? = null,
    val ch_text: String? = null,
    val ch_text_ru: String? = null,
    val ja_text: String? = null,
    val ja_text_ru: String? = null,
    val tr_text: String? = null,
    val tr_text_ru: String? = null
) {
    /**
     * Get text in specified language
     * @param langCode: Language code (en, ru, es, etc.)
     * @return Text in that language or empty string
     */
    fun getText(langCode: String): String {
        return when(langCode.lowercase()) {
            "en" -> en_text
            "ru" -> ru_text
            "es" -> es_text
            "fr" -> fr_text
            "de" -> de_text
            "it" -> it_text
            "ar" -> ar_text
            "ch" -> ch_text
            "ja" -> ja_text
            "tr" -> tr_text
            else -> null
        } ?: ""
    }
    
    /**
     * Get pronunciation transcription for specified language
     * Transcription is in the reader's native alphabet
     * @param langCode: Target language code
     * @param readerLanguage: Reader's native language (for alphabet choice)
     * @return Transcription string
     */
    fun getTranscription(langCode: String, readerLanguage: String = "ru"): String {
        // For Russian speakers reading other languages, use _ru suffix
        // For non-Russian speakers reading Russian, use _en suffix
        return when {
            langCode == "ru" && readerLanguage != "ru" -> ru_text_en
            langCode != "ru" && readerLanguage == "ru" -> when(langCode) {
                "en" -> en_text_ru
                "es" -> es_text_ru
                "fr" -> fr_text_ru
                "de" -> de_text_ru
                "it" -> it_text_ru
                "ar" -> ar_text_ru
                "ch" -> ch_text_ru
                "ja" -> ja_text_ru
                "tr" -> tr_text_ru
                else -> null
            }
            else -> null
        } ?: ""
    }
}
```

**LanguageLevel.kt**
```kotlin
package com.turi.language.data.models

import kotlinx.serialization.Serializable

/**
 * Tracks user's progress for a specific target language
 */
@Serializable
data class LanguageLevel(
    val id: String,
    val user_id: String,
    val mother_language: String,
    val target_language: String,
    val scenario_progress: Int = 1,           // Current scenario (1-30)
    val scenario_dialogue_progress: Int = 0,  // Highest dialogue completed
    val word_progress: Int = 0                // Total words learned
)
```

**QuizWord.kt**
```kotlin
package com.turi.language.data.models

import kotlinx.serialization.Serializable

/**
 * Represents a word in the quiz database
 */
@Serializable
data class QuizWord(
    val id: Long,
    val english: String? = null,
    val russian: String? = null,
    val spanish: String? = null,
    val french: String? = null,
    val german: String? = null,
    val italian: String? = null,
    val portuguese: String? = null,
    val arabic: String? = null,
    val chinese: String? = null,
    val japanese: String? = null,
    val turkish: String? = null
) {
    /**
     * Get word in specified language
     */
    fun getWord(langCode: String): String {
        return when(langCode.lowercase()) {
            "en" -> english
            "ru" -> russian
            "es" -> spanish
            "fr" -> french
            "de" -> german
            "it" -> italian
            "pt" -> portuguese
            "ar" -> arabic
            "ch" -> chinese
            "ja" -> japanese
            "tr" -> turkish
            else -> null
        } ?: ""
    }
}
```

**Language.kt**
```kotlin
package com.turi.language.data.models

/**
 * Supported languages
 */
data class Language(
    val code: String,
    val nameInEnglish: String,
    val nameInNative: String
)

/**
 * List of all supported languages
 */
object SupportedLanguages {
    val all = listOf(
        Language("en", "English", "English"),
        Language("ru", "Russian", "Русский"),
        Language("es", "Spanish", "Español"),
        Language("fr", "French", "Français"),
        Language("de", "German", "Deutsch"),
        Language("it", "Italian", "Italiano"),
        Language("ar", "Arabic", "العربية"),
        Language("ch", "Chinese", "中文"),
        Language("ja", "Japanese", "日本語"),
        Language("tr", "Turkish", "Türkçe")
    )
    
    fun getByCode(code: String): Language? {
        return all.find { it.code == code }
    }
}
```

### 2. Supabase Client

**SupabaseClient.kt**
```kotlin
package com.turi.language.data.repository

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest

/**
 * Singleton Supabase client
 * Configured with project URL and API key
 */
object SupabaseClientManager {
    
    // IMPORTANT: Replace these with your actual Supabase credentials
    private const val SUPABASE_URL = "https://your-project.supabase.co"
    private const val SUPABASE_KEY = "your_anon_key_here"
    
    val client: SupabaseClient by lazy {
        createSupabaseClient(
            supabaseUrl = SUPABASE_URL,
            supabaseKey = SUPABASE_KEY
        ) {
            install(Postgrest)
        }
    }
}
```

### 3. Repository Layer

**ScenarioRepository.kt**
```kotlin
package com.turi.language.data.repository

import com.turi.language.data.models.DialoguePhrase
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository for scenario and dialogue data
 * Handles all database queries related to dialogues
 */
class ScenarioRepository {
    
    private val supabase = SupabaseClientManager.client
    
    /**
     * Fetch all phrases for a specific dialogue in a scenario
     * @param scenarioNumber: 1-30
     * @param dialogueId: Dialogue ID within scenario
     * @return List of phrases ordered by dialogue_step
     */
    suspend fun getDialoguePhrases(
        scenarioNumber: Int,
        dialogueId: Int
    ): Result<List<DialoguePhrase>> = withContext(Dispatchers.IO) {
        try {
            val tableName = "scenario_$scenarioNumber"
            
            val phrases = supabase
                .from(tableName)
                .select() {
                    filter {
                        eq("dialogue_id", dialogueId)
                    }
                    order("dialogue_step", ascending = true)
                }
                .decodeList<DialoguePhrase>()
            
            Result.success(phrases)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Get list of all dialogue IDs in a scenario
     * @param scenarioNumber: 1-30
     * @return List of unique dialogue IDs
     */
    suspend fun getDialogueIdsInScenario(
        scenarioNumber: Int
    ): Result<List<Int>> = withContext(Dispatchers.IO) {
        try {
            val tableName = "scenario_$scenarioNumber"
            
            val phrases = supabase
                .from(tableName)
                .select()
                .decodeList<DialoguePhrase>()
            
            // Extract unique dialogue IDs and sort
            val dialogueIds = phrases
                .map { it.dialogue_id }
                .distinct()
                .sorted()
            
            Result.success(dialogueIds)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

**QuizRepository.kt**
```kotlin
package com.turi.language.data.repository

import com.turi.language.data.models.QuizWord
import com.turi.language.data.models.DialoguePhrase
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository for quiz word matching
 * Extracts words from dialogues and matches against quiz table
 */
class QuizRepository {
    
    private val supabase = SupabaseClientManager.client
    
    /**
     * Extract quiz words from dialogue
     * 1. Get all phrases from dialogue
     * 2. Extract words in target language
     * 3. Match against quiz table
     * 4. Return up to 5 matching words
     */
    suspend fun getQuizWordsForDialogue(
        scenarioNumber: Int,
        dialogueId: Int,
        targetLanguage: String
    ): Result<List<QuizWord>> = withContext(Dispatchers.IO) {
        try {
            // Step 1: Fetch dialogue phrases
            val scenarioRepo = ScenarioRepository()
            val phrasesResult = scenarioRepo.getDialoguePhrases(scenarioNumber, dialogueId)
            
            if (phrasesResult.isFailure) {
                return@withContext Result.failure(phrasesResult.exceptionOrNull()!!)
            }
            
            val phrases = phrasesResult.getOrNull() ?: emptyList()
            
            // Step 2: Extract all text in target language
            val allText = phrases
                .map { it.getText(targetLanguage) }
                .joinToString(" ")
            
            // Step 3: Extract individual words (lowercase, no punctuation)
            val words = extractWords(allText)
            
            if (words.isEmpty()) {
                return@withContext Result.success(emptyList())
            }
            
            // Step 4: Query quiz table for matching words
            val languageColumn = getLanguageColumn(targetLanguage)
            
            // Build query: SELECT * FROM quiz WHERE [language] IN (words) LIMIT 5
            val matchingWords = supabase
                .from("quiz")
                .select()
                .decodeList<QuizWord>()
                .filter { word ->
                    val wordInTargetLang = word.getWord(targetLanguage).lowercase()
                    words.contains(wordInTargetLang)
                }
                .take(5)
            
            Result.success(matchingWords)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Extract words from text
     * - Convert to lowercase
     * - Remove punctuation
     * - Split by whitespace
     * - Remove duplicates
     */
    private fun extractWords(text: String): Set<String> {
        return text
            .lowercase()
            .replace(Regex("[^a-zA-Z0-9\\s\\u0400-\\u04FF\\u4E00-\\u9FFF\\u0600-\\u06FF\\u3040-\\u309F\\u30A0-\\u30FF]"), " ")
            .split(Regex("\\s+"))
            .filter { it.length > 2 } // Skip very short words
            .toSet()
    }
    
    /**
     * Map language code to quiz table column name
     */
    private fun getLanguageColumn(langCode: String): String {
        return when(langCode.lowercase()) {
            "en" -> "english"
            "ru" -> "russian"
            "es" -> "spanish"
            "fr" -> "french"
            "de" -> "german"
            "it" -> "italian"
            "ar" -> "arabic"
            "ch" -> "chinese"
            "ja" -> "japanese"
            "tr" -> "turkish"
            else -> "english"
        }
    }
}
```

**LanguageLevelRepository.kt**
```kotlin
package com.turi.language.data.repository

import com.turi.language.data.models.LanguageLevel
import io.github.jan.supabase.postgrest.from
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository for user progress tracking
 */
class LanguageLevelRepository {
    
    private val supabase = SupabaseClientManager.client
    
    /**
     * Get user's progress for target language
     */
    suspend fun getLanguageLevel(
        userId: String,
        targetLanguage: String
    ): Result<LanguageLevel?> = withContext(Dispatchers.IO) {
        try {
            val level = supabase
                .from("language_levels")
                .select() {
                    filter {
                        eq("user_id", userId)
                        eq("target_language", targetLanguage)
                    }
                }
                .decodeSingleOrNull<LanguageLevel>()
            
            Result.success(level)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Update progress after completing dialogue
     */
    suspend fun updateProgress(
        userId: String,
        targetLanguage: String,
        scenarioNumber: Int,
        dialogueId: Int,
        wordsLearned: Int
    ): Result<LanguageLevel> = withContext(Dispatchers.IO) {
        try {
            // Get existing level
            val existingLevel = getLanguageLevel(userId, targetLanguage).getOrNull()
            
            if (existingLevel == null) {
                // Create new record
                val newLevel = supabase
                    .from("language_levels")
                    .insert(
                        mapOf(
                            "user_id" to userId,
                            "mother_language" to "en", // Default, should be passed
                            "target_language" to targetLanguage,
                            "scenario_progress" to scenarioNumber,
                            "scenario_dialogue_progress" to dialogueId,
                            "word_progress" to wordsLearned
                        )
                    ) {
                        select()
                    }
                    .decodeSingle<LanguageLevel>()
                
                Result.success(newLevel)
            } else {
                // Update existing record
                val updatedLevel = supabase
                    .from("language_levels")
                    .update(
                        mapOf(
                            "scenario_progress" to scenarioNumber,
                            "scenario_dialogue_progress" to maxOf(dialogueId, existingLevel.scenario_dialogue_progress),
                            "word_progress" to (existingLevel.word_progress + wordsLearned)
                        )
                    ) {
                        filter {
                            eq("user_id", userId)
                            eq("target_language", targetLanguage)
                        }
                        select()
                    }
                    .decodeSingle<LanguageLevel>()
                
                Result.success(updatedLevel)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### 4. ViewModels

**DialogueViewModel.kt**
```kotlin
package com.turi.language.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.turi.language.data.models.DialoguePhrase
import com.turi.language.data.repository.ScenarioRepository
import kotlinx.coroutines.launch

/**
 * Visibility modes for dialogue text
 * Controls what text is shown to user
 */
enum class VisibilityMode {
    ALL,              // 📖 Phrase + Transcription + Translation
    PHRASE_TRANS,     // 📝 Phrase + Transcription
    PHRASE_TRANSL,    // 🔤 Phrase + Translation
    PHRASE_ONLY,      // 👁️ Phrase only
    TRANSLATION_ONLY, // 🌍 Translation only
    NONE              // 🙈 Hide (required for quiz)
}

/**
 * ViewModel for dialogue screen
 * Manages dialogue flow, visibility modes, speed control
 */
class DialogueViewModel(
    private val scenarioRepository: ScenarioRepository = ScenarioRepository()
) : ViewModel() {
    
    // Dialogue data
    var phrases by mutableStateOf<List<DialoguePhrase>>(emptyList())
        private set
    
    var currentStep by mutableStateOf(1)
        private set
    
    var isLoading by mutableStateOf(false)
        private set
    
    var error by mutableStateOf<String?>(null)
        private set
    
    // Visibility control
    var visibilityMode by mutableStateOf(VisibilityMode.ALL)
        private set
    
    private val visibilityModes = listOf(
        VisibilityMode.ALL,
        VisibilityMode.PHRASE_TRANS,
        VisibilityMode.PHRASE_TRANSL,
        VisibilityMode.PHRASE_ONLY,
        VisibilityMode.TRANSLATION_ONLY,
        VisibilityMode.NONE
    )
    
    // Speed control
    var playbackSpeed by mutableStateOf(1.0f)
        private set
    
    private val speedOptions = listOf(0.6f, 0.8f, 1.0f, 1.2f, 1.4f, 2.0f)
    
    // Dialogue completion tracking
    var isDialogueComplete by mutableStateOf(false)
        private set
    
    var completedInHideMode by mutableStateOf(false)
        private set
    
    // Audio recordings (step -> ByteArray)
    private val recordings = mutableMapOf<Int, ByteArray>()
    
    /**
     * Load dialogue from database
     */
    fun loadDialogue(scenarioNumber: Int, dialogueId: Int) {
        viewModelScope.launch {
            isLoading = true
            error = null
            
            val result = scenarioRepository.getDialoguePhrases(scenarioNumber, dialogueId)
            
            if (result.isSuccess) {
                phrases = result.getOrNull() ?: emptyList()
                currentStep = 1
                isDialogueComplete = false
                completedInHideMode = false
            } else {
                error = result.exceptionOrNull()?.message ?: "Failed to load dialogue"
            }
            
            isLoading = false
        }
    }
    
    /**
     * Advance to next dialogue step
     * Checks if dialogue is complete
     */
    fun advanceStep() {
        if (currentStep < phrases.size) {
            currentStep++
        } else if (currentStep == phrases.size) {
            // Dialogue is complete
            isDialogueComplete = true
            
            // Check if completed in Hide mode
            if (visibilityMode == VisibilityMode.NONE) {
                completedInHideMode = true
                println("✅ Dialogue completed in Hide mode - quiz unlocked")
            } else {
                completedInHideMode = false
                println("⚠️ Dialogue completed but NOT in Hide mode")
            }
        }
    }
    
    /**
     * Reset dialogue to start over
     */
    fun resetDialogue() {
        currentStep = 1
        isDialogueComplete = false
        completedInHideMode = false
        recordings.clear()
    }
    
    /**
     * Toggle visibility mode to next in sequence
     */
    fun toggleVisibilityMode() {
        val currentIndex = visibilityModes.indexOf(visibilityMode)
        val nextIndex = (currentIndex + 1) % visibilityModes.size
        visibilityMode = visibilityModes[nextIndex]
        println("👁️ Visibility mode: ${visibilityMode.name}")
    }
    
    /**
     * Toggle playback speed to next option
     */
    fun toggleSpeed() {
        val currentIndex = speedOptions.indexOf(playbackSpeed)
        val nextIndex = (currentIndex + 1) % speedOptions.size
        playbackSpeed = speedOptions[nextIndex]
        println("🎚️ Playback speed: ${playbackSpeed}x")
    }
    
    /**
     * Save user's audio recording for a step
     */
    fun saveRecording(step: Int, audioData: ByteArray) {
        recordings[step] = audioData
    }
    
    /**
     * Get recording for a step
     */
    fun getRecording(step: Int): ByteArray? {
        return recordings[step]
    }
    
    /**
     * Get icon for current visibility mode
     */
    fun getVisibilityIcon(): String {
        return when (visibilityMode) {
            VisibilityMode.ALL -> "📖"
            VisibilityMode.PHRASE_TRANS -> "📝"
            VisibilityMode.PHRASE_TRANSL -> "🔤"
            VisibilityMode.PHRASE_ONLY -> "👁️"
            VisibilityMode.TRANSLATION_ONLY -> "🌍"
            VisibilityMode.NONE -> "🙈"
        }
    }
    
    /**
     * Get label for current visibility mode
     */
    fun getVisibilityLabel(): String {
        return when (visibilityMode) {
            VisibilityMode.ALL -> "All"
            VisibilityMode.PHRASE_TRANS -> "P+T"
            VisibilityMode.PHRASE_TRANSL -> "P+Tr"
            VisibilityMode.PHRASE_ONLY -> "P"
            VisibilityMode.TRANSLATION_ONLY -> "Tr"
            VisibilityMode.NONE -> "Hide"
        }
    }
    
    /**
     * Get icon for current speed
     */
    fun getSpeedIcon(): String {
        return when {
            playbackSpeed <= 0.6f -> "🐢"
            playbackSpeed <= 0.8f -> "🚶"
            playbackSpeed == 1.0f -> "▶️"
            playbackSpeed <= 1.2f -> "🏃"
            playbackSpeed <= 1.4f -> "⚡"
            else -> "🚀"
        }
    }
}
```

### 5. UI Screens

**DialogueScreen.kt** (Main dialogue interface)
```kotlin
package com.turi.language.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.turi.language.ui.components.DialogueBox
import com.turi.language.viewmodel.DialogueViewModel
import com.turi.language.viewmodel.VisibilityMode

/**
 * Main dialogue screen
 * Shows conversation between NPC and user
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DialogueScreen(
    scenarioNumber: Int,
    dialogueId: Int,
    motherLanguage: String,
    targetLanguage: String,
    onQuizStart: () -> Unit,
    onBack: () -> Unit,
    viewModel: DialogueViewModel = viewModel()
) {
    // Load dialogue on first composition
    LaunchedEffect(scenarioNumber, dialogueId) {
        viewModel.loadDialogue(scenarioNumber, dialogueId)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Scenario $scenarioNumber - Dialogue $dialogueId") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Text("←")
                    }
                },
                actions = {
                    // Visibility mode button
                    Button(
                        onClick = { viewModel.toggleVisibilityMode() },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.tertiary
                        )
                    ) {
                        Text("${viewModel.getVisibilityIcon()} ${viewModel.getVisibilityLabel()}")
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    // Speed button
                    Button(
                        onClick = { viewModel.toggleSpeed() },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.secondary
                        )
                    ) {
                        Text("${viewModel.getSpeedIcon()} ${String.format("%.1f", viewModel.playbackSpeed)}x")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            when {
                viewModel.isLoading -> {
                    // Loading state
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                
                viewModel.error != null -> {
                    // Error state
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = "Error: ${viewModel.error}",
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.loadDialogue(scenarioNumber, dialogueId) }) {
                            Text("Retry")
                        }
                    }
                }
                
                else -> {
                    // Main dialogue content
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Show phrases up to current step
                        items(viewModel.phrases.take(viewModel.currentStep)) { phrase ->
                            DialogueBox(
                                phrase = phrase,
                                motherLanguage = motherLanguage,
                                targetLanguage = targetLanguage,
                                visibilityMode = viewModel.visibilityMode,
                                playbackSpeed = viewModel.playbackSpeed,
                                isCurrentStep = phrase.dialogue_step == viewModel.currentStep,
                                onRecordingComplete = { audioData ->
                                    viewModel.saveRecording(phrase.dialogue_step, audioData)
                                    viewModel.advanceStep()
                                }
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Bottom controls
                    if (viewModel.isDialogueComplete) {
                        DialogueCompleteSection(
                            completedInHideMode = viewModel.completedInHideMode,
                            currentMode = viewModel.getVisibilityLabel(),
                            onReset = { viewModel.resetDialogue() },
                            onContinueToQuiz = onQuizStart
                        )
                    }
                }
            }
        }
    }
}

/**
 * Section shown when dialogue is complete
 * Shows different UI based on whether completed in Hide mode
 */
@Composable
fun DialogueCompleteSection(
    completedInHideMode: Boolean,
    currentMode: String,
    onReset: () -> Unit,
    onContinueToQuiz: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (completedInHideMode) {
            // Success! Can proceed to quiz
            Text(
                text = "🎉 Great job! You've completed the dialogue!",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary
            )
            
            Text(
                text = "Review your dialogue or replay the full conversation before continuing",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Button(
                onClick = onContinueToQuiz,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Text("Continue to Quiz →", modifier = Modifier.padding(8.dp))
            }
        } else {
            // Not completed in Hide mode - show instructions
            Text(
                text = "⚠️ Almost there! Complete in Hide mode (🙈) to proceed",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.error
            )
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "📚 Memory Challenge Required!",
                        style = MaterialTheme.typography.titleSmall
                    )
                    Text("To prove you've mastered this dialogue:")
                    Text("1. Click the visibility button (currently: $currentMode)")
                    Text("2. Switch to 🙈 Hide mode")
                    Text("3. Click reset button below")
                    Text("4. Complete the entire dialogue from memory!")
                }
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onReset,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("↩ Reset Dialogue")
                }
                
                Button(
                    onClick = { /* Disabled */ },
                    modifier = Modifier.weight(1f),
                    enabled = false
                ) {
                    Text("🔒 Complete in Hide Mode First")
                }
            }
        }
    }
}
```

**DialogueBox.kt** (Component for single phrase)
```kotlin
package com.turi.language.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.turi.language.data.models.DialoguePhrase
import com.turi.language.viewmodel.VisibilityMode

/**
 * Component showing a single dialogue phrase
 * Displays text based on visibility mode
 */
@Composable
fun DialogueBox(
    phrase: DialoguePhrase,
    motherLanguage: String,
    targetLanguage: String,
    visibilityMode: VisibilityMode,
    playbackSpeed: Float,
    isCurrentStep: Boolean,
    onRecordingComplete: (ByteArray) -> Unit
) {
    val isNpc = phrase.speaker == "NPC"
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isNpc) 
                MaterialTheme.colorScheme.primaryContainer 
            else 
                MaterialTheme.colorScheme.secondaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Speaker label
            Text(
                text = if (isNpc) "🤖 NPC" else "👤 You",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            // Content based on visibility mode
            when (visibilityMode) {
                VisibilityMode.ALL -> {
                    // Show everything
                    Text(
                        text = phrase.getText(targetLanguage),
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Text(
                        text = "[${phrase.getTranscription(targetLanguage, motherLanguage)}]",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = phrase.getText(motherLanguage),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
                
                VisibilityMode.PHRASE_TRANS -> {
                    // Phrase + Transcription
                    Text(
                        text = phrase.getText(targetLanguage),
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Text(
                        text = "[${phrase.getTranscription(targetLanguage, motherLanguage)}]",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                VisibilityMode.PHRASE_TRANSL -> {
                    // Phrase + Translation
                    Text(
                        text = phrase.getText(targetLanguage),
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Text(
                        text = phrase.getText(motherLanguage),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
                
                VisibilityMode.PHRASE_ONLY -> {
                    // Only phrase
                    Text(
                        text = phrase.getText(targetLanguage),
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
                
                VisibilityMode.TRANSLATION_ONLY -> {
                    // Only translation
                    Text(
                        text = phrase.getText(motherLanguage),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
                
                VisibilityMode.NONE -> {
                    // Nothing visible (Hide mode)
                    Text(
                        text = "🙈 Speak from memory",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.outline
                    )
                }
            }
            
            // Action buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Replay button (always visible for completed phrases)
                if (!isCurrentStep) {
                    TextButton(onClick = { /* TODO: Play audio */ }) {
                        Text(if (isNpc) "🔊 Replay" else "🎙️ Replay")
                    }
                }
                
                // Record/Continue button for current user phrase
                if (isCurrentStep && !isNpc) {
                    Button(onClick = { /* TODO: Record audio */ }) {
                        Text("🎤 Speak")
                    }
                }
            }
        }
    }
}
```

---

## 🔧 Services

### Speech Recognition Service
```kotlin
package com.turi.language.service

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import java.util.*

/**
 * Service for speech recognition
 * Converts user speech to text
 */
class SpeechRecognitionService(
    private val context: Context,
    private val language: String,
    private val onResult: (String) -> Unit,
    private val onError: (String) -> Unit
) {
    private var speechRecognizer: SpeechRecognizer? = null
    private var isListening = false
    
    /**
     * Start listening for speech
     */
    fun startListening() {
        if (isListening) return
        
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context)
        
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, getLanguageCode(language))
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }
        
        speechRecognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {
                isListening = true
            }
            
            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                matches?.firstOrNull()?.let { 
                    onResult(it)
                }
                isListening = false
            }
            
            override fun onError(error: Int) {
                val errorMessage = when(error) {
                    SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                    SpeechRecognizer.ERROR_CLIENT -> "Client error"
                    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
                    SpeechRecognizer.ERROR_NETWORK -> "Network error"
                    SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                    SpeechRecognizer.ERROR_NO_MATCH -> "No speech match"
                    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy"
                    SpeechRecognizer.ERROR_SERVER -> "Server error"
                    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input"
                    else -> "Unknown error: $error"
                }
                onError(errorMessage)
                isListening = false
            }
            
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onPartialResults(partialResults: Bundle?) {}
            override fun onEvent(eventType: Int, params: Bundle?) {}
        })
        
        speechRecognizer?.startListening(intent)
    }
    
    /**
     * Stop listening
     */
    fun stopListening() {
        speechRecognizer?.stopListening()
        isListening = false
    }
    
    /**
     * Cleanup
     */
    fun destroy() {
        speechRecognizer?.destroy()
    }
    
    /**
     * Get language code for speech recognition
     */
    private fun getLanguageCode(lang: String): String {
        return when(lang.lowercase()) {
            "en" -> "en-US"
            "ru" -> "ru-RU"
            "es" -> "es-ES"
            "fr" -> "fr-FR"
            "de" -> "de-DE"
            "it" -> "it-IT"
            "ar" -> "ar-SA"
            "ch" -> "zh-CN"
            "ja" -> "ja-JP"
            "tr" -> "tr-TR"
            else -> "en-US"
        }
    }
}
```

### Text-to-Speech Service
```kotlin
package com.turi.language.service

import android.content.Context
import android.speech.tts.TextToSpeech
import java.util.*

/**
 * Service for text-to-speech
 * Speaks NPC phrases aloud
 */
class TextToSpeechService(context: Context) {
    
    private var tts: TextToSpeech? = null
    private var isReady = false
    
    init {
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                isReady = true
            }
        }
    }
    
    /**
     * Speak text in specified language at specified speed
     */
    fun speak(text: String, language: String, speed: Float = 1.0f) {
        if (!isReady) return
        
        val locale = getLocale(language)
        tts?.language = locale
        tts?.setSpeechRate(speed)
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, null)
    }
    
    /**
     * Stop speaking
     */
    fun stop() {
        tts?.stop()
    }
    
    /**
     * Cleanup
     */
    fun shutdown() {
        tts?.shutdown()
    }
    
    /**
     * Get locale for language code
     */
    private fun getLocale(language: String): Locale {
        return when(language.lowercase()) {
            "en" -> Locale.US
            "ru" -> Locale("ru", "RU")
            "es" -> Locale("es", "ES")
            "fr" -> Locale.FRANCE
            "de" -> Locale.GERMANY
            "it" -> Locale.ITALY
            "ar" -> Locale("ar", "SA")
            "ch" -> Locale.CHINA
            "ja" -> Locale.JAPAN
            "tr" -> Locale("tr", "TR")
            else -> Locale.US
        }
    }
}
```

---

## 📝 Implementation Checklist

### Week 1: Setup & Infrastructure
- [ ] Create Android Studio project
- [ ] Add all Gradle dependencies
- [ ] Create Supabase account and project
- [ ] Set up database tables (users, language_levels, scenario_1-30, quiz)
- [ ] Populate quiz table with 1000+ common words
- [ ] Create sample data for scenario_1 (at least 5 dialogues)
- [ ] Test Supabase connection from Android

### Week 2: Core Data Layer
- [ ] Implement all data models (DialoguePhrase, LanguageLevel, QuizWord, Language)
- [ ] Implement SupabaseClient
- [ ] Implement ScenarioRepository with error handling
- [ ] Implement QuizRepository with word matching logic
- [ ] Implement LanguageLevelRepository
- [ ] Test all repository methods
- [ ] Add unit tests for data layer

### Week 3: ViewModels & Business Logic
- [ ] Implement DialogueViewModel with all 6 visibility modes
- [ ] Implement speed control (6 speeds)
- [ ] Implement Hide mode requirement logic
- [ ] Implement QuizViewModel with scoring
- [ ] Implement ScenarioListViewModel
- [ ] Test all ViewModels with mock data

### Week 4: UI Screens
- [ ] Implement LanguageSelectionScreen
- [ ] Implement ScenarioListScreen with progress indicators
- [ ] Implement DialogueListScreen
- [ ] Implement DialogueScreen with visibility controls
- [ ] Implement DialogueBox component
- [ ] Implement QuizScreen
- [ ] Test all UI flows

### Week 5: Speech & Audio
- [ ] Implement SpeechRecognitionService
- [ ] Implement TextToSpeechService
- [ ] Implement AudioRecordingService
- [ ] Integrate speech services with DialogueScreen
- [ ] Test speech recognition accuracy
- [ ] Test TTS with all languages
- [ ] Add microphone permissions

### Week 6: Integration & Testing
- [ ] Integrate all screens with navigation
- [ ] Implement progress tracking end-to-end
- [ ] Test scenario unlocking logic
- [ ] Test dialogue unlocking logic
- [ ] Test quiz completion and progress saving
- [ ] Add loading states and error handling
- [ ] Add offline support with local storage

### Week 7: Polish & Bug Fixes
- [ ] UI/UX improvements
- [ ] Add animations and transitions
- [ ] Improve error messages
- [ ] Add retry mechanisms
- [ ] Performance optimization
- [ ] Memory leak fixes
- [ ] Test on multiple devices

### Week 8: Final Testing & Launch Prep
- [ ] End-to-end testing of complete user journey
- [ ] Test with real users (beta testers)
- [ ] Fix critical bugs
- [ ] Prepare app store listing
- [ ] Create screenshots and promotional materials
- [ ] Deploy to Google Play Console (internal testing)
- [ ] Collect feedback and iterate

---

## 🎯 Success Criteria

Your implementation is successful when:

1. ✅ User can select mother and target languages
2. ✅ User sees 30 scenarios, only first unlocked
3. ✅ User can access dialogues in unlocked scenarios
4. ✅ Dialogues display with proper text visibility modes (all 6 modes work)
5. ✅ Speed control works for TTS and recordings (all 6 speeds)
6. ✅ User MUST complete in Hide mode to access quiz (enforced)
7. ✅ Quiz shows 0-5 words matched from dialogue
8. ✅ Quiz auto-completes if 0 words (100% score)
9. ✅ Progress saves to Supabase after quiz completion
10. ✅ Next dialogue/scenario unlocks automatically
11. ✅ All speech recognition and TTS work reliably
12. ✅ App works offline (caches progress locally)
13. ✅ No crashes or major bugs
14. ✅ Clean, modular, well-documented code

---

## 🚨 Critical Rules to Follow

### 1. **Code Quality**
- Write simple, readable code
- Each function does ONE thing
- Use clear variable names
- Add comments explaining WHY
- No premature optimization

### 2. **Error Handling**
- Wrap all network calls in try-catch
- Return Result<T> from repositories
- Show user-friendly error messages
- Log errors for debugging
- Always have fallback behavior

### 3. **Testing**
- Test each component in isolation first
- Verify database queries return correct data
- Test edge cases (0 words in quiz, etc.)
- Test on slow network connections
- Test with different screen sizes

### 4. **Security**
- Never commit API keys to git
- Use BuildConfig or local.properties
- Validate all user inputs
- Sanitize data before database queries
- Use Supabase RLS policies

### 5. **Performance**
- Load data asynchronously (coroutines)
- Cache data locally when possible
- Don't block UI thread
- Lazy load large lists
- Optimize images and assets

### 6. **User Experience**
- Show loading indicators
- Provide clear error messages
- Allow retry on failures
- Save progress frequently
- Smooth animations (but don't overdo it)

---

## 💬 Final Notes

### What NOT to Do
- ❌ Don't add features not specified
- ❌ Don't over-engineer solutions
- ❌ Don't skip error handling
- ❌ Don't ignore the Hide mode requirement
- ❌ Don't use complex architectural patterns unnecessarily
- ❌ Don't assume - ask if unclear

### What TO Do
- ✅ Follow instructions exactly
- ✅ Write simple, clear code
- ✅ Test each component thoroughly
- ✅ Document your code
- ✅ Handle errors gracefully
- ✅ Ask questions when stuck

### Getting Help
If you encounter issues:
1. Check error logs carefully
2. Verify database table structure matches exactly
3. Test API calls in Supabase dashboard first
4. Simplify the problem - test in isolation
5. Read documentation for libraries
6. Ask specific questions about what's not working

---

## 📖 Summary

This is a complete, production-ready guide to build the Turi Language Learning Android app. The app has:

- **30 scenarios** with progressive unlocking
- **Advanced dialogue system** with 6 visibility modes and 6 speed options
- **Hide mode requirement** - must complete from memory to unlock quiz
- **Intelligent quiz system** - matches dialogue words against common vocabulary
- **Full speech integration** - recognition and synthesis
- **Cloud progress tracking** - syncs across devices
- **Offline support** - works without internet
- **Simple, robust architecture** - easy to maintain and extend

Follow the implementation checklist week by week, test thoroughly at each step, and you'll have a fully functional language learning app!

**Good luck! 🚀**

