
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OnboardingView, OvenView, DataLoomView, TimewarpView, ReportView, ExplorationView, PrepView, ToastContainer, TutorialOverlay, Kitchen3DView } from './components/Views';
import { Dataset, AppView, ToastNotification, AppTheme, PerformanceMetrics } from './types';
import { loadState, saveState, themeColors } from './utils/dataHelpers';
import { Plus, X } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.ONBOARDING);
  
  // -- Version History Engine with Persistence --
  const [history, setHistory] = useState<Dataset[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isNewProjectMode, setIsNewProjectMode] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);

  // -- UI State --
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>('bakery');
  const [showPerf, setShowPerf] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({ fps: 60, memory: 0, loadTime: 0, datasetSize: 0, activeAnimations: 0 });

  // Hydrate state from IndexedDB on mount (Async)
  useEffect(() => {
    const init = async () => {
        const start = performance.now();
        const savedHistory = await loadState();
        if (savedHistory && savedHistory.length > 0) {
            setHistory(savedHistory);
            setHistoryIndex(savedHistory.length - 1);
            setCurrentView(AppView.OVEN); 
        }
        setMetrics(prev => ({ ...prev, loadTime: Math.round(performance.now() - start) }));
    };
    init();

    // FPS Counter & Keyboard Listener
    let frameCount = 0;
    let lastTime = performance.now();
    const loop = () => {
        frameCount++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
            setMetrics(prev => ({ ...prev, fps: frameCount }));
            frameCount = 0;
            lastTime = now;
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    const handleKey = (e: KeyboardEvent) => {
        if (e.shiftKey && e.key === 'F8') setShowPerf(p => !p);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Save state to IndexedDB whenever history changes
  useEffect(() => {
    if (history.length > 0) {
      saveState(history);
      setMetrics(prev => ({ ...prev, datasetSize: history[historyIndex].rowCount }));
    }
  }, [history]);

  // Apply Theme
  useEffect(() => {
      const colors = themeColors[currentTheme];
      document.body.style.backgroundColor = colors.bg;
      document.body.style.color = colors.text;
  }, [currentTheme]);

  // Helper to get current dataset safely
  const currentDataset = historyIndex >= 0 ? history[historyIndex] : {
    id: 'init', rootId: '', versionIndex: 0, name: '', data: [], columns: [], profiles: {}, healthScore: 0, rowCount: 0
  };

  const handleUpdateDataset = (newDataset: Dataset) => {
    // If we were in "New Project" mode (overlay), reset history for the new file
    if (isNewProjectMode) {
        setHistory([newDataset]);
        setHistoryIndex(0);
        setIsNewProjectMode(false);
        setCurrentView(AppView.OVEN);
        addToast('success', 'New project started!');
        return;
    }

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newDataset);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Show success toast
    if (newDataset.changeLog) {
        addToast('success', newDataset.changeLog);
    }
  };

  const handleUndo = () => {
      if (historyIndex > 0) {
          setHistoryIndex(historyIndex - 1);
          addToast('info', 'Rewound time');
      }
  }

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          setHistoryIndex(historyIndex + 1);
          addToast('info', 'Fast-forwarded time');
      }
  }

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
      const id = crypto.randomUUID();
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => removeToast(id), 3000);
  }

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  }

  const handleNewProject = () => {
      setIsNewProjectMode(true);
  }

  const renderView = () => {
    if (is3DMode) return <Kitchen3DView setView={(v) => { setIs3DMode(false); setCurrentView(v); }} />;

    // If in new project mode, overlay onboarding
    if (isNewProjectMode) {
        return (
            <>
                <div className="absolute inset-0 z-50 bg-stone-900/60 backdrop-blur-xl transition-all duration-500" onClick={() => setIsNewProjectMode(false)}></div>
                <div className="absolute inset-8 z-[60] shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
                    <OnboardingView 
                        onUpload={handleUpdateDataset} 
                        onNotify={addToast}
                        onStartTutorial={() => {}}
                        isOverlay={true}
                    />
                    <button onClick={() => setIsNewProjectMode(false)} className="absolute top-10 right-10 p-4 rounded-full bg-white/10 hover:bg-white text-white hover:text-stone-900 shadow-xl backdrop-blur-md transition-all duration-300 border border-white/20 hover:rotate-90">
                        <X size={24} />
                    </button>
                </div>
            </>
        )
    }

    return renderMainContent();
  };

  const renderMainContent = () => {
      switch (currentView) {
        case AppView.ONBOARDING:
          return <OnboardingView 
                    onUpload={(data) => { handleUpdateDataset(data); setCurrentView(AppView.OVEN); }} 
                    onNotify={addToast}
                    onStartTutorial={() => setShowTutorial(true)}
                 />;
        case AppView.OVEN:
          return <PrepView dataset={currentDataset} updateDataset={handleUpdateDataset} />;
        case AppView.INGREDIENTS: 
          return <OvenView dataset={currentDataset} onUpdateDataset={handleUpdateDataset} />;
        case AppView.DATALOOM:
          return <DataLoomView dataset={currentDataset} updateDataset={handleUpdateDataset} />;
        case AppView.TIMEWARP:
          return <TimewarpView dataset={currentDataset} onUpdateDataset={handleUpdateDataset} />;
        case AppView.EXPLORATION:
            return <ExplorationView dataset={currentDataset} />;
        case AppView.REPORT:
          return <ReportView dataset={currentDataset} />;
        default:
          return <OnboardingView onUpload={(data) => { handleUpdateDataset(data); setCurrentView(AppView.OVEN); }} onNotify={addToast} onStartTutorial={() => setShowTutorial(true)}/>;
      }
  }

  // Calculate if FAB should be visible
  const showFab = !isNewProjectMode && currentView !== AppView.ONBOARDING && history.length > 0 && !is3DMode;

  return (
    <div className={`min-h-screen font-sans selection:bg-orange-200 selection:text-orange-900 overflow-hidden theme-${currentTheme}`}>
      <ToastContainer notifications={toasts} onDismiss={removeToast} />
      <TutorialOverlay active={showTutorial} onComplete={() => setShowTutorial(false)} />

      {/* Performance Dashboard */}
      {showPerf && (
          <div className="fixed top-4 left-4 z-[200] bg-black/80 text-green-400 font-mono text-xs p-4 rounded-lg pointer-events-none backdrop-blur-md border border-green-900/50 shadow-2xl">
              <div>FPS: {metrics.fps}</div>
              <div>Load: {metrics.loadTime}ms</div>
              <div>Rows: {metrics.datasetSize}</div>
              <div>Memory: {(performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 'N/A'} MB</div>
          </div>
      )}

      <main className="h-screen overflow-y-auto relative custom-scrollbar">
        {renderView()}
      </main>
      
      {/* Floating Action Button for New Project */}
      <div className={`fixed bottom-10 right-10 z-[80] transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${showFab ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-24 opacity-0 scale-50'}`}>
          <button 
            onClick={handleNewProject}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-bakery-500 to-orange-600 text-white shadow-[0_10px_30px_rgba(234,88,12,0.4)] border-[3px] border-white flex items-center justify-center hover:scale-110 active:scale-90 transition-transform duration-300 group"
            title="Start New Project"
          >
              <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
      </div>

      {/* Show Nav unless on Onboarding (and not in overlay mode) */}
      {history.length > 0 && currentView !== AppView.ONBOARDING && !is3DMode && (
        <Navbar 
            currentView={currentView} 
            setView={setCurrentView} 
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onHelp={() => setShowTutorial(true)}
            currentTheme={currentTheme}
            setTheme={setCurrentTheme}
            onToggle3D={() => setIs3DMode(!is3DMode)}
        />
      )}
    </div>
  );
};

export default App;
