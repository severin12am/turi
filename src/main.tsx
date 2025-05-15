import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactDOMCompat from 'react-dom';  // Import the old ReactDOM for compatibility
import App from './App';
import './index.css';
import { useStore } from './store';
import VocalQuizComponent from './components/VocalQuizComponent';

// Expose React and ReactDOM globally for testing tools
if (typeof window !== 'undefined') {
  window.React = React;
  window.ReactDOM = ReactDOMCompat;  // Use the compat version for render method
  window.VocalQuizComponent = VocalQuizComponent;
  console.log('React, ReactDOM, and VocalQuizComponent exposed to window object');
}

// Initialize store with default language settings
// but preserve any existing login state
const state = useStore.getState();
// Only initialize languages if not already selected
// We'll let App component handle showing the selection panel based on this state
if (!state.isLanguageSelected) {
  console.log('Initializing default languages (but not marking as selected)');
  // Set default languages but don't mark as selected yet - this keeps isLanguageSelected false
  state.setLanguages('en', 'ru');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Declare global window properties
declare global {
  interface Window {
    React: typeof React;
    ReactDOM: typeof ReactDOMCompat;
    VocalQuizComponent: typeof VocalQuizComponent;
  }
}