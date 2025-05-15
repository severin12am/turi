import React, { useState, useEffect } from 'react';
import { useStore } from './store/index';
import CityScene from './scenes/City';
import HelperRobot from './components/HelperRobot';
import LoginForm from './components/LoginForm';
import { supabase } from './services/supabase';
import { logger } from './services/logger';
import { login, signUp } from './services/auth';
import HelperRobotPanel from './components/HelperRobotPanel';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [panelInstructions, setPanelInstructions] = useState<Record<string, string>>({ mode: "language_selection" });
  const [robotInstructions, setRobotInstructions] = useState<Record<string, string>>({});
  const [showHelperRobotPanel, setShowHelperRobotPanel] = useState(false);
  const { 
    isLanguageSelected,
    setUser,
    setIsLoggedIn,
    setLanguages,
    motherLanguage,
    targetLanguage,
    initializeModels,
    user,
    setIsAuthenticated,
    resetState,
    isLoggedIn,
    toggleHelperRobot,
    isHelperRobotOpen,
    setIsLanguageSelected
  } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  // Ensure isHelperRobotOpen is reset when App mounts
  useEffect(() => {
    // If the helper robot panel is open from a previous session,
    // close it so we can properly control its visibility
    if (isHelperRobotOpen) {
      toggleHelperRobot();
    }
  }, [isHelperRobotOpen, toggleHelperRobot]);

  useEffect(() => {
    initializeModels();
  }, []);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        // Use our simplified auth approach - check if there's a user in local storage
        const savedUser = localStorage.getItem('turi_user');
        
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            logger.info('User found in local storage', { username: userData.username });
            setUser(userData);
            setIsLoggedIn(true);
            setIsAuthenticated(true);
            
            // Set the selected languages based on the saved user preferences
            if (userData.mother_language && userData.target_language) {
              setLanguages(
                userData.mother_language as 'en' | 'ru', 
                userData.target_language as 'en' | 'ru'
              );
            }
            
            // Show the helper robot panel automatically for returning users
            setShowHelperRobotPanel(true);
          } catch (e) {
            logger.error('Error parsing saved user data', { error: e });
            localStorage.removeItem('turi_user');
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        logger.error('Error checking session', { error });
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, [setIsAuthenticated, setUser, setIsLoggedIn, setLanguages]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const user = await login(email, password);
      
      // Save user to local storage
      localStorage.setItem('turi_user', JSON.stringify(user));
      
      setUser(user);
      setIsLoggedIn(true);
      setIsAuthenticated(true);
      setShowLogin(false);
      
      // Set languages based on user preferences
      setLanguages(user.mother_language, user.target_language);
      
      // Clear language selection instructions and set to logged in mode
      setRobotInstructions({
        mode: "logged_in",
        message: "Click me to see your progress!"
      });
      
      // Show the helper robot panel after login
      setShowHelperRobotPanel(true);
      // Set language as selected to prevent language panel from showing
      setIsLanguageSelected(true);
      
      logger.info('User logged in successfully', { email });
    } catch (error) {
      logger.error('Login failed', { error });
      throw new Error('Login failed');
    }
  };

  const handleCreateAccount = async (email: string, password: string) => {
    try {
      // Use our custom signup function with mother and target language
      const user = await signUp(
        email, 
        password,
        motherLanguage || 'en', 
        targetLanguage || 'ru'
      );
      
      // Save user to local storage
      localStorage.setItem('turi_user', JSON.stringify(user));
      
      setUser(user);
      setIsLoggedIn(true);
      setIsAuthenticated(true);
      setShowLogin(false);
      
      // Clear language selection instructions and set to logged in mode
      setRobotInstructions({
        mode: "logged_in",
        message: "Click me to see your progress!"
      });
      
      // Show the helper robot panel after creating an account
      setShowHelperRobotPanel(true);
      // Set language as selected to prevent language panel from showing
      setIsLanguageSelected(true);
      
      logger.info('Account created successfully', { email });
    } catch (error) {
      logger.error('Account creation failed', { error });
      throw new Error('Account creation failed');
    }
  };

  const handleLanguageSelect = async (mother: string, target: string) => {
    setLanguages(mother as 'en' | 'ru', target as 'en' | 'ru');
    setIsLanguageSelected(true);
    
    // If user is logged in, initialize a language level for this new language pair
    if (isLoggedIn && user?.id) {
      try {
        console.log("🔧 App: Initializing language level for new language pair");
        // Import needed functions
        const { initializeLanguageLevel } = await import('./services/auth');
        
        // Initialize a language level for this new language pair
        await initializeLanguageLevel(user.id, target, mother);
        
        console.log("🔧 App: Successfully initialized language level for new language pair");
      } catch (error) {
        console.error("🔧 App: Error initializing language level for new language pair:", error);
      }
    }
    
    logger.info('Language selection', { mother, target });
  };

  const handleLanguageSelectRobot = async (mother: string, target: string) => {
    console.log("🔧 App: Handling language selection for user", 
      { mother, target, isLoggedIn: isLoggedIn, userId: user?.id });
    
    // Correctly set the languages in their proper fields
    setLanguages(mother as 'en' | 'ru', target as 'en' | 'ru');
    setIsLanguageSelected(true);
    
    // If user is logged in, handle language level creation or selection
    if (isLoggedIn && user?.id) {
      try {
        console.log("🔧 App: Handling language selection for logged-in user", user.id);
        // Import needed functions
        const { initializeLanguageLevel, getLanguageLevel } = await import('./services/auth');
        
        // First check if the user already has a language level for this pair
        try {
          // Important: Here we need to check for the EXACT mother/target language combo
          const { data, error } = await supabase
            .from('language_levels')
            .select('*')
            .eq('user_id', user.id)
            .eq('target_language', target)
            .eq('mother_language', mother)
            .single();
            
          if (!error && data) {
            console.log("🔧 App: Existing language level found:", data);
            
            // If we found a level, no need to create a new one - just reuse it
            console.log("🔧 App: Using existing language level, preserving progress");
            return;
          }
          
        } catch (error) {
          console.log("🔧 App: No existing language level found, will create new one");
        }
        
        // Initialize a language level for this new language pair
        // Pass the correct mother and target languages in the right order
        await initializeLanguageLevel(user.id, target, mother);
        
        console.log("🔧 App: Successfully initialized language level for new language pair");
      } catch (error) {
        console.error("🔧 App: Error initializing language level for new language pair:", error);
      }
    }
    
    logger.info('Language selection from robot', { mother, target });
  };

  const handleLoginClickRobot = () => {
    console.log("🔧 App: Login button clicked from robot");
    setShowLogin(true);
    // Clear robot instructions to hide the language selection panel
    setRobotInstructions({});
  };

  const handleRobotClick = () => {
    console.log("🔧 App: Helper robot clicked handler called");
    
    // Simply toggle the panel visibility when the robot is clicked
    setShowHelperRobotPanel(prev => !prev);
    logger.info(`Helper robot clicked - ${showHelperRobotPanel ? 'hiding' : 'showing'} panel`);
  };

  const handleCloseHelperRobotPanel = () => {
    setShowHelperRobotPanel(false);
  };

  // Add debug effect for detecting clicks
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const classes = elements.map(el => el.className).join(', ');
      console.log(`🔍 Global click at (${e.clientX}, ${e.clientY}) - Elements:`, classes);
    };
    
    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('click', handleGlobalClick);
      console.log("🔧 Added global click debug handler");
    }
    
    return () => {
      if (process.env.NODE_ENV === 'development') {
        window.removeEventListener('click', handleGlobalClick);
      }
    };
  }, []);

  // Add an effect to ensure the helper robot is always visible
  useEffect(() => {
    const ensureHelperRobotVisible = () => {
      console.log("🔧 Ensuring helper robot is visible");
      
      // Ensure the helper robot container is properly displayed
      const robotContainer = document.querySelector('.helper-robot-container');
      if (robotContainer) {
        // Make sure it's visible
        (robotContainer as HTMLElement).style.display = 'block';
        (robotContainer as HTMLElement).style.opacity = '1';
        
        console.log("🔧 Helper robot container found and visibility enforced");
      } else {
        console.log("⚠️ Helper robot container not found in DOM");
      }
    };
    
    // Run immediately
    ensureHelperRobotVisible();
    
    // Also run after a short delay to catch any delayed rendering issues
    const timeoutId = setTimeout(ensureHelperRobotVisible, 500);
    
    return () => clearTimeout(timeoutId);
  }, [isLoggedIn]); // Re-run this when login state changes

  // Listen for the custom showLanguageSelection event
  useEffect(() => {
    const handleShowLanguageSelection = (event: CustomEvent) => {
      console.log("🔧 App: Received showLanguageSelection event", event.detail);
      
      // Show the language selection panel
      setRobotInstructions({
        mode: "language_selection"
      });
      
      // Hide the helper robot panel
      setShowHelperRobotPanel(false);
      
      // Mark language as unselected to fully reset the state
      // But don't log the user out
      setIsLanguageSelected(false);
      
      // Log the current state to help with debugging
      console.log("🔧 Language selection panel state after reset:", {
        isLoggedIn,
        isLanguageSelected: false,
        robotInstructions: { mode: "language_selection" }
      });
    };
    
    // Add event listener
    window.addEventListener('showLanguageSelection', handleShowLanguageSelection as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('showLanguageSelection', handleShowLanguageSelection as EventListener);
    };
  }, []);

  // Update robot instructions based on application state
  useEffect(() => {
    // If user is not logged in and hasn't selected a language, show first-time instructions
    if (!isLoggedIn && !isLanguageSelected) {
      console.log("🔧 Setting helper robot instructions for first-time user");
      setRobotInstructions({
        mode: "language_selection"  // This enables the animated language selection panel
      });
      // Reset helper robot panel visibility to ensure no panel conflict
      setShowHelperRobotPanel(false);
      
      // IMPORTANT: Make sure the language panel appears immediately for new users
      // by setting the panel instructions directly
      setPanelInstructions({ mode: "language_selection" });
    } 
    // If user is logged in, show returning user instructions
    else if (isLoggedIn) {
      console.log("🔧 Setting helper robot instructions for logged-in user");
      setRobotInstructions({
        mode: "logged_in",
        message: "Click me to see your progress!"
      });
    }
    // If language is selected but not logged in
    else if (isLanguageSelected && !isLoggedIn) {
      console.log("🔧 Setting helper robot instructions for language-selected user");
      setRobotInstructions({
        mode: "language_selected",
        message: "Click me to create an account!"
      });
      // Reset helper robot panel visibility
      setShowHelperRobotPanel(false);
    }
  }, [isLoggedIn, isLanguageSelected]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  // Debug panel state
  console.log("🔧 App state:", {
    isLoggedIn,
    showHelperRobotPanel,
    isHelperRobotOpen,
    panelInstructions,
    robotInstructions,
    isLanguageSelected,
    showLogin
  });

  return (
    <div className="relative min-h-screen bg-gray-900">
      {/* Background Scene */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <CityScene />
      </div>

      {/* Foreground Layer */}
      <div className="relative z-10">
        {/* Helper Robot - ALWAYS VISIBLE WITH CONSISTENT Z-INDEX - This should be the ONLY instance */}
        <div className="fixed top-10 left-10 z-50 pointer-events-auto" style={{ pointerEvents: 'auto' }}>
          <HelperRobot
            instructions={robotInstructions}
            onLanguageSelect={handleLanguageSelectRobot}
            onLogin={handleLoginClickRobot}
            onClick={handleRobotClick}
          />
        </div>

        {/* Optional UI Elements */}
        {/* Helper Robot Panel - Show for logged in users */}
        {isLoggedIn && showHelperRobotPanel && (
          <div className="fixed inset-0 flex items-center justify-center z-40" style={{ pointerEvents: 'auto' }}>
            <HelperRobotPanel onClose={handleCloseHelperRobotPanel} />
          </div>
        )}

        {/* Login Panel - Higher z-index to ensure it appears above the language selection */}
        {showLogin && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm" style={{ pointerEvents: 'auto' }}>
            <div className="max-w-sm w-full">
              <LoginForm
                onLogin={handleLogin}
                onCreateAccount={handleCreateAccount}
                onClose={() => {
                  setShowLogin(false);
                  // Restore robot instructions to show language selection panel again
                  if (!isLoggedIn && !isLanguageSelected) {
                    setRobotInstructions({
                      mode: "language_selection"
                    });
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;