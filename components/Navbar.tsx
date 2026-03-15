
import React, { useState } from 'react';
import { AppView, AppTheme, Collaborator } from '../types';
import { ChefHat, Flame, Workflow, Clock, LineChart, FileText, RotateCcw, RotateCw, HelpCircle, ChevronDown, ChevronUp, GripHorizontal, Palette, Users, Box } from 'lucide-react';

interface NavbarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onHelp: () => void;
  currentTheme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  onToggle3D: () => void;
}

const NavItem: React.FC<{
  view: AppView;
  current: AppView;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  id?: string;
}> = ({ view, current, icon: Icon, label, onClick, id }) => {
  const isActive = view === current;
  return (
    <button
      id={id}
      onClick={onClick}
      className={`relative group flex flex-col items-center justify-center w-20 h-20 rounded-full transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) transform
        ${isActive 
          ? 'bg-gradient-to-br from-stone-800 to-black shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_8px_20px_rgba(249,115,22,0.4)] border border-stone-700 -translate-y-4 scale-110 z-20' 
          : 'bg-gradient-to-b from-stone-700 to-stone-800 border border-stone-600 shadow-[0_4px_6px_rgba(0,0,0,0.3)] hover:from-stone-600 hover:to-stone-700 hover:-translate-y-2 z-10'
        }`}
    >
      {/* Active Glow Ring */}
      {isActive && <div className="absolute inset-[-4px] rounded-full border border-orange-500/30 animate-pulse"></div>}
      
      {/* Icon */}
      <Icon 
        size={24} 
        className={`relative z-10 transition-all duration-300 ${isActive ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'text-stone-400 group-hover:text-stone-200'}`} 
      />
      
      {/* Label */}
      <span className={`relative z-10 text-[9px] font-black uppercase mt-1.5 tracking-wider transition-colors ${isActive ? 'text-orange-400' : 'text-stone-500 group-hover:text-stone-300'}`}>
        {label}
      </span>
      
      {/* LED Indicator */}
      <div className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full transition-all duration-500 ${isActive ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-stone-900 shadow-inner'}`}></div>
    </button>
  );
};

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, canUndo, canRedo, onUndo, onRedo, onHelp, currentTheme, setTheme, onToggle3D }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Simulated Collaborators
  const collaborators: Collaborator[] = [
      { id: '1', name: 'Chef Mike', color: '#f59e0b', cursorX: 0, cursorY: 0, activeStation: AppView.OVEN, role: 'Head Chef' },
      { id: '2', name: 'Sous Sarah', color: '#3b82f6', cursorX: 0, cursorY: 0, activeStation: AppView.INGREDIENTS, role: 'Sous Chef' }
  ];

  if (isCollapsed) {
      return (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[90] pb-0 group">
              <button 
                onClick={() => setIsCollapsed(false)}
                className="bg-stone-900/90 backdrop-blur-md border-t border-x border-stone-700 rounded-t-2xl px-12 py-3 text-stone-400 hover:text-orange-500 hover:bg-stone-800 transition-all flex items-center gap-2 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] font-bold text-[10px] uppercase tracking-[0.2em] translate-y-2 group-hover:translate-y-0 duration-300"
              >
                  <ChevronUp size={14} className="animate-bounce-slight" /> Control Deck
              </button>
          </div>
      )
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] perspective-[1000px] animate-in slide-in-from-bottom duration-700 ease-out">
        {/* Panel Container */}
        <div className="bg-gradient-to-b from-stone-800 via-stone-900 to-black px-10 py-6 rounded-[5rem] shadow-[0_30px_80px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15)] border-t border-stone-700 ring-1 ring-black flex items-center gap-8 relative transform rotate-x-[5deg] transition-all hover:scale-[1.01]">
            
            {/* Brushed Metal Texture Overlay */}
            <div className="absolute inset-0 rounded-[5rem] pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]"></div>
            
            {/* Collapse Button */}
            <button 
                onClick={() => setIsCollapsed(true)}
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-stone-800 border border-stone-600 rounded-full flex items-center justify-center text-stone-500 hover:text-white hover:bg-stone-700 transition-colors shadow-lg z-50 group"
                title="Minimize Panel"
            >
                <GripHorizontal size={16} className="group-hover:text-orange-500 transition-colors" />
            </button>

            {/* Utility Controls (Left) */}
            <div className="flex flex-col gap-3 mr-2">
                <div className="flex gap-2">
                    <button 
                        onClick={onUndo} disabled={!canUndo}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 border border-stone-600 shadow-inner"
                        title="Undo"
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button 
                        onClick={onRedo} disabled={!canRedo}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 border border-stone-600 shadow-inner"
                        title="Redo"
                    >
                        <RotateCw size={16} />
                    </button>
                </div>
                 {/* Multiplayer Indicators */}
                 <div className="flex -space-x-2 pl-2">
                    {collaborators.map(c => (
                        <div key={c.id} className="w-6 h-6 rounded-full border border-stone-800 flex items-center justify-center text-[8px] font-bold text-white shadow-sm" style={{ backgroundColor: c.color }} title={`${c.name} (${c.role})`}>
                            {c.name.charAt(0)}
                        </div>
                    ))}
                    <div className="w-6 h-6 rounded-full bg-stone-700 border border-stone-600 flex items-center justify-center text-[8px] text-stone-400">+</div>
                 </div>
            </div>

            {/* Separator */}
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-stone-600 to-transparent opacity-50"></div>

            {/* Main Dials */}
            <div className="flex gap-5 items-end pb-1">
                <NavItem id="nav-prep" view={AppView.OVEN} current={currentView} icon={ChefHat} label="Prep" onClick={() => setView(AppView.OVEN)} />
                <NavItem id="nav-oven" view={AppView.INGREDIENTS} current={currentView} icon={Flame} label="Oven" onClick={() => setView(AppView.INGREDIENTS)} />
                <NavItem id="nav-proofer" view={AppView.DATALOOM} current={currentView} icon={Workflow} label="Proofer" onClick={() => setView(AppView.DATALOOM)} />
                <NavItem id="nav-timewarp" view={AppView.TIMEWARP} current={currentView} icon={Clock} label="Timewarp" onClick={() => setView(AppView.TIMEWARP)} />
                <NavItem id="nav-explore" view={AppView.EXPLORATION} current={currentView} icon={LineChart} label="Taste" onClick={() => setView(AppView.EXPLORATION)} />
                <NavItem id="nav-pack" view={AppView.REPORT} current={currentView} icon={FileText} label="Pack" onClick={() => setView(AppView.REPORT)} />
            </div>

            {/* Separator */}
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-stone-600 to-transparent opacity-50"></div>

             {/* Help & Settings (Right) */}
            <div className="flex flex-col gap-2 ml-2 justify-center h-full relative">
                <button 
                    onClick={() => setShowThemeMenu(!showThemeMenu)}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition-all active:scale-90 border border-stone-600"
                    title="Change Theme"
                >
                    <Palette size={20} />
                </button>
                {showThemeMenu && (
                    <div className="absolute bottom-full right-0 mb-4 bg-stone-800 rounded-xl border border-stone-600 p-2 shadow-xl flex flex-col gap-1 w-32 animate-in fade-in zoom-in-95">
                        {(['bakery', 'lab', 'scifi', 'cyberpunk'] as AppTheme[]).map(t => (
                            <button key={t} onClick={() => { setTheme(t); setShowThemeMenu(false); }} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase text-left hover:bg-stone-700 text-stone-300 ${currentTheme === t ? 'text-orange-500' : ''}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                )}
                
                <div className="flex gap-2">
                    <button onClick={onToggle3D} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-800 text-stone-500 hover:text-orange-400 border border-stone-700" title="3D Kitchen Mode"><Box size={14}/></button>
                    <button onClick={onHelp} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-800 text-stone-500 hover:text-orange-400 border border-stone-700" title="Start Guide"><HelpCircle size={14}/></button>
                </div>
            </div>

            {/* Industrial Feet */}
            <div className="absolute -bottom-4 left-20 w-16 h-5 bg-[#151515] rounded-b-xl shadow-lg border-x border-b border-stone-800"></div>
            <div className="absolute -bottom-4 right-20 w-16 h-5 bg-[#151515] rounded-b-xl shadow-lg border-x border-b border-stone-800"></div>
        </div>
    </div>
  );
};
