import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { logger } from '../services/logger';
import { Lock, Check, PlayCircle, X, ArrowLeft } from 'lucide-react';
import { useStore } from '../store';
import AppPanel from './AppPanel';
import { PanelBackdrop } from './AppPanel';
import { PanelTitle } from './PanelElements';
import { getTranslation } from '../constants/translations';
import { DIALOGUES_PER_SCENARIO } from '../constants/scenarios';

interface ScenarioSelectionPanelProps {
  characterId: number;
  scenarioNumber: number;
  scenarioName: string;
  onScenarioDialogueSelect: (dialogueId: number, scenarioNumber: number) => void;
  onMissionsClick?: () => void; // Navigate to missions
  onBack: () => void;
}

interface DialogueProgress {
  dialogue_id: number;
  completed: boolean;
  score?: number;
}

const ScenarioSelectionPanel: React.FC<ScenarioSelectionPanelProps> = ({
  characterId,
  scenarioNumber,
  scenarioName,
  onScenarioDialogueSelect,
  onMissionsClick,
  onBack
}) => {
  const [availableDialogues, setAvailableDialogues] = useState<number[]>([]);
  const [completedDialogues, setCompletedDialogues] = useState<DialogueProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, motherLanguage, targetLanguage } = useStore();
  
  // Fetch scenario dialogues
  const fetchScenarioDialogues = async () => {
    setIsLoading(true);
    
    try {
      // Fetch from scenario table (e.g., scenario_1)
      const sourceTable = `scenario_${characterId}`;
      
      // Fetch all unique dialogue IDs for this scenario
      const { data: dialogueData, error } = await supabase
        .from(sourceTable)
        .select('dialogue_id');
        
      if (error) {
        logger.error('Error fetching scenario dialogues', { error });
        setError('Failed to fetch scenario dialogues');
        return;
      }
      
      // Extract and sort unique dialogue IDs
      const uniqueDialogueIds = [...new Set(dialogueData?.map(item => item.dialogue_id) || [])]
        .sort((a, b) => a - b);
        
      setAvailableDialogues(uniqueDialogueIds);
      
      // Fetch user progress if logged in
      if (user?.id) {
        try {
          // Get progress from language_levels
          const { data: languageLevel, error: progressError } = await supabase
            .from('language_levels')
            .select('*')
            .eq('user_id', user.id)
            .eq('target_language', targetLanguage)
            .single();
          
          if (progressError) {
            logger.error('Error fetching language level', { error: progressError });
            setCompletedDialogues([]);
            return;
          }
          
          // Determine progress for THIS specific scenario
          let highestCompletedDialogue = 0;
          
          if (languageLevel) {
            let globalScenarioProgress = languageLevel.scenario_progress || 0;
            let globalDialogueProgress = languageLevel.scenario_dialogue_progress || 0;
            
            // Handle edge case: if dialogue progress is >= 10 but scenario hasn't incremented yet
            if (globalDialogueProgress >= DIALOGUES_PER_SCENARIO && globalScenarioProgress > 0) {
              globalScenarioProgress = globalScenarioProgress + 1;
              globalDialogueProgress = 0;
            }
            
            // If this scenario is completed (we've moved past it), mark all dialogues as completed
            if (scenarioNumber < globalScenarioProgress) {
              highestCompletedDialogue = DIALOGUES_PER_SCENARIO; // All dialogues completed
            } 
            // If this is the current scenario, use the current dialogue progress
            else if (scenarioNumber === globalScenarioProgress) {
              highestCompletedDialogue = globalDialogueProgress;
            }
            // If this scenario is in the future, no progress yet
            else {
              highestCompletedDialogue = 0;
            }
          }
          
          if (highestCompletedDialogue > 0) {
            // Convert to our DialogueProgress format
            const progressData: DialogueProgress[] = [];
            
            // Mark all dialogues up to highestCompletedDialogue as completed
            for (let i = 1; i <= highestCompletedDialogue; i++) {
              progressData.push({
                dialogue_id: i,
                completed: true,
                score: 100
              });
            }
            
            setCompletedDialogues(progressData);
          } else {
            // No progress
            setCompletedDialogues([]);
          }
        } catch (progressError) {
          logger.error('Error processing user progress', { error: progressError });
          setCompletedDialogues([]);
        }
      } else {
        // If no user is logged in, check local storage for anonymous progress
        try {
          const anonymousProgress = localStorage.getItem('turi_scenario_progress');
          if (anonymousProgress) {
            const progressData = JSON.parse(anonymousProgress);
            if (progressData && progressData.scenarios && progressData.scenarios[scenarioNumber]) {
              const scenarioProgressData = progressData.scenarios[scenarioNumber].map((item: any) => ({
                dialogue_id: item.dialogueId,
                completed: item.completed,
                score: item.score
              }));
              setCompletedDialogues(scenarioProgressData);
            } else {
              setCompletedDialogues([]);
            }
          } else {
            setCompletedDialogues([]);
          }
        } catch (error) {
          logger.error('Error fetching anonymous scenario progress', { error });
          setCompletedDialogues([]);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch scenario dialogues', { error });
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarioDialogues();
  }, [characterId, scenarioNumber, user?.id]);
  
  // Check if a dialogue is unlocked
  const isDialogueUnlocked = (dialogueId: number): boolean => {
    // Always unlock the first dialogue
    if (dialogueId === 1) return true;
    
    // For other dialogues, check if the previous one is completed
    const isUnlocked = completedDialogues.some(dialogue => 
      dialogue.dialogue_id === dialogueId - 1 && dialogue.completed
    );
    
    return isUnlocked;
  };
  
  // Check if a dialogue is completed
  const isDialogueCompleted = (dialogueId: number): boolean => {
    const isCompleted = completedDialogues.some(dialogue => 
      dialogue.dialogue_id === dialogueId && dialogue.completed
    );
    
    return isCompleted;
  };
  
  const handleDialogueClick = (dialogueId: number) => {
    console.log("Scenario dialogue clicked:", dialogueId);
    if (isDialogueUnlocked(dialogueId)) {
      onScenarioDialogueSelect(dialogueId, scenarioNumber);
    }
  };
  
  return (
    <PanelBackdrop style={{ zIndex: 9999 }}>
      <div style={{ pointerEvents: 'auto' }}>
        <AppPanel width="700px" height="auto" padding={0}>
          <div className="p-4 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Back to dialogue selection"
              >
                <ArrowLeft size={18} />
              </button>
              <PanelTitle className="m-0">
                {scenarioName}
              </PanelTitle>
              <button
                onClick={fetchScenarioDialogues}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                disabled={isLoading}
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'animate-none'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {getTranslation(motherLanguage, 'refresh')}
              </button>
            </div>
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="p-6" style={{ pointerEvents: 'auto' }}>
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 rounded-lg">
                {error}
              </div>
            )}
            
            {isLoading ? (
              <div className="py-4 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-white/70">{getTranslation(motherLanguage, 'loading')}</p>
              </div>
            ) : (
              <>
                {/* Missions Section */}
                {onMissionsClick && (
                  <div className="mb-6">
                    <button
                      onClick={onMissionsClick}
                      className="w-full text-left relative rounded-xl p-6 transition-all duration-300 bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/40 hover:to-pink-600/40 border border-purple-500/50 hover:border-purple-500/70"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">🎯</span>
                            <h3 className="text-white font-bold text-xl">
                              {getTranslation(motherLanguage, 'missions')}
                            </h3>
                          </div>
                          <p className="text-white/80 text-sm">
                            {getTranslation(motherLanguage, 'missionDescription')}
                          </p>
                        </div>
                        <div className="flex items-center text-purple-300 bg-purple-900/30 px-4 py-2 rounded-lg">
                          <span className="font-medium">5 {getTranslation(motherLanguage, 'missions')}</span>
                        </div>
                      </div>
                    </button>
                  </div>
                )}
                
                {/* Regular Dialogues Section */}
                <h3 className="text-white text-lg font-semibold mb-3">
                  {getTranslation(motherLanguage, 'regularDialogues')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {availableDialogues.map((dialogueId) => {
                  const isCompleted = isDialogueCompleted(dialogueId);
                  const isUnlocked = isDialogueUnlocked(dialogueId);
                  
                  return (
                    <button
                      key={dialogueId}
                      onClick={() => handleDialogueClick(dialogueId)}
                      className={`w-full text-left relative rounded-xl p-4 transition-all duration-300 ${
                        isUnlocked 
                          ? 'bg-white/10 hover:bg-white/20 cursor-pointer' 
                          : 'bg-white/5 opacity-70 cursor-not-allowed'
                      } border border-white/10`}
                      disabled={!isUnlocked}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">
                          {getTranslation(motherLanguage, 'dialogue')} {dialogueId}
                        </span>
                        {isCompleted ? (
                          <div className="flex items-center text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded-lg text-xs">
                            <Check size={12} className="mr-1" />
                            <span>{getTranslation(motherLanguage, 'completed')}</span>
                          </div>
                        ) : isUnlocked ? (
                          <div className="flex items-center text-blue-400 bg-blue-900/30 px-2 py-1 rounded-lg text-xs">
                            <PlayCircle size={12} className="mr-1" />
                            <span>{getTranslation(motherLanguage, 'available')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400 bg-gray-900/30 px-2 py-1 rounded-lg text-xs">
                            <Lock size={12} className="mr-1" />
                            <span>{getTranslation(motherLanguage, 'locked')}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-white/60 text-sm">
                        {isCompleted 
                          ? getTranslation(motherLanguage, 'completedText')
                          : isUnlocked 
                            ? getTranslation(motherLanguage, 'clickToStartText')
                            : getTranslation(motherLanguage, 'completePreviousText')}
                      </p>
                    </button>
                  );
                })}
                </div>
              </>
            )}
          </div>
        </AppPanel>
      </div>
    </PanelBackdrop>
  );
};

export default ScenarioSelectionPanel;

