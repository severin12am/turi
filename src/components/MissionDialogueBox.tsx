/**
 * MissionDialogueBox - Dedicated component for mission mode
 * Uses the same UI and features as regular DialogueBox
 */

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Mission } from '../constants/missions';
import { checkUserSentence, generateHelpSuggestion } from '../services/missionHelperRobot';
import { generateNPCResponse } from '../services/missionNPC';
import { getTranslation } from '../constants/translations';
import { generateSpeechWithGemini } from '../services/gemini';
import type { SupportedLanguage } from '../constants/translations';
import './DialogueBox.css'; // Reuse existing dialogue styles

// Language mapping for speech recognition
const getRecognitionLanguage = (lang: SupportedLanguage): string => {
  const languageMap: Record<string, string> = {
    'en': 'en-US',
    'ru': 'ru-RU',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'ar': 'ar-SA',
    'CH': 'zh-CN',
    'ja': 'ja-JP',
    'tr': 'tr-TR',
    'ko': 'ko-KR',
    'hi': 'hi-IN',
    'th': 'th-TH',
    'pl': 'pl-PL',
    'nl': 'nl-NL',
    'sv': 'sv-SE',
    'da': 'da-DK',
    'fi': 'fi-FI',
    'no': 'nb-NO',
    'pt': 'pt-PT',
    'cs': 'cs-CZ',
    'el': 'el-GR',
    'ro': 'ro-RO',
    'hu': 'hu-HU',
    'bg': 'bg-BG',
    'hr': 'hr-HR',
    'sk': 'sk-SK',
    'uk': 'uk-UA',
    'he': 'he-IL',
    'id': 'id-ID',
    'vi': 'vi-VN',
    'ms': 'ms-MY'
  };
  return languageMap[lang] || 'en-US';
};

interface MissionDialogueBoxProps {
  mission: Mission;
  characterId: number;
  onClose: () => void;
  distance: number;
  onNpcSpeakStart?: () => void;
  onNpcSpeakEnd?: () => void;
}

interface ConversationEntry {
  speaker: 'User' | 'NPC';
  phrase: string;
  transcription: string;
  translation: string;
  isApproved: boolean; // For missions: approved by Turi
  audioUrl?: string;
}

const MissionDialogueBox: React.FC<MissionDialogueBoxProps> = ({
  mission,
  characterId,
  onClose,
  distance,
  onNpcSpeakStart,
  onNpcSpeakEnd
}) => {
  const { motherLanguage, targetLanguage } = useStore();
  
  // State
  const [helperMessage, setHelperMessage] = useState<string>('');
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [showHelpMe, setShowHelpMe] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentUserPhrase, setCurrentUserPhrase] = useState<string>(''); // Current unapproved phrase
  const [isNpcSpeaking, setIsNpcSpeaking] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  // Initialize
  useEffect(() => {
    console.log('[Missions] MissionDialogueBox mounted', mission.goal);
    const initMsg = motherLanguage === 'ru' 
      ? `Миссия: ${mission.goal}\n\nНажмите "Помогите мне" или начните говорить`
      : `Mission: ${mission.goal}\n\nClick "Help Me" or start speaking`;
    setHelperMessage(initMsg);
  }, [mission, motherLanguage]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('[Missions] Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = getRecognitionLanguage(targetLanguage);

    recognition.onresult = (event: any) => {
      const result = event.results[0][0];
      const spokenText = result.transcript;
      console.log('[Missions] Speech recognized:', spokenText);
      setTranscript(spokenText);
      handleUserSpeech(spokenText);
    };

    recognition.onerror = (event: any) => {
      console.error('[Missions] Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [targetLanguage]);

  // Handle user speech
  const handleUserSpeech = async (userText: string) => {
    try {
      console.log('[Missions] Processing user speech:', userText);
      setAwaitingApproval(true);
      setCurrentUserPhrase(userText); // Show unapproved phrase
      setHelperMessage(getTranslation(motherLanguage, 'helperRobotChecking') || 'Checking...');

      const decision = await checkUserSentence({
        userText,
        targetLanguage,
        motherLanguage,
        missionGoal: mission.goal,
        npcRole: mission.npcRole
      });

      console.log('[Missions] Helper robot decision:', decision.decision);

      if (decision.decision === 'No errors') {
        setAwaitingApproval(false);
        setHelperMessage(getTranslation(motherLanguage, 'sentenceApproved') || 'Approved!');
        
        // Move current phrase to history as approved
        setTimeout(() => {
          sendToNPC(userText);
          setCurrentUserPhrase(''); // Clear current phrase
        }, 800);
      } else {
        setAwaitingApproval(false);
        const correctionMsg = `${decision.explanation}\n\n${decision.correctedSentence}`;
        setHelperMessage(correctionMsg);
        // Keep currentUserPhrase visible but unapproved
      }
    } catch (error) {
      console.error('[Missions] Error checking sentence:', error);
      setAwaitingApproval(false);
      setHelperMessage('Error checking sentence. Please try again.');
    }
  };

  // Send to NPC with Gemini TTS
  const sendToNPC = async (userText: string) => {
    try {
      console.log('[Missions] Sending to NPC:', userText);
      
      // Add approved user message to history
      const userEntry: ConversationEntry = {
        speaker: 'User',
        phrase: userText,
        transcription: '', // Will be filled by AI if needed
        translation: '', // Will be filled by AI if needed
        isApproved: true
      };
      const newHistory = [...conversationHistory, userEntry];
      setConversationHistory(newHistory);

      // Get NPC response
      const npcResponse = await generateNPCResponse({
        targetLanguage,
        motherLanguage,
        missionGoal: mission.goal,
        npcRole: mission.npcRole,
        userLevel: 'A2',
        conversationHistory: newHistory.map(e => ({ speaker: e.speaker.toLowerCase() as 'user' | 'npc', text: e.phrase })),
        userLatestMessage: userText
      });

      console.log('[Missions] NPC responded:', npcResponse.response);

      // Add NPC response
      const npcEntry: ConversationEntry = {
        speaker: 'NPC',
        phrase: npcResponse.response,
        transcription: npcResponse.transcription || '',
        translation: npcResponse.translation || '',
        isApproved: true
      };
      const finalHistory = [...newHistory, npcEntry];
      setConversationHistory(finalHistory);

      // Play NPC response with Gemini TTS (fallback to browser)
      await playNPCAudio(npcResponse.response);

      // Check completion
      if (npcResponse.missionCompleted) {
        console.log('[Missions] Mission completed!');
        setMissionCompleted(true);
        setHelperMessage(getTranslation(motherLanguage, 'taskCompletedMessage') || 'Task completed!');
      }
    } catch (error) {
      console.error('[Missions] Error getting NPC response:', error);
      setHelperMessage('Error getting response. Please try again.');
    }
  };

  // Play NPC audio with Gemini TTS and fallback
  const playNPCAudio = async (text: string) => {
    try {
      console.log('[Missions] Playing NPC audio with Gemini TTS');
      setIsNpcSpeaking(true);
      if (onNpcSpeakStart) onNpcSpeakStart();

      try {
        const audio = await generateSpeechWithGemini(text, targetLanguage);
        
        audio.onended = () => {
          console.log('[Missions] Gemini TTS completed');
          setIsNpcSpeaking(false);
          if (onNpcSpeakEnd) onNpcSpeakEnd();
        };

        audio.onerror = (error) => {
          console.error('[Missions] Gemini TTS error, falling back to browser:', error);
          performBrowserSpeech(text);
        };

        await audio.play();
        console.log('[Missions] Gemini TTS playing');
      } catch (error) {
        console.error('[Missions] Gemini TTS failed, using browser TTS:', error);
        performBrowserSpeech(text);
      }
    } catch (error) {
      console.error('[Missions] Audio playback error:', error);
      setIsNpcSpeaking(false);
      if (onNpcSpeakEnd) onNpcSpeakEnd();
    }
  };

  // Browser TTS fallback
  const performBrowserSpeech = (text: string) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getRecognitionLanguage(targetLanguage);
    
    utterance.onend = () => {
      setIsNpcSpeaking(false);
      if (onNpcSpeakEnd) onNpcSpeakEnd();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Replay audio for an entry
  const replayAudio = async (entry: ConversationEntry) => {
    if (entry.audioUrl) {
      const audio = new Audio(entry.audioUrl);
      await audio.play();
    } else {
      await playNPCAudio(entry.phrase);
    }
  };

  // Handle Help Me
  const handleHelpMe = async () => {
    try {
      console.log('[Missions] Help Me clicked');
      setHelperMessage('Generating suggestion...');

      const suggestion = await generateHelpSuggestion({
        targetLanguage,
        motherLanguage,
        missionGoal: mission.goal,
        npcRole: mission.npcRole
      });

      console.log('[Missions] Suggestion generated');
      setHelperMessage(suggestion);
      setShowHelpMe(false);
    } catch (error) {
      console.error('[Missions] Error generating help:', error);
      setHelperMessage('Error generating suggestion. Please try again.');
    }
  };

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        setCurrentUserPhrase(''); // Clear previous unapproved phrase
        recognitionRef.current?.start();
        setIsListening(true);
        setTranscript('');
      } catch (error) {
        console.error('[Missions] Error starting recognition:', error);
      }
    }
  };

  // Auto-close on distance
  useEffect(() => {
    if (distance > 5) {
      console.log('[Missions] Too far, closing');
      onClose();
    }
  }, [distance, onClose]);

  return (
    <div className="dialogue-box-container" style={{ pointerEvents: 'auto' }}>
      {/* Mission Goal Banner */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(147, 51, 234, 0.95)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 999999,
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
          🎯 {getTranslation(motherLanguage, 'mission')}: {mission.goal}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>
          {getTranslation(motherLanguage, 'talkingTo')}: {mission.npcRole}
        </div>
      </div>

      {/* Turi Panel - Replaces tips panel during missions */}
      {helperMessage && (
        <div className="fixed top-[50%] transform -translate-y-1/2 left-8 z-50 max-w-sm">
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            width: '340px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px'
            }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>
                Turi:
              </span>
              {awaitingApproval && (
                <span style={{ 
                  marginLeft: 'auto',
                  fontSize: '12px',
                  color: 'rgba(251, 191, 36, 1)',
                  fontWeight: '500'
                }}>
                  Checking...
                </span>
              )}
            </div>
            <div style={{
              color: 'rgba(226, 232, 240, 0.95)',
              fontSize: '14px',
              lineHeight: '1.7',
              whiteSpace: 'pre-wrap'
            }}>
              {helperMessage}
            </div>
          </div>
        </div>
      )}

      {/* Current unapproved phrase (purple/transparent) */}
      {currentUserPhrase && !awaitingApproval && (
        <div className="dialogue-box-entry" style={{ 
          background: 'rgba(147, 51, 234, 0.3)',
          border: '2px solid rgba(147, 51, 234, 0.5)'
        }}>
          <div className="dialogue-entry user">
            <div className="dialogue-content">
              <div className="dialogue-phrase">
                {currentUserPhrase}
              </div>
              <div className="dialogue-translation" style={{ opacity: 0.8 }}>
                Waiting for Turi's approval...
              </div>
            </div>
            <div className="dialogue-buttons">
              <button className="sound-button" onClick={toggleListening} title="Retry">
                🔄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversation History (approved messages - white background) */}
      {conversationHistory.map((entry, index) => (
        <div key={index} className="dialogue-box-entry">
          <div className={`dialogue-entry ${entry.speaker.toLowerCase()}`}>
            <div className="dialogue-content">
              <div className="dialogue-phrase" dir={targetLanguage === 'ar' ? 'rtl' : 'ltr'} lang={targetLanguage}>
                {entry.phrase}
              </div>
              {entry.transcription && (
                <div className="dialogue-transcription" dir={motherLanguage === 'ar' ? 'rtl' : 'ltr'}>
                  [{entry.transcription}]
                </div>
              )}
              {entry.translation && (
                <div className="dialogue-translation" dir={motherLanguage === 'ar' ? 'rtl' : 'ltr'}>
                  {entry.translation}
                </div>
              )}
            </div>
            <div className="dialogue-buttons">
              <button 
                className="sound-button"
                onClick={() => replayAudio(entry)}
                title="Play audio"
              >
                🔊
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Control Panel */}
      <div style={{ 
        marginTop: '15px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        padding: '10px'
      }}>
        {/* Help Me Button */}
        {showHelpMe && !missionCompleted && (
          <button
            onClick={handleHelpMe}
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            💡 {getTranslation(motherLanguage, 'helpMe')}
          </button>
        )}

        {/* Microphone Button */}
        {!missionCompleted && (
          <button
            onClick={toggleListening}
            style={{
              backgroundColor: isListening ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)',
              color: 'white',
              padding: '12px 32px',
              borderRadius: '50px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            🎤 {isListening ? 'Stop' : getTranslation(motherLanguage, 'speak')}
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Completion Overlay */}
      {missionCompleted && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(16, 185, 129, 0.98)',
          color: 'white',
          padding: '32px 48px',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          zIndex: 1000001,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            {getTranslation(motherLanguage, 'taskCompleted')}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.95, marginBottom: '16px' }}>
            {getTranslation(motherLanguage, 'taskCompletedMessage')}
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'white',
              color: 'rgb(16, 185, 129)',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default MissionDialogueBox;
