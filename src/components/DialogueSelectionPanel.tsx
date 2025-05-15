import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { logger } from '../services/logger';
import { Lock, Check, PlayCircle, RefreshCcw } from 'lucide-react';
import { useStore } from '../store';
import { getCompletedDialogues } from '../services/auth';

// Add translations for DialogueSelectionPanel
const dialogueTranslations = {
  en: {
    selectDialogue: 'Select Dialogue',
    loadingDialogues: 'Loading dialogues...',
    errorTitle: 'Error',
    close: 'Close',
    cancel: 'Cancel',
    completed: 'Completed',
    completePrerequisite: 'Complete previous dialogue',
    dialogue: 'Dialogue',
  },
  ru: {
    selectDialogue: 'Выберите диалог',
    loadingDialogues: 'Загрузка диалогов...',
    errorTitle: 'Ошибка',
    close: 'Закрыть',
    cancel: 'Отмена',
    completed: 'Пройдено',
    completePrerequisite: 'Завершите предыдущий диалог',
    dialogue: 'Диалог',
  },
  es: {
    selectDialogue: 'Seleccionar diálogo',
    loadingDialogues: 'Cargando diálogos...',
    errorTitle: 'Error',
    close: 'Cerrar',
    cancel: 'Cancelar',
    completed: 'Completado',
    completePrerequisite: 'Completa el diálogo anterior',
    dialogue: 'Diálogo',
  },
  fr: {
    selectDialogue: 'Sélectionner un dialogue',
    loadingDialogues: 'Chargement des dialogues...',
    errorTitle: 'Erreur',
    close: 'Fermer',
    cancel: 'Annuler',
    completed: 'Terminé',
    completePrerequisite: 'Terminez le dialogue précédent',
    dialogue: 'Dialogue',
  },
  de: {
    selectDialogue: 'Dialog auswählen',
    loadingDialogues: 'Dialoge werden geladen...',
    errorTitle: 'Fehler',
    close: 'Schließen',
    cancel: 'Abbrechen',
    completed: 'Abgeschlossen',
    completePrerequisite: 'Vorherigen Dialog abschließen',
    dialogue: 'Dialog',
  },
  // Add more languages as needed
};

interface DialogueSelectionPanelProps {
  characterId: number;
  onDialogueSelect: (dialogueId: number) => void;
  onClose: () => void;
}

interface DialogueProgress {
  dialogue_id: number;
  completed: boolean;
  score?: number;
}

const DialogueSelectionPanel: React.FC<DialogueSelectionPanelProps> = ({
  characterId,
  onDialogueSelect,
  onClose
}) => {
  const [availableDialogues, setAvailableDialogues] = useState<number[]>([]);
  const [completedDialogues, setCompletedDialogues] = useState<DialogueProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());
  
  const { user, motherLanguage } = useStore();
  
  // Get translations based on mother language
  const t = dialogueTranslations[motherLanguage as keyof typeof dialogueTranslations] || dialogueTranslations.en;
  
  // Function to fetch dialogues that can be called directly
  const fetchDialogues = async () => {
    setIsLoading(true);
    
    try {
      // Changed from 'dialogue_phrases' to `phrases_${characterId}`
      const sourceTable = `phrases_${characterId}`;
      
      // Fetch all unique dialogue IDs for this character
      const { data: dialogueData, error } = await supabase
        .from(sourceTable)
        .select('dialogue_id');
        
      if (error) {
        logger.error('Error fetching dialogues', { error });
        setError('Failed to fetch dialogues');
        return;
      }
      
      // Extract and sort unique dialogue IDs
      const uniqueDialogueIds = [...new Set(dialogueData?.map(item => item.dialogue_id) || [])]
        .sort((a, b) => a - b);
        
      setAvailableDialogues(uniqueDialogueIds);
      
      // DEBUG: Log the user ID and unique dialogue IDs
      console.log("DialogueSelectionPanel - Available dialogues:", uniqueDialogueIds);
      console.log("DialogueSelectionPanel - Current user:", user?.id);
      
      // Fetch user progress if logged in
      if (user?.id) {
        try {
          // Get progress from language_levels with both user_id and target_language filters
          const { data: languageLevel, error: progressError } = await supabase
            .from('language_levels')
            .select('dialogue_number')
            .eq('user_id', user.id)
            .eq('target_language', useStore.getState().targetLanguage)
            .single();
          
          // DEBUG: Log the raw progress data
          console.log("DialogueSelectionPanel - User language level data:", languageLevel);
          
          if (progressError) {
            logger.error('Error fetching language level', { error: progressError });
            setCompletedDialogues([]);
            return;
          }
          
          // Check if we have a dialogue_number available
          if (languageLevel && languageLevel.dialogue_number && languageLevel.dialogue_number > 0) {
            // Convert to our DialogueProgress format
            const progressData: DialogueProgress[] = [];
            
            // Mark all dialogues up to dialogue_number as completed
            for (let i = 1; i <= languageLevel.dialogue_number; i++) {
              progressData.push({
                dialogue_id: i,
                completed: true,
                score: 100 // Default score since we don't track per dialogue scores
              });
            }
            
            setCompletedDialogues(progressData);
            console.log("DialogueSelectionPanel - Generated progress data:", progressData);
          } else {
            // No progress
            setCompletedDialogues([]);
          }
        } catch (progressError) {
          logger.error('Error processing user progress', { error: progressError });
          // Still continue with empty progress
          setCompletedDialogues([]);
        }
      } else {
        // If no user is logged in, check local storage for anonymous progress
        try {
          const { getAnonymousProgress } = await import('../services/auth');
          const anonymousProgress = getAnonymousProgress();
          
          console.log("DialogueSelectionPanel - Anonymous progress:", anonymousProgress);
          
          if (anonymousProgress && anonymousProgress.dialogues) {
            // Convert to our DialogueProgress format
            const progressData = anonymousProgress.dialogues.map((item: any) => ({
              dialogue_id: item.dialogueId,
              completed: item.completed,
              score: item.score
            }));
            
            setCompletedDialogues(progressData);
            console.log("DialogueSelectionPanel - Anonymous progress converted:", progressData);
          } else {
            setCompletedDialogues([]);
          }
        } catch (error) {
          logger.error('Error fetching anonymous progress', { error });
          setCompletedDialogues([]);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch dialogues', { error });
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setLastRefreshed(Date.now());
    }
  };
  
  // Function to manually refresh progress data
  const refreshProgress = async () => {
    console.log("DialogueSelectionPanel - Manually refreshing progress data");
    await fetchDialogues();
  };
  
  // Fetch dialogues when component mounts or when user changes
  useEffect(() => {
    fetchDialogues();
  }, [characterId, user?.id]);
  
  // Effect to refresh data when panel becomes visible
  useEffect(() => {
    // Refresh immediately when panel is shown
    refreshProgress();
    
    // No need for automatic interval - it causes too many database queries
  }, []); // Empty dependency array means this runs once when component mounts
  
  // Check if a dialogue is unlocked
  const isDialogueUnlocked = (dialogueId: number): boolean => {
    // Always unlock the first dialogue
    if (dialogueId === 1) return true;
    
    // For other dialogues, check if the dialogue_number in language_levels is at least dialogueId - 1
    // This means that the previous dialogue has been completed
    const highestCompletedDialogue = completedDialogues.reduce((max, dialogue) => 
      Math.max(max, dialogue.dialogue_id || 0), 0);
    
    // A dialogue is unlocked if its number is <= the highest completed dialogue + 1
    const isUnlocked = dialogueId <= highestCompletedDialogue + 1;
    
    // DEBUG: Log the unlock status
    console.log(`DialogueSelectionPanel - Dialogue ${dialogueId} unlock status:`, isUnlocked, 
      `(highest completed: ${highestCompletedDialogue}, unlock threshold: ${highestCompletedDialogue + 1})`);
    
    return isUnlocked;
  };
  
  // Check if a dialogue is completed
  const isDialogueCompleted = (dialogueId: number): boolean => {
    const isCompleted = completedDialogues.some(dialogue => 
      dialogue.dialogue_id === dialogueId && dialogue.completed
    );
    
    // DEBUG: Log the completion status
    console.log(`DialogueSelectionPanel - Dialogue ${dialogueId} completion status:`, isCompleted);
    
    return isCompleted;
  };
  
  // Handle dialogue selection
  const handleDialogueSelect = (dialogueId: number, event: React.MouseEvent) => {
    // Stop event propagation to prevent issues with nested elements
    event.stopPropagation();
    
    console.log(`Dialogue ${dialogueId} selected, unlocked: ${isDialogueUnlocked(dialogueId)}`);
    if (isDialogueUnlocked(dialogueId)) {
      onDialogueSelect(dialogueId);
    } else {
      // Provide feedback that the dialogue is locked
      logger.info('Attempted to select locked dialogue', { dialogueId });
    }
  };
  
  // Handle close button click
  const handleClose = (event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('Close button clicked');
    onClose();
  };
  
  // Handle backdrop click - only close if clicking outside the panel
  const handleBackdropClick = (event: React.MouseEvent) => {
    // Only close if clicking directly on the backdrop
    if (event.target === event.currentTarget) {
      console.log('Backdrop clicked - closing panel');
      onClose();
    }
  };
  
  // DEBUG: Function to manually mark dialogue 1 as completed
  const manuallyMarkDialogueComplete = async (dialogueId: number) => {
    try {
      if (!user?.id) {
        console.error("No user logged in, cannot mark dialogue as completed");
        return;
      }
      
      console.log(`Manually marking dialogue ${dialogueId} as completed for user ${user.id}`);
      
      // Define words per dialogue
      const dialogueWordCounts: Record<number, number> = {
        1: 7, 2: 6, 3: 7, 4: 7, 5: 7,
        6: 8, 7: 8, 8: 8, 9: 8, 10: 8
      };
      
      // Calculate word progress for this dialogue
      let totalWords = 0;
      for (let i = 1; i <= dialogueId; i++) {
        totalWords += dialogueWordCounts[i] || 7; // Default to 7 words
      }
      
      // Update language_levels table directly
      const { data, error } = await supabase
        .from('language_levels')
        .upsert({
          user_id: user.id,
          target_language: useStore.getState().targetLanguage || 'en',
          word_progress: totalWords,
          dialogue_number: dialogueId,
          level: dialogueId <= 5 ? 1 : Math.floor((dialogueId - 1) / 5) + 1,
        });
        
      if (error) {
        console.error("Failed to manually update language level:", error);
      } else {
        console.log("Successfully manually marked dialogue as completed:", data);
        
        // Refresh the dialogue list to show updated progress
        const { data: languageLevel, error: refreshError } = await supabase
          .from('language_levels')
          .select('dialogue_number')
          .eq('user_id', user.id)
          .eq('target_language', useStore.getState().targetLanguage)
          .single();
          
        if (refreshError) {
          console.error("Error refreshing language level data:", refreshError);
        } else {
          console.log("Refreshed language level data:", languageLevel);
          
          // Generate progress data based on dialogue_number
          if (languageLevel && languageLevel.dialogue_number > 0) {
            const progressData: DialogueProgress[] = [];
            
            // Mark all dialogues up to dialogue_number as completed
            for (let i = 1; i <= languageLevel.dialogue_number; i++) {
              progressData.push({
                dialogue_id: i,
                completed: true,
                score: 100 // Default score 
              });
            }
            
            setCompletedDialogues(progressData);
            console.log("DialogueSelectionPanel - Refreshed progress data:", progressData);
          }
        }
      }
    } catch (error) {
      console.error("Error in manual dialogue completion:", error);
    }
  };
  
  // DEBUG: Add a button to set test user
  const setTestUserAndRefresh = async () => {
    if (process.env.NODE_ENV === 'development') {
      try {
        const { setTestUser } = useStore.getState();
        setTestUser();
        console.log("Set test user and refreshing dialogue list");
        
        // Wait a moment to let the state update
        setTimeout(async () => {
          const { user } = useStore.getState();
          console.log("Current user after test user set:", user);
          
          if (user?.id) {
            const { data: languageLevel, error: refreshError } = await supabase
              .from('language_levels')
              .select('dialogue_number')
              .eq('user_id', user.id)
              .eq('target_language', useStore.getState().targetLanguage)
              .single();
              
            if (refreshError) {
              console.error("Error refreshing language level data:", refreshError);
            } else {
              console.log("Refreshed language level data:", languageLevel);
              
              // Generate progress data based on dialogue_number
              if (languageLevel && languageLevel.dialogue_number > 0) {
                const progressData: DialogueProgress[] = [];
                
                // Mark all dialogues up to dialogue_number as completed
                for (let i = 1; i <= languageLevel.dialogue_number; i++) {
                  progressData.push({
                    dialogue_id: i,
                    completed: true,
                    score: 100 // Default score 
                  });
                }
                
                setCompletedDialogues(progressData);
                console.log("DialogueSelectionPanel - Refreshed progress data:", progressData);
              }
            }
          }
        }, 500);
      } catch (error) {
        console.error("Error setting test user:", error);
      }
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center z-[1000] bg-black/40 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="w-full max-w-md p-8 shadow-2xl rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white pointer-events-auto">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
            <p>{t.loadingDialogues}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center z-[1000] bg-black/40 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div 
          className="w-full max-w-md p-8 shadow-2xl rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-4">{t.errorTitle}</h2>
          <p className="mb-6">{error}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose(e);
            }}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-lg transition-colors font-medium pointer-events-auto"
            type="button"
          >
            {t.close}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{t.selectDialogue}</h2>
          
          {/* Add refresh button */}
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                refreshProgress();
              }}
              className="p-2 rounded-full hover:bg-slate-700 transition-colors pointer-events-auto"
              title="Refresh progress"
              disabled={isLoading}
            >
              <RefreshCcw 
                size={20} 
                className={`text-slate-300 ${isLoading ? 'animate-spin' : 'hover:text-white'}`} 
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose(e);
              }}
              className="p-2 rounded-full hover:bg-slate-700 transition-colors pointer-events-auto"
            >
              <span className="text-2xl text-slate-300 hover:text-white">&times;</span>
            </button>
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          {availableDialogues.map((dialogueId) => {
            const isUnlocked = isDialogueUnlocked(dialogueId);
            const isCompleted = isDialogueCompleted(dialogueId);
            
            return (
              <div 
                key={dialogueId}
                className={`p-4 rounded-lg border transition-colors flex items-center justify-between relative overflow-hidden pointer-events-auto
                  ${isUnlocked 
                    ? 'border-indigo-500 hover:border-indigo-400 cursor-pointer' 
                    : 'border-slate-700 bg-slate-800/50 cursor-not-allowed'}
                  ${isCompleted ? 'bg-indigo-900/20' : 'bg-slate-800/80'}
                `}
                onClick={(e) => handleDialogueSelect(dialogueId, e)}
              >
                <div className="flex items-center space-x-3">
                  {isCompleted ? (
                    <div className="bg-green-500/20 border border-green-500 rounded-full p-1.5">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  ) : isUnlocked ? (
                    <div className="bg-indigo-500/20 border border-indigo-500 rounded-full p-1.5">
                      <PlayCircle className="w-5 h-5 text-indigo-500" />
                    </div>
                  ) : (
                    <div className="bg-slate-700/50 border border-slate-600 rounded-full p-1.5">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <span className="font-medium">{t.dialogue} {dialogueId}</span>
                </div>
                
                {isCompleted && (
                  <div className="text-green-500 text-sm flex items-center">
                    <span>{t.completed}</span>
                  </div>
                )}
                
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex items-center bg-slate-900/90 px-4 py-2 rounded-lg border border-slate-700">
                      <Lock className="w-4 h-4 mr-2 text-slate-400" />
                      <span className="text-sm font-medium">{t.completePrerequisite}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Debug button to manually complete dialogue 1 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-3 border-t border-slate-700">
              <button
                onClick={() => manuallyMarkDialogueComplete(1)}
                className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-500 text-white font-medium rounded-lg mb-2"
                type="button"
              >
                DEBUG: Mark Dialogue 1 Complete
              </button>
              
              <button
                onClick={setTestUserAndRefresh}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg mb-2"
                type="button"
              >
                DEBUG: Set Test User
              </button>
              
              <p className="text-xs text-slate-400 text-center">
                These buttons are only visible in development mode.
              </p>
            </div>
          )}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose(e);
          }}
          className="w-full py-3 bg-gradient-to-r from-rose-700 to-pink-700 hover:from-rose-600 hover:to-pink-600 text-white rounded-lg transition-colors font-medium pointer-events-auto"
          type="button"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
};

export default DialogueSelectionPanel; 