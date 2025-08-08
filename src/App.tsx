import React from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { Board } from './components/Board';

function App() {
  return (
    <ThemeProvider>
      <Board />
    </ThemeProvider>
  );
}

export default App;