import React, { useState } from 'react';
import Home from './pages/Home';
import TFTAnalyze01 from './pages/TFTAnalyze01';
import TFTAnalyzer02 from './pages/TFTAnalyzer02';
import ProcessSimulator from './pages/ProcessSimulator'; // 이 줄 추가
import './styles/App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch(currentPage) {
      case 'home':
        return <Home onNavigate={navigateTo} />;
      case 'basic':
        return (
          <TFTAnalyze01 
            onNavigateHome={() => navigateTo('home')}
            onNavigateBack={() => navigateTo('home')}
          />
        );
      case 'advanced':
        return (
          <TFTAnalyzer02 
            onNavigateHome={() => navigateTo('home')}
            onNavigateBack={() => navigateTo('home')}
          />
        );
      case 'simulator':
        return (
          <ProcessSimulator 
            onNavigateHome={() => navigateTo('home')}
            onNavigateBack={() => navigateTo('home')}
          />
        );
      default:
        return <Home onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="App">
      {renderCurrentPage()}
    </div>
  );
}

export default App;