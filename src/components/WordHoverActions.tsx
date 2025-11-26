import React from 'react';
import { Search, Volume2, Info, BookMarked } from 'lucide-react';

interface WordHoverActionsProps {
  word: string;
  isVisible: boolean;
  position: { x: number; y: number };
  onGoogleSearch: (word: string) => void;
  onPlaySound: (word: string) => void;
  onShowExplanation: (word: string) => void;
  onAddToDictionary: (word: string) => void;
  isUserLoggedIn: boolean;
  isAddingToDictionary?: boolean;
}

const WordHoverActions: React.FC<WordHoverActionsProps> = ({
  word,
  isVisible,
  position,
  onGoogleSearch,
  onPlaySound,
  onShowExplanation,
  onAddToDictionary,
  isUserLoggedIn,
  isAddingToDictionary = false
}) => {
  // console.log('🎯 WordHoverActions render:', { word, isVisible, position }); // Debug log
  if (!isVisible) return null;

  // Position above the hovered word with proper bounds
  const safeX = Math.max(80, Math.min(position.x, window.innerWidth - 80));
  const safeY = Math.max(10, position.y - 60); // 60px above the word, minimum 10px from top
  
  // DEBUG: Log all positioning info
  console.log('🎯 POSITIONING DEBUG:', {
    originalPosition: position,
    windowSize: { width: window.innerWidth, height: window.innerHeight },
    calculatedPosition: { safeX, safeY },
    isVisible,
    word
  });

  return (
    <div
      className="word-hover-actions"
      style={{
        position: 'fixed',
        left: `${safeX}px`,
        top: `${safeY}px`,
        transform: 'translateX(-50%)',
        zIndex: 999999,
        backgroundColor: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        padding: '8px',
        display: 'flex',
        gap: '4px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
      onMouseEnter={() => console.log('🖱️ Entered hover actions')}
      onMouseLeave={() => console.log('🖱️ Left hover actions')}
    >
      {/* Google Search Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('🔍 Google search clicked for:', word);
          onGoogleSearch(word);
        }}
        style={{
          padding: '8px',
          border: 'none',
          borderRadius: '6px',
          backgroundColor: '#dbeafe',
          color: '#1d4ed8',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Search in Google"
      >
        <Search size={16} />
      </button>

      {/* Sound Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('🔊 Sound clicked for:', word);
          onPlaySound(word);
        }}
        style={{
          padding: '8px',
          border: 'none',
          borderRadius: '6px',
          backgroundColor: '#dcfce7',
          color: '#15803d',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Play pronunciation"
      >
        <Volume2 size={16} />
      </button>

      {/* Explanation Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('ℹ️ Explanation clicked for:', word);
          onShowExplanation(word);
        }}
        style={{
          padding: '8px',
          border: 'none',
          borderRadius: '6px',
          backgroundColor: '#fae8ff',
          color: '#9333ea',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Show explanation"
      >
        <Info size={16} />
      </button>

      {/* Add to Dictionary Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('📚 Add to dictionary clicked for:', word);
          onAddToDictionary(word);
        }}
        disabled={!isUserLoggedIn || isAddingToDictionary}
        style={{
          padding: '8px',
          border: 'none',
          borderRadius: '6px',
          backgroundColor: !isUserLoggedIn ? '#f3f4f6' : '#fef3c7',
          color: !isUserLoggedIn ? '#9ca3af' : '#92400e',
          cursor: !isUserLoggedIn ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: !isUserLoggedIn ? 0.5 : 1,
        }}
        title={!isUserLoggedIn ? getTranslation(motherLanguage, 'signInToAddWords') : getTranslation(motherLanguage, 'addToDictionary')}
      >
        {isAddingToDictionary ? '⏳' : <BookMarked size={16} />}
      </button>
    </div>
  );
};

export default WordHoverActions; 