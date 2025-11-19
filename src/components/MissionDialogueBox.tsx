/**
 * MissionDialogueBox - Dedicated component for mission mode
 * Separate from regular DialogueBox to avoid circular dependencies
 */

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Mission } from '../constants/missions';
import { checkUserSentence, generateHelpSuggestion } from '../services/missionHelperRobot';
import { generateNPCResponse } from '../services/missionNPC';
import { getTranslation } from '../constants/translations';
import type { SupportedLanguage } from '../constants/translations';

interface MissionDialogueBoxProps {
  mission: Mission;
  characterId: number;
  onClose: () => void;
  distance: number;
  onNpcSpeakStart?: () => void;
  onNpcSpeakEnd?: () => void;
}

interface ConversationEntry {
  speaker: 'user' | 'npc';
  text: string;
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
    recognition.lang = targetLanguage === 'ru' ? 'ru-RU' : 
                      targetLanguage === 'es' ? 'es-ES' : 
                      targetLanguage === 'fr' ? 'fr-FR' : 
                      targetLanguage === 'de' ? 'de-DE' : 
                      targetLanguage === 'it' ? 'it-IT' : 
                      targetLanguage === 'ja' ? 'ja-JP' : 
                      targetLanguage === 'CH' ? 'zh-CN' : 'en-US';

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
        
        setTimeout(() => {
          sendToNPC(userText);
        }, 800);
      } else {
        setAwaitingApproval(false);
        const correctionMsg = `${decision.explanation}\n\n${decision.correctedSentence}`;
        setHelperMessage(correctionMsg);
      }
    } catch (error) {
      console.error('[Missions] Error checking sentence:', error);
      setAwaitingApproval(false);
      setHelperMessage('Error checking sentence. Please try again.');
    }
  };

  // Send to NPC
  const sendToNPC = async (userText: string) => {
    try {
      console.log('[Missions] Sending to NPC:', userText);
      
      // Add user message to history
      const newHistory = [...conversationHistory, { speaker: 'user' as const, text: userText }];
      setConversationHistory(newHistory);

      // Get NPC response
      const npcResponse = await generateNPCResponse({
        targetLanguage,
        motherLanguage,
        missionGoal: mission.goal,
        npcRole: mission.npcRole,
        userLevel: 'A2',
        conversationHistory: newHistory,
        userLatestMessage: userText
      });

      console.log('[Missions] NPC responded:', npcResponse.response);

      // Add NPC response
      const finalHistory = [...newHistory, { speaker: 'npc' as const, text: npcResponse.response }];
      setConversationHistory(finalHistory);

      // Speak NPC response (simple TTS)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(npcResponse.response);
        utterance.lang = targetLanguage === 'ru' ? 'ru-RU' : 
                        targetLanguage === 'es' ? 'es-ES' : 
                        targetLanguage === 'fr' ? 'fr-FR' : 
                        targetLanguage === 'de' ? 'de-DE' : 
                        targetLanguage === 'it' ? 'it-IT' : 
                        targetLanguage === 'ja' ? 'ja-JP' : 
                        targetLanguage === 'CH' ? 'zh-CN' : 'en-US';
        if (onNpcSpeakStart) onNpcSpeakStart();
        utterance.onend = () => {
          if (onNpcSpeakEnd) onNpcSpeakEnd();
        };
        window.speechSynthesis.speak(utterance);
      }

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
    <div style={{ pointerEvents: 'auto' }}>
      {/* Mission Goal */}
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

      {/* Conversation History */}
      <div style={{
        position: 'fixed',
        top: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        maxHeight: '400px',
        overflowY: 'auto',
        zIndex: 999998
      }}>
        {conversationHistory.map((entry, index) => (
          <div key={index} style={{
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: entry.speaker === 'user' 
              ? 'rgba(59, 130, 246, 0.2)' 
              : 'rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            border: `1px solid ${entry.speaker === 'user' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            color: 'white'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}>
              {entry.speaker === 'user' ? 'You' : mission.npcRole}
            </div>
            <div style={{ fontSize: '14px' }}>
              {entry.text}
            </div>
          </div>
        ))}
      </div>

      {/* Help Me Button */}
      {showHelpMe && !missionCompleted && (
        <div style={{
          position: 'fixed',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999998
        }}>
          <button
            onClick={handleHelpMe}
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.95)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
          >
            💡 {getTranslation(motherLanguage, 'helpMe')}
          </button>
        </div>
      )}

      {/* Microphone Button */}
      {!missionCompleted && (
        <div style={{
          position: 'fixed',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999998
        }}>
          <button
            onClick={toggleListening}
            style={{
              backgroundColor: isListening ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '50px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
          >
            🎤 {isListening ? 'Stop' : 'Speak'}
          </button>
        </div>
      )}

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

      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1000000,
          fontWeight: '600'
        }}
      >
        ✕ Close
      </button>
    </div>
  );
};

export default MissionDialogueBox;

