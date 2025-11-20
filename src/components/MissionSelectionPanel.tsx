/**
 * Mission Selection Panel
 * Shows 5 missions for a selected scenario
 */

import React, { useState, useEffect } from 'react';
import { X, Target, Check, Lock } from 'lucide-react';
import { useStore } from '../store';
import AppPanel from './AppPanel';
import { PanelBackdrop } from './AppPanel';
import { PanelTitle } from './PanelElements';
import { getMissionsForScenario, Mission } from '../constants/missions';
import { getScenarioName } from '../constants/scenarios';
import { getTranslation } from '../constants/translations';
import { logger } from '../services/logger';
import { supabase } from '../services/supabase';

interface MissionSelectionPanelProps {
  scenarioNumber: number;
  characterId: number;
  onMissionSelect: (mission: Mission) => void;
  onBack: () => void;
}

const MissionSelectionPanel: React.FC<MissionSelectionPanelProps> = ({
  scenarioNumber,
  characterId,
  onMissionSelect,
  onBack
}) => {
  const { motherLanguage, user } = useStore();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [completedMissions, setCompletedMissions] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMissions = async () => {
      setIsLoading(true);
      
      try {
        // Get missions for this scenario
        const scenarioMissions = getMissionsForScenario(scenarioNumber);
        setMissions(scenarioMissions);

        logger.info('[MissionSelection] Loaded missions', { 
          scenarioNumber, 
          missionCount: scenarioMissions.length 
        });

        // Load completed missions from database
        if (user?.id) {
          const { data: completedData, error } = await supabase
            .from('mission_completions')
            .select('mission_number')
            .eq('user_id', user.id)
            .eq('scenario_number', scenarioNumber);
          
          if (!error && completedData) {
            const completed = new Set(completedData.map(m => m.mission_number));
            setCompletedMissions(completed);
            logger.info('[MissionSelection] Loaded completed missions', { 
              scenarioNumber,
              completed: Array.from(completed) 
            });
          } else if (error) {
            logger.error('[MissionSelection] Error loading completed missions', { error });
            setCompletedMissions(new Set());
          }
        } else {
          setCompletedMissions(new Set());
        }

      } catch (error) {
        logger.error('[MissionSelection] Error loading missions', { error });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMissions();
  }, [scenarioNumber, user?.id]);

  const handleMissionClick = (mission: Mission) => {
    logger.info('[MissionSelection] Mission selected', { 
      missionId: mission.id, 
      goal: mission.goal 
    });
    onMissionSelect(mission);
  };

  const handleBackClick = () => {
    logger.info('[MissionSelection] Back button clicked');
    onBack();
  };

  const isMissionCompleted = (missionId: number): boolean => {
    return completedMissions.has(missionId);
  };

  // Sequential mission unlocking: Mission N requires Mission N-1 to be completed
  const isMissionUnlocked = (missionNumber: number): boolean => {
    // Mission 1 is always unlocked
    if (missionNumber === 1) return true;
    
    // Other missions require previous mission to be completed
    const previousMissionCompleted = completedMissions.has(missionNumber - 1);
    
    logger.info('[MissionSelection] Checking unlock status', {
      missionNumber,
      previousMissionCompleted,
      completedMissions: Array.from(completedMissions)
    });
    
    return previousMissionCompleted;
  };

  return (
    <PanelBackdrop style={{ zIndex: 10000 }}>
      <div style={{ pointerEvents: 'auto' }}>
        <AppPanel width="700px" height="auto" padding={0}>
          {/* Header */}
          <div className="p-4 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackClick}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
              >
                ← {getTranslation(motherLanguage, 'back')}
              </button>
              <PanelTitle className="m-0">
                {getTranslation(motherLanguage, 'missions')} - {getScenarioName(scenarioNumber)}
              </PanelTitle>
            </div>
            <button
              onClick={handleBackClick}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6" style={{ pointerEvents: 'auto' }}>
            {isLoading ? (
              <div className="py-4 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-white/70">{getTranslation(motherLanguage, 'loading')}</p>
              </div>
            ) : (
              <>
                {/* Description */}
                <div className="mb-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                  <p className="text-white/90 text-sm">
                    {getTranslation(motherLanguage, 'missionDescription')}
                  </p>
                </div>

                {/* Missions Grid */}
                <div className="space-y-3">
                  {missions.map((mission) => {
                    const isCompleted = isMissionCompleted(mission.id);
                    const isUnlocked = isMissionUnlocked(mission.missionNumber);

                    return (
                      <button
                        key={mission.id}
                        onClick={() => isUnlocked && handleMissionClick(mission)}
                        disabled={!isUnlocked}
                        className={`w-full text-left relative rounded-xl p-4 transition-all duration-300 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 hover:border-green-500/50'
                            : isUnlocked
                            ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-500/50 hover:from-purple-600/30 hover:to-pink-600/30'
                            : 'bg-white/5 opacity-70 cursor-not-allowed border border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Target size={16} className={isCompleted ? 'text-green-400' : 'text-purple-400'} />
                              <span className="text-white font-medium">
                                {getTranslation(motherLanguage, 'mission')} {mission.missionNumber}
                              </span>
                            </div>
                            <p className="text-white/90 text-sm mb-1">
                              {mission.goal}
                            </p>
                            <p className="text-white/60 text-xs">
                              {getTranslation(motherLanguage, 'talkingTo')}: {mission.npcRole}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div className={`flex items-center px-3 py-1 rounded-lg text-xs ml-4 ${
                            isCompleted
                              ? 'text-green-300 bg-green-900/30'
                              : isUnlocked
                              ? 'text-purple-300 bg-purple-900/30'
                              : 'text-gray-400 bg-gray-900/30'
                          }`}>
                            {isCompleted ? (
                              <>
                                <Check size={14} className="mr-1" />
                                <span>{getTranslation(motherLanguage, 'completed')}</span>
                              </>
                            ) : isUnlocked ? (
                              <>
                                <Target size={14} className="mr-1" />
                                <span>{getTranslation(motherLanguage, 'start')}</span>
                              </>
                            ) : (
                              <>
                                <Lock size={14} className="mr-1" />
                                <span>{getTranslation(motherLanguage, 'locked')}</span>
                              </>
                            )}
                          </div>
                        </div>
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

export default MissionSelectionPanel;

