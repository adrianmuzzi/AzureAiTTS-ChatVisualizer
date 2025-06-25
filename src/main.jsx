// Import the React library to use JSX and React features
import React from 'react';
// Import the ReactDOM client for rendering React components to the DOM
import ReactDOM from 'react-dom/client';
// Import the main App component
import App from './app';

// Create a root and render the App component inside React.StrictMode for highlighting potential problems
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);