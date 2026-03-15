
import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { Dataset, TransformationRecipe, DataPoint, DoughBatchConfig, SimulationEvent, SousChefPersona, ChatMessage, TimeBranch, ToastNotification, TutorialStep, ReportSection, AIReportAction, AppView } from '../types';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, ReferenceLine, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  AlertTriangle, Upload, Wand2, Plus, 
  Trash2, History, RotateCcw,
  Flame, Workflow, Sparkles, Clock, FileText, LineChart as LineChartIcon,
  Thermometer, Utensils, Database, FileSpreadsheet, Check, ArrowRight, Play, Rewind, FastForward,
  ChefHat, Copy, Sliders, ChevronLeft, ChevronRight, FileCode, Image as ImageIcon, Link as LinkIcon, Download, Zap, User, Microscope,
  Send, Bot, MessageSquare, GitBranch, Save, HelpCircle, X, Stamp, CheckCircle, Info, LayoutTemplate, Printer, Share2, RotateCw, Edit2, PenTool, Type, LayoutGrid, List, Eye, EyeOff, Feather, Lightbulb, Fan, Gauge, Store, Camera, Music, Box, Grid
} from 'lucide-react';
import { checkDataHealth, generateRecipe, generateSlideContent, generateSimulationParams, explainDataPoint, critiqueReport, performReportAction, rewriteSection, parseImageToData } from '../services/geminiService';
import { parseCSV, parseTextData, executeRecipe, profileDataset, generateDoughBatch, downsampleData, calculateCorrelationMatrix, downloadPDF, calculateLinearRegression, projectFutureData, generateReportDocument, calculateFlavorMetrics, generateHologramNodes, getMarketplaceDatasets, generatePandasCode, playDataSonification } from '../utils/dataHelpers';

// --- Global UI Components (Premium Edition) ---

export const ToastContainer: React.FC<{ notifications: ToastNotification[]; onDismiss: (id: string) => void }> = ({ notifications, onDismiss }) => {
    return (
        <div className="fixed top-6 right-6 z-[120] flex flex-col gap-3 pointer-events-none">
            {notifications.map(n => (
                <div key={n.id} className={`pointer-events-auto flex items-center gap-4 px-5 py-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border animate-in slide-in-from-right duration-500 max-w-sm backdrop-blur-md ${n.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-900' : 'bg-white/90 border-bakery-200 text-bakery-950'}`}>
                    <div className={`p-2 rounded-full ${n.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {n.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                    </div>
                    <p className="text-sm font-bold font-serif">{n.message}</p>
                    <button onClick={() => onDismiss(n.id)}><X size={14} className="opacity-40 hover:opacity-100 transition-opacity"/></button>
                </div>
            ))}
        </div>
    )
}

export const TutorialOverlay: React.FC<{ active: boolean; onComplete: () => void }> = ({ active, onComplete }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const steps: TutorialStep[] = [
        { target: '#nav-prep', title: 'Prep Station', content: 'Begin your journey here. Inspect ingredients and check freshness.', position: 'top' },
        { target: '#nav-oven', title: 'The Oven', content: 'Mix, knead, and bake your data. Use dials to control the heat of transformations.', position: 'top' },
        { target: '#nav-proofer', title: 'The Proofer', content: 'Rise your data. Create synthetic batches to expand your dataset.', position: 'top' },
        { target: '#nav-timewarp', title: 'Timewarp', content: 'Simulate the future. Use the Time Machine to predict trends.', position: 'top' },
        { target: '#nav-pack', title: 'Packaging', content: 'Export fully baked reports as polished PDF decks.', position: 'top' },
    ];

    if (!active) return null;
    const currentStep = steps[stepIndex];
    const next = () => stepIndex < steps.length - 1 ? setStepIndex(stepIndex + 1) : onComplete();

    return (
        <div className="fixed inset-0 z-[200] bg-stone-900/60 backdrop-blur-sm transition-all duration-500 flex items-center justify-center">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-md border border-white/20 relative overflow-hidden animate-bounce-slight">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-bakery-400 to-orange-600"></div>
                <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-black text-bakery-600 uppercase tracking-[0.2em]">Step {stepIndex + 1}/{steps.length}</span>
                    <button onClick={onComplete} className="text-stone-400 hover:text-stone-800 transition-colors"><X size={20}/></button>
                </div>
                <h3 className="text-3xl font-serif font-black text-stone-900 mb-3">{currentStep.title}</h3>
                <p className="text-stone-600 mb-8 leading-relaxed text-lg">{currentStep.content}</p>
                <div className="flex justify-end">
                    <Button onClick={next} variant="oven" className="px-8 py-3 text-sm shadow-xl">
                        {stepIndex === steps.length - 1 ? 'Start Baking' : 'Next Step'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const DataThermometer: React.FC<{ score: number }> = ({ score }) => {
  let colorClass = 'bg-red-500';
  let shadowClass = 'shadow-red-500/50';
  let textColor = 'text-red-600';
  let label = 'Critical';
  
  if (score >= 50) { 
      colorClass = 'bg-orange-500';
      shadowClass = 'shadow-orange-500/50';
      textColor = 'text-orange-600';
      label = 'Risky'; 
  }
  if (score >= 80) { 
      colorClass = 'bg-green-500';
      shadowClass = 'shadow-green-500/50';
      textColor = 'text-green-600';
      label = 'Fresh'; 
  }

  const heightPercent = Math.max(15, score);

  return (
    <div className="flex flex-col items-center gap-4 relative group mx-4 select-none">
       <div className="relative w-24 h-64 bg-stone-100/30 rounded-full border-[8px] border-white shadow-[inset_0_4px_20px_rgba(0,0,0,0.05),0_20px_40px_-10px_rgba(0,0,0,0.1)] flex flex-col justify-end overflow-hidden backdrop-blur-md z-10">
          <div className="absolute top-4 left-4 w-4 h-24 bg-gradient-to-b from-white to-transparent rounded-full z-30 pointer-events-none opacity-80"></div>
          <div 
            className={`w-full relative transition-all duration-[2000ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${colorClass} ${shadowClass} shadow-[0_0_40px_rgba(0,0,0,0.3)]`}
            style={{ height: `${heightPercent}%` }}
          >
             <div className="absolute -top-4 left-0 w-[200%] h-8 bg-white/40 rounded-[100%] animate-wave opacity-60"></div>
             <div className="absolute inset-0 w-full h-full overflow-hidden">
                {[...Array(8)].map((_, i) => (
                    <div 
                        key={i} 
                        className="absolute bg-white/50 rounded-full animate-bubble mix-blend-overlay"
                        style={{
                            left: `${Math.random() * 80 + 10}%`,
                            width: `${Math.random() * 8 + 2}px`,
                            height: `${Math.random() * 8 + 2}px`,
                            animationDuration: `${Math.random() * 4 + 2}s`,
                            animationDelay: `${Math.random() * 2}s`
                        }}
                    ></div>
                ))}
             </div>
          </div>
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-40 py-10 px-3">
             {[100, 75, 50, 25].map((val) => (
                 <div key={val} className="flex items-center justify-end w-full gap-2 opacity-40">
                     <span className="text-[10px] font-mono font-bold text-stone-400">{val}</span>
                     <div className="w-3 h-[2px] bg-stone-400 rounded-full"></div>
                 </div>
             ))}
          </div>
       </div>
       <div className={`w-32 h-32 -mt-12 rounded-full border-[8px] border-white bg-stone-50 flex items-center justify-center shadow-2xl z-20 relative ring-1 ring-stone-100 transform transition-transform hover:scale-105 duration-500`}>
            <div className={`w-24 h-24 rounded-full ${colorClass} flex items-center justify-center shadow-[inset_-6px_-6px_15px_rgba(0,0,0,0.2)] transition-colors duration-1000 relative overflow-hidden`}>
                <div className="absolute top-4 left-5 w-8 h-8 bg-white/30 rounded-full blur-[4px]"></div>
                <span className="text-white font-black text-3xl font-serif relative z-10 drop-shadow-md tracking-tighter">{score}</span>
            </div>
       </div>
       <div className={`text-xs font-black uppercase tracking-[0.25em] ${textColor} mt-2 py-2 px-6 bg-white rounded-full border border-stone-100 shadow-[0_4px_10px_rgba(0,0,0,0.05)] transform transition-transform hover:scale-105 duration-300`}>
           {label}
       </div>
    </div>
  )
}

const PremiumCard: React.FC<{ children: React.ReactNode; className?: string; title?: string; subtitle?: string; action?: React.ReactNode }> = ({ children, className = '', title, subtitle, action }) => (
  <div className={`bg-white rounded-[2rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.05)] border border-stone-100 overflow-hidden flex flex-col transition-all duration-500 hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1 ${className}`}>
    {(title || action) && (
        <div className="px-8 py-6 border-b border-stone-50 bg-stone-50/30 flex justify-between items-center">
            <div>
                {title && <h3 className="text-xl font-serif font-bold text-stone-900">{title}</h3>}
                {subtitle && <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-1">{subtitle}</p>}
            </div>
            {action}
        </div>
    )}
    <div className="p-8 flex-1 min-h-0 overflow-auto">{children}</div>
  </div>
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'oven' }> = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "px-5 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap justify-center outline-none focus:ring-4 focus:ring-bakery-100 cubic-bezier(0.34, 1.56, 0.64, 1)";
  const variants = {
    primary: "bg-bakery-500 hover:bg-bakery-600 text-white shadow-lg shadow-bakery-500/30 border border-bakery-400",
    secondary: "bg-white border-2 border-stone-100 hover:border-bakery-300 text-stone-700 hover:text-bakery-800 hover:bg-bakery-50 shadow-sm",
    ghost: "hover:bg-stone-100 text-stone-600",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    oven: "bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-[0_6px_0_0_#9a3412,0_10px_20px_rgba(249,115,22,0.4)] active:shadow-none active:translate-y-[6px] border-t border-orange-400"
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const AutoResizingTextarea: React.FC<{ value: string; onChange: (val: string) => void; className?: string; style?: React.CSSProperties }> = ({ value, onChange, className, style }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
  
    // Handle auto-resize on value change
    useLayoutEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
    }, [value]);
  
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`resize-none overflow-hidden block w-full focus:outline-none focus:ring-0 ${className}`}
        style={style}
        rows={1}
      />
    );
};

// --- 3D Kitchen View ---

export const Kitchen3DView: React.FC<{ setView: (v: AppView) => void }> = ({ setView }) => {
    return (
        <div className="absolute inset-0 z-50 bg-black text-white perspective-[1200px] overflow-hidden">
            <div className="absolute top-10 left-10 z-50 font-serif text-4xl font-bold text-orange-500 mix-blend-screen">3D Kitchen</div>
            <button onClick={() => setView(AppView.OVEN)} className="absolute top-10 right-10 z-50 p-4 border rounded-full hover:bg-white hover:text-black transition-all">Exit 3D</button>
            <div className="w-full h-full transform-style-3d relative animate-float-delayed flex items-center justify-center">
                 {/* Room Floor */}
                 <div className="absolute w-[200vw] h-[200vh] bg-[radial-gradient(circle_at_center,_#333_0%,_#000_100%)] transform rotate-x-[80deg] translate-z-[-500px] border-grid"></div>
                 
                 {/* Stations */}
                 <div className="grid grid-cols-3 gap-32 transform rotate-x-[20deg] scale-90">
                     {[
                         { id: AppView.OVEN, label: 'Prep Station', color: 'bg-green-500' },
                         { id: AppView.INGREDIENTS, label: 'The Oven', color: 'bg-orange-600', glow: true },
                         { id: AppView.DATALOOM, label: 'Proofer', color: 'bg-yellow-500' },
                         { id: AppView.TIMEWARP, label: 'Timewarp', color: 'bg-purple-600' },
                         { id: AppView.EXPLORATION, label: 'Taste Lab', color: 'bg-blue-500' },
                         { id: AppView.REPORT, label: 'Packaging', color: 'bg-stone-500' }
                     ].map(station => (
                         <div key={station.id} onClick={() => setView(station.id)} className={`w-64 h-80 rounded-3xl ${station.color} bg-opacity-20 border-2 border-white/30 backdrop-blur-md cursor-pointer hover:scale-110 transition-transform duration-500 flex flex-col items-center justify-center relative shadow-[0_0_50px_rgba(0,0,0,0.5)] group transform-style-3d hover:rotate-y-[10deg]`}>
                             <div className={`text-2xl font-black uppercase tracking-widest text-white drop-shadow-lg group-hover:translate-z-[50px] transition-transform`}>{station.label}</div>
                             {station.glow && <div className="absolute inset-0 bg-orange-500/20 blur-[50px] animate-pulse"></div>}
                         </div>
                     ))}
                 </div>
            </div>
        </div>
    )
}

// --- View: Onboarding (Premium Polish with Bazaar & Cam) ---

export const OnboardingView: React.FC<{ onUpload: (data: Dataset) => void; onNotify: (type: 'error' | 'success', msg: string) => void; onStartTutorial: () => void; isOverlay?: boolean }> = ({ onUpload, onNotify, onStartTutorial, isOverlay }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text' | 'market' | 'cam'>('file');
  const [textInput, setTextInput] = useState('');
  const [isMixing, setIsMixing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const camInputRef = useRef<HTMLInputElement>(null);

  const startMixing = () => {
      setIsMixing(true);
      let p = 0;
      const interval = setInterval(() => { p += 4; if (p <= 95) setProgress(p); }, 40);
      return interval;
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const interval = startMixing();
      try {
        const dataset = await parseCSV(e.target.files[0]);
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => onUpload(dataset), 800);
      } catch (err: any) {
        setIsMixing(false);
        clearInterval(interval);
        onNotify('error', err.message || "Failed to parse file.");
      }
    }
  };

  const handleTextSubmit = async () => {
      if(!textInput) return;
      const interval = startMixing();
      try {
          const dataset = await parseTextData(textInput);
          clearInterval(interval);
          setProgress(100);
          setTimeout(() => onUpload(dataset), 800);
      } catch (err: any) {
          setIsMixing(false);
          clearInterval(interval);
          onNotify('error', err.message);
      }
  }

  const handleMarketSelect = async (item: any) => {
      const interval = startMixing();
      try {
          // Mock delay for fetch
          setTimeout(() => {
              const { profiles, score } = profileDataset(item.data, Object.keys(item.data[0]));
              const dataset = {
                  id: crypto.randomUUID(), rootId: 'market-' + item.id, versionIndex: 0,
                  name: item.name + '.csv', data: item.data, columns: Object.keys(item.data[0]),
                  profiles, healthScore: score, rowCount: item.data.length, changeLog: `Imported from Bazaar: ${item.name}`
              };
              clearInterval(interval);
              setProgress(100);
              setTimeout(() => onUpload(dataset), 800);
          }, 1500);
      } catch (err) {
          setIsMixing(false);
          clearInterval(interval);
          onNotify('error', 'Failed to import market data');
      }
  }

  const handleCamSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          
          reader.onload = async (event) => {
              const base64 = event.target?.result as string;
              if (base64) {
                  const interval = startMixing();
                  try {
                      // Strip header "data:image/png;base64,"
                      const cleanBase64 = base64.split(',')[1];
                      const result = await parseImageToData(cleanBase64);
                      
                      const { profiles, score } = profileDataset(result.data, result.columns);
                      const dataset = {
                          id: crypto.randomUUID(), rootId: 'cam-' + crypto.randomUUID(), versionIndex: 0,
                          name: 'Scanned_Table.csv', data: result.data, columns: result.columns,
                          profiles, healthScore: score, rowCount: result.data.length, changeLog: 'Imported via Data Cam'
                      };
                      
                      clearInterval(interval);
                      setProgress(100);
                      setTimeout(() => onUpload(dataset), 800);
                  } catch (err: any) {
                      setIsMixing(false);
                      clearInterval(interval);
                      onNotify('error', err.message || "Failed to scan image.");
                  }
              }
          };
          reader.readAsDataURL(file);
      }
  }

  const loadDemoData = () => {
     const interval = startMixing();
     let p = 0;
     const demoInterval = setInterval(() => {
         p += 8;
         setProgress(p);
         if(p >= 100) {
             clearInterval(demoInterval);
             clearInterval(interval);
             const points: DataPoint[] = Array.from({ length: 1000 }, (_, i) => ({
                date: new Date(2023, 0, i + 1).toISOString().split('T')[0],
                sales: Number((Math.floor(Math.random() * 5000) + 1000 + (Math.sin(i/50)*1000)).toFixed(2)),
                profit: Number((Math.floor(Math.random() * 2000) + 500).toFixed(2)),
                customers: Math.floor(Math.random() * 200) + 50,
                category: ['Pastry', 'Bread', 'Coffee', 'Cake'][Math.floor(Math.random() * 4)],
             }));
             const { profiles, score } = profileDataset(points, Object.keys(points[0]));
             setTimeout(() => {
                onUpload({ id: crypto.randomUUID(), rootId: 'demo', versionIndex: 0, name: "Demo_Sales.csv", data: points, columns: Object.keys(points[0]), profiles, healthScore: score, rowCount: points.length, changeLog: 'Loaded Demo Data' });
                if(!isOverlay) onStartTutorial();
             }, 400);
         }
     }, 60);
  };
  
  const marketItems = getMarketplaceDatasets();

  return (
    <div className={`h-full flex flex-col items-center justify-center p-8 relative overflow-hidden transition-all duration-700 ${isOverlay ? 'bg-transparent' : 'bg-[#fffbf0]'}`}>
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv" className="hidden" />
      <input type="file" ref={camInputRef} onChange={handleCamSelect} accept="image/*" className="hidden" />
      
      {!isOverlay && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden bg-grain">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-orange-200/20 rounded-full blur-[100px] animate-blob"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-yellow-200/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
          </div>
      )}
      <div className="z-10 text-center mb-12 space-y-6 animate-fade-in-up">
          <div className="inline-flex p-5 rounded-[2rem] bg-white shadow-xl shadow-orange-100 mb-2 border border-orange-50 rotate-3 transition-transform hover:rotate-0 hover:scale-110 duration-500">
             <ChefHat size={56} className="text-bakery-600" />
          </div>
          <h1 className={`text-8xl font-black font-serif tracking-tighter drop-shadow-sm ${isOverlay ? 'text-white' : 'text-stone-900'}`}>Data Bakery</h1>
          <p className={`text-2xl font-light max-w-xl mx-auto ${isOverlay ? 'text-stone-300' : 'text-stone-500'}`}>The world's first <span className="font-serif italic text-bakery-600 font-bold">artisan</span> data studio.</p>
      </div>
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl shadow-stone-200/50 border-[6px] border-white/50 backdrop-blur-md z-20 transition-all duration-500 hover:scale-[1.01] overflow-hidden">
          {!isMixing ? (
             <>
                <div className="flex border-b border-stone-100 bg-stone-50/50 overflow-x-auto">
                    {[ { id: 'file', icon: FileSpreadsheet, label: 'File' }, { id: 'text', icon: FileCode, label: 'Paste' }, { id: 'market', icon: Store, label: 'Bazaar' }, { id: 'cam', icon: Camera, label: 'Vision' } ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-6 flex items-center justify-center gap-2 font-bold transition-all duration-300 text-xs uppercase tracking-wider min-w-[100px] ${activeTab === tab.id ? 'bg-white text-bakery-600 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] relative z-10 rounded-t-2xl' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100/50'}`}> <tab.icon size={16} /> {tab.label} </button>
                    ))}
                </div>
                <div className="p-12 min-h-[340px] flex flex-col items-center justify-center bg-white relative">
                    {activeTab === 'file' && (
                        <div className="w-full h-64 border-4 border-dashed border-stone-200 rounded-[2rem] flex flex-col items-center justify-center bg-stone-50/30 cursor-pointer hover:border-bakery-400 hover:bg-bakery-50/30 transition-all duration-300 group relative overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 bg-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 border border-stone-100"><Upload className="text-bakery-500" size={36} /></div>
                            <p className="font-serif font-bold text-stone-800 text-2xl mb-1">Drop Ingredients</p>
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">CSV, JSON, Excel</p>
                        </div>
                    )}
                    {activeTab === 'text' && (
                        <div className="w-full h-full flex flex-col gap-6 animate-fade-in">
                            <textarea className="w-full h-48 p-6 rounded-2xl border-2 border-stone-100 focus:border-bakery-400 focus:ring-4 focus:ring-bakery-50 outline-none resize-none font-mono text-sm bg-stone-50 shadow-inner" placeholder="Paste CSV/JSON..." value={textInput} onChange={e => setTextInput(e.target.value)} />
                            <Button onClick={handleTextSubmit} variant="oven" className="w-full py-5 text-lg shadow-xl">Start Mixing</Button>
                        </div>
                    )}
                    {activeTab === 'market' && (
                         <div className="w-full h-64 overflow-y-auto custom-scrollbar animate-fade-in space-y-3 pr-2">
                             {marketItems.map(item => (
                                 <div key={item.id} onClick={() => handleMarketSelect(item)} className="p-4 rounded-xl border border-stone-100 hover:border-bakery-400 hover:bg-bakery-50 cursor-pointer transition-all flex justify-between items-center group">
                                     <div>
                                         <div className="font-bold text-stone-800 text-sm">{item.name}</div>
                                         <div className="text-[10px] text-stone-400 uppercase tracking-wide">{item.category} • {item.rows} Rows</div>
                                     </div>
                                     <ArrowRight size={16} className="text-stone-300 group-hover:text-bakery-500 transform group-hover:translate-x-1 transition-transform" />
                                 </div>
                             ))}
                         </div>
                    )}
                    {activeTab === 'cam' && (
                        <div className="w-full h-64 border-4 border-dashed border-stone-200 rounded-[2rem] flex flex-col items-center justify-center bg-stone-50/30 cursor-pointer hover:border-bakery-400 hover:bg-bakery-50/30 transition-all duration-300 group relative overflow-hidden" onClick={() => camInputRef.current?.click()}>
                            <div className="w-24 h-24 bg-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 border border-stone-100"><Camera className="text-bakery-500" size={36} /></div>
                            <p className="font-serif font-bold text-stone-800 text-2xl mb-1">Scan Table</p>
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Upload Screenshot / Receipt</p>
                        </div>
                    )}
                </div>
             </>
          ) : (
            <div className="p-16 flex flex-col items-center justify-center min-h-[450px]">
                <div className="relative mb-10"><div className="w-40 h-40 border-[10px] border-bakery-100 rounded-full animate-spin-slow border-t-bakery-500"></div><div className="absolute inset-0 flex items-center justify-center"><ChefHat size={64} className="text-bakery-600 animate-bounce" /></div></div>
                <h3 className="text-4xl font-serif font-black text-stone-900 mb-2">Mixing...</h3>
                <div className="w-72 h-4 bg-stone-100 rounded-full overflow-hidden shadow-inner border border-stone-200 mt-6"><div className="h-full bg-gradient-to-r from-bakery-400 to-orange-600 transition-all duration-300 relative" style={{ width: `${progress}%` }}></div></div>
            </div>
          )}
      </div>
      {!isMixing && <button onClick={loadDemoData} className="mt-8 px-8 py-3 rounded-full bg-white border border-stone-200 text-stone-600 text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-3 group"><Sparkles size={16} className="text-bakery-400 group-hover:text-bakery-600" /> Use House Special (Demo)</button>}
    </div>
  );
};

// --- View: Prep (Premium) ---

export const PrepView: React.FC<{ dataset: Dataset, updateDataset: (d: Dataset) => void }> = ({ dataset, updateDataset }) => {
  const [persona, setPersona] = useState<SousChefPersona>('executive');
  const [aiAnalysis, setAiAnalysis] = useState<{ summary: string, recommendations: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { analyze(persona); }, [persona]);
  const analyze = async (p: SousChefPersona) => { setLoading(true); const res = await checkDataHealth(dataset, p); setAiAnalysis(res); setLoading(false); }
  const personaIcons = { executive: User, grandma: Utensils, gordon: Flame, scientist: Microscope };
  const Icon = personaIcons[persona];

  return (
    <div className="h-full overflow-y-auto p-10 space-y-10 max-w-[1600px] mx-auto pb-48 bg-grain animate-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div><h2 className="text-6xl font-serif font-black text-stone-900 tracking-tighter mb-2">Mise en Place</h2><p className="text-stone-500 font-medium text-lg flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-bakery-500"></div> Preparation Station</p></div>
        <div className="flex items-center gap-12 bg-white/50 p-4 rounded-[3rem] border border-white shadow-sm backdrop-blur-sm"><DataThermometer score={dataset.healthScore} /></div>
      </header>
      <PremiumCard className="bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-10">
            <div className="w-full md:w-72 space-y-5 shrink-0">
                <label className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-2 block">Sous Chef Persona</label>
                <div className="grid grid-cols-2 gap-4">{(['executive', 'grandma', 'gordon', 'scientist'] as SousChefPersona[]).map(p => (<button key={p} onClick={() => setPersona(p)} className={`p-4 rounded-2xl text-sm font-bold capitalize flex flex-col items-center gap-3 transition-all duration-300 ${persona === p ? 'bg-bakery-600 text-white shadow-xl shadow-bakery-600/30 scale-105' : 'bg-stone-50 border border-stone-200 text-stone-500 hover:bg-stone-100 hover:scale-105'}`}>{React.createElement(personaIcons[p], { size: 24 })} {p}</button>))}</div>
            </div>
            <div className="flex-1 relative min-h-[180px] bg-stone-50 rounded-[2rem] p-8 border border-stone-100 shadow-inner transition-all hover:bg-stone-50/80">
                 {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-[2rem]"><div className="animate-spin rounded-full h-10 w-10 border-[5px] border-bakery-200 border-t-bakery-600"></div></div>}
                 <h3 className="text-2xl font-serif font-bold text-stone-900 mb-4 flex items-center gap-3"><div className="p-2 bg-white rounded-full shadow-sm"><Icon className="text-bakery-600" size={24} /></div> Chef's Analysis</h3>
                 <p className="text-stone-700 italic leading-relaxed mb-8 font-medium text-lg font-serif">"{aiAnalysis?.summary}"</p>
                 <div className="flex gap-3 flex-wrap">{aiAnalysis?.recommendations.map((rec, i) => (<span key={i} className="px-4 py-2 bg-white text-stone-700 text-xs font-bold uppercase tracking-wider rounded-xl border border-stone-200 shadow-sm flex items-center gap-2 hover:border-green-300 transition-colors cursor-default"><CheckCircle size={14} className="text-green-500" /> {rec}</span>))}</div>
            </div>
        </div>
      </PremiumCard>
    </div>
  );
};

// --- View: Oven (Premium & Dynamic with Code Export) ---

export const OvenView: React.FC<{ dataset: Dataset, onUpdateDataset: (d: Dataset) => void }> = ({ dataset, onUpdateDataset }) => {
  const [recipes, setRecipes] = useState<TransformationRecipe[]>([]);
  const [baking, setBaking] = useState(false);
  const [previewData, setPreviewData] = useState<DataPoint[]>(dataset.data);
  const [prompt, setPrompt] = useState('');
  
  // Oven Controls
  const [intensity, setIntensity] = useState(50);
  const [ovenMode, setOvenMode] = useState<'quick' | 'deep'>('quick');
  const [lightOn, setLightOn] = useState(true);

  // Live Feedback Logic (Functional)
  useEffect(() => { 
      // Execute recipe with intensity on a sample for performance in 'Deep' mode
      const result = executeRecipe(dataset.data, recipes, intensity, ovenMode);
      setPreviewData(result); 
  }, [recipes, dataset.data, intensity, ovenMode]);

  const handleAiGenerate = async () => { if (!prompt) return; const newRecipes = await generateRecipe(prompt, dataset.columns); setRecipes([...recipes, ...newRecipes]); setPrompt(''); };
  
  const handleBake = () => { 
      setBaking(true); 
      setTimeout(() => { 
          const newData = executeRecipe(dataset.data, recipes, intensity, ovenMode); 
          const { profiles, score } = profileDataset(newData, dataset.columns); 
          onUpdateDataset({ id: crypto.randomUUID(), rootId: dataset.rootId, versionIndex: dataset.versionIndex + 1, name: dataset.name, data: newData, columns: dataset.columns, profiles, healthScore: score, rowCount: newData.length, changeLog: `Baked with ${recipes.length} recipes` }); 
          setBaking(false); 
      }, 1200); 
  }

  const handleExportCode = () => {
      const code = generatePandasCode(recipes);
      navigator.clipboard.writeText(code);
      alert("Python code copied to clipboard!");
  }

  const rowCount = previewData.length;
  const yieldPercent = Math.round((rowCount / dataset.rowCount) * 100);
  const isYieldLow = yieldPercent < 70;

  return (
    <div className="flex h-full bg-stone-200 overflow-hidden relative animate-in fade-in duration-700">
        
        {/* Left Panel: Ingredients (Recipe Rack) */}
        <div className="w-80 flex flex-col z-20 border-r border-stone-300 bg-[#fbf9f4] shadow-2xl shrink-0">
             <div className="p-8 bg-stone-50 border-b border-stone-200"><h2 className="text-2xl font-serif font-black text-stone-900 flex items-center gap-3 mb-1"><Workflow className="text-bakery-600" /> Ingredients</h2><p className="text-stone-500 text-xs font-medium">Add steps to your baking pipeline.</p></div>
            <div className="p-6 bg-white/50 border-b border-stone-200 backdrop-blur-sm">
                <div className="relative group"><input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. 'Remove outliers'" className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-stone-200 bg-white text-sm font-medium focus:border-bakery-400 focus:ring-2 focus:ring-bakery-50 outline-none transition-all shadow-sm" onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()} /><Plus className="absolute right-3 top-1/2 -translate-y-1/2 text-bakery-400 cursor-pointer hover:scale-110 transition-transform" size={18} onClick={handleAiGenerate} /><Wand2 className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} /></div>
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 custom-scrollbar">{['Remove Nulls', 'Deduplicate', 'Fix Dates'].map(action => (<button key={action} onClick={() => setPrompt(action)} className="px-2 py-1 bg-white border border-stone-200 rounded-md text-[10px] font-bold text-stone-600 whitespace-nowrap hover:border-bakery-300 hover:text-bakery-700 transition-colors shadow-sm active:scale-95">+ {action}</button>))}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-grain">{recipes.map(r => (<div key={r.id} onClick={() => setRecipes(prev => prev.map(pr => pr.id === r.id ? {...pr, active: !pr.active} : pr))} className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${r.active ? 'bg-white border-bakery-400 shadow-md translate-x-1' : 'bg-stone-50 border-stone-200 opacity-60'}`}><div className="flex justify-between items-start mb-1"><div className="font-bold text-stone-900 font-serif text-sm">{r.name}</div><div className="w-5 h-5 rounded-full border flex items-center justify-center transition-colors">{r.active && <Check size={12} className="text-white" />}</div></div><div className="text-[10px] text-stone-500 font-medium leading-relaxed">{r.description}</div></div>))}</div>
            
            {/* Code Export Button */}
            <div className="p-4 bg-stone-100 border-t border-stone-200">
                <Button variant="secondary" onClick={handleExportCode} className="w-full text-xs py-3 flex justify-center gap-2"><FileCode size={14}/> Export Recipe as Code</Button>
            </div>
        </div>

        {/* Center Panel: The Oven Chamber */}
        <div className="flex-1 p-8 md:p-12 flex flex-col min-w-0 bg-stone-300 relative overflow-hidden justify-center items-center">
             {/* Oven Unit */}
             <div className="w-full max-w-5xl bg-gradient-to-b from-[#2a2622] to-[#1c1917] rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] border-[8px] border-[#3f3b36] flex flex-col relative overflow-hidden ring-1 ring-white/10 transition-transform duration-500 hover:scale-[1.002]">
                  
                  {/* Top Control Bar */}
                  <div className="h-20 bg-[#2a2622] border-b-[6px] border-black flex items-center justify-between px-8 shrink-0 z-20 relative shadow-md">
                      <div className="flex items-center gap-6">
                           <div className="flex flex-col"><span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-0.5">Yield Est.</span><span className={`font-mono text-xl font-bold tracking-tight transition-colors duration-500 ${yieldPercent < 70 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>{rowCount} <span className="text-stone-600 text-xs">Rows ({yieldPercent}%)</span></span></div>
                           <div className="h-8 w-px bg-white/10"></div>
                           <div className="flex flex-col"><span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-0.5">Mode</span><span className="text-stone-300 font-mono text-sm font-bold tracking-tight uppercase flex items-center gap-2">{ovenMode === 'quick' ? <Zap size={12} className="text-yellow-400"/> : <Flame size={12} className="text-red-500"/>} {ovenMode} Bake</span></div>
                      </div>
                      <div className="flex items-center gap-6">
                          <Button variant="oven" onClick={handleBake} disabled={baking} className="px-10 py-3 text-sm font-black tracking-[0.2em] uppercase rounded-full shadow-[0_6px_0_0_#7c2d12,0_15px_30px_rgba(0,0,0,0.5)] active:shadow-none active:translate-y-1.5 transition-all hover:brightness-110">{baking ? 'Baking...' : 'BAKE'}</Button>
                      </div>
                  </div>

                  {/* Main Chamber */}
                  <div className="h-[500px] bg-black relative p-6 flex flex-col shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]">
                       
                       {/* Heating Elements (Visual) */}
                       <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50 blur-[2px] transition-opacity duration-1000" style={{ opacity: intensity / 100 }}></div>
                       <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50 blur-[2px] transition-opacity duration-1000" style={{ opacity: intensity / 100 }}></div>

                       {baking && (<div className="absolute inset-0 bg-orange-600/10 z-50 animate-pulse backdrop-blur-[2px] flex items-center justify-center"><div className="relative"><Flame size={100} className="text-orange-500 animate-bounce drop-shadow-[0_0_50px_rgba(249,115,22,0.8)]" /><div className="absolute top-0 left-0 w-full h-full bg-orange-500 blur-[80px] opacity-40"></div></div></div>)}
                       
                       {/* Smart Analysis Overlay (on glass) */}
                       {isYieldLow && !baking && (
                           <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-red-500/80 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold border border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-bounce-slight flex items-center gap-2">
                               <AlertTriangle size={14}/> Warning: High Data Loss Detected
                           </div>
                       )}

                       {/* Glass Window */}
                       <div className={`flex-1 bg-[#f0f0f0] rounded-xl shadow-inner overflow-hidden flex flex-col border-4 border-stone-800 relative z-30 transition-opacity duration-700 ${lightOn ? 'opacity-90' : 'opacity-20 brightness-50'}`}>
                           {/* Reflection */}
                           <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/10 to-transparent pointer-events-none z-40"></div>
                           
                           <div className="flex-1 overflow-auto custom-scrollbar"><table className="w-full text-left text-sm whitespace-nowrap font-mono"><thead className="bg-[#e5e5e5] sticky top-0 z-10 border-b border-stone-300 shadow-sm"><tr>{dataset.columns.map(c => <th key={c} className="px-5 py-3 font-bold text-stone-800 border-r border-stone-300 cursor-help hover:bg-white transition-colors uppercase text-[10px] tracking-wider">{c}</th>)}</tr></thead><tbody>{downsampleData(previewData, 50, '').map((row, i) => (<tr key={i} className="hover:bg-orange-50 transition-colors even:bg-stone-100">{dataset.columns.map(c => <td key={`${i}-${c}`} className="px-5 py-2 border-r border-stone-200 text-stone-700 max-w-[150px] overflow-hidden text-ellipsis text-xs">{String(row[c])}</td>)}</tr>))}</tbody></table></div>
                       </div>
                  </div>
             </div>
        </div>

        {/* Right Panel: Controls */}
        <div className="w-72 bg-stone-100 border-l border-stone-300 shadow-xl flex flex-col z-20 shrink-0">
            <div className="p-6 border-b border-stone-200"><h3 className="text-stone-900 font-serif font-bold text-xl flex items-center gap-2"><Sliders size={18} className="text-orange-600"/> Controls</h3></div>
            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                
                {/* Heat Dial (Slider styled) */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center"><label className="text-xs font-black text-stone-500 uppercase tracking-widest">Heat Intensity</label><span className="text-orange-600 font-bold font-mono text-sm">{intensity}%</span></div>
                    <div className="h-48 bg-stone-200 rounded-2xl relative border-2 border-stone-300 shadow-inner flex justify-center py-4">
                        <input 
                            type="range" 
                            min="0" max="100" 
                            value={intensity} 
                            onChange={(e) => setIntensity(Number(e.target.value))}
                            className="h-full w-2 appearance-none bg-transparent cursor-pointer vertical-slider"
                            style={{ WebkitAppearance: 'slider-vertical' as any }} 
                        />
                        {/* Heat Markers */}
                        <div className="absolute right-4 top-4 bottom-4 flex flex-col justify-between text-[9px] font-bold text-stone-400">
                            <span>MAX</span>
                            <span>MED</span>
                            <span>LOW</span>
                        </div>
                    </div>
                </div>

                {/* Toggles */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between group">
                         <div className="flex items-center gap-3"><Fan size={16} className="text-stone-400 group-hover:text-orange-500 transition-colors"/><span className="text-xs font-bold text-stone-600">Fan Mode</span></div>
                         <button onClick={() => setOvenMode(m => m === 'quick' ? 'deep' : 'quick')} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${ovenMode === 'quick' ? 'bg-stone-300 justify-start' : 'bg-orange-500 justify-end'}`}><div className="w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform"></div></button>
                    </div>
                    <div className="flex items-center justify-between group">
                         <div className="flex items-center gap-3"><Lightbulb size={16} className="text-stone-400 group-hover:text-yellow-500 transition-colors"/><span className="text-xs font-bold text-stone-600">Oven Light</span></div>
                         <button onClick={() => setLightOn(!lightOn)} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${!lightOn ? 'bg-stone-300 justify-start' : 'bg-yellow-400 justify-end'}`}><div className="w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform"></div></button>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
}

// --- View: Proofer (Premium Wood & Dough) ---

export const DataLoomView: React.FC<{ dataset: Dataset, updateDataset: (d: Dataset) => void }> = ({ dataset, updateDataset }) => {
    const [batches, setBatches] = useState<{name: string, config: DoughBatchConfig, data: DataPoint[]}[]>([]);
    const [config, setConfig] = useState<DoughBatchConfig>({ yeast: 1, sugar: 5, knead: 1 });
    const handleProof = () => { const newData = generateDoughBatch(dataset.data, config); setBatches([...batches, { name: `Batch ${batches.length + 1}`, config, data: newData }]); }
    const activateBatch = (batchData: DataPoint[], name: string) => { const { profiles, score } = profileDataset(batchData, dataset.columns); updateDataset({ id: crypto.randomUUID(), rootId: dataset.rootId, versionIndex: dataset.versionIndex + 1, name: `${dataset.name} (${name})`, data: batchData, columns: dataset.columns, profiles, healthScore: score, rowCount: batchData.length, isSynthetic: true, changeLog: `Activated ${name}` }); }

    return (
        <div className="h-full flex flex-col p-10 pb-48 max-w-[1600px] mx-auto space-y-10 overflow-y-auto bg-grain animate-in slide-in-from-bottom-4 duration-700">
            <header><h2 className="text-6xl font-serif font-black text-stone-900 tracking-tighter">AI Dough Lab</h2><p className="text-stone-500 text-xl mt-3 font-light">Rise synthetic data batches with AI precision.</p></header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <PremiumCard title="Dough Configuration" className="h-fit bg-[#fffbf5] border-orange-100">
                    <div className="space-y-10 p-2">
                        <div><div className="flex justify-between text-sm font-bold text-stone-900 mb-5 items-center"><span className="flex items-center gap-3 text-base"><div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></div> Yeast (Noise)</span><span className="bg-white px-3 py-1 rounded-lg shadow-sm border border-orange-100 text-orange-600">{config.yeast}x</span></div><input type="range" min="0" max="5" step="0.5" value={config.yeast} onChange={e => setConfig({...config, yeast: Number(e.target.value)})} className="w-full h-3 bg-orange-200 rounded-full appearance-none cursor-pointer accent-orange-600 hover:accent-orange-700 transition-all" /></div>
                        <div><div className="flex justify-between text-sm font-bold text-stone-900 mb-5 items-center"><span className="flex items-center gap-3 text-base"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div> Sugar (Trend)</span><span className="bg-white px-3 py-1 rounded-lg shadow-sm border border-blue-100 text-blue-600">{config.sugar}</span></div><input type="range" min="1" max="10" step="1" value={config.sugar} onChange={e => setConfig({...config, sugar: Number(e.target.value)})} className="w-full h-3 bg-blue-200 rounded-full appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all" /></div>
                        <div className="grid grid-cols-3 gap-4 pt-4">{[ {l:'Boom', i:'📈', y:0.5, s:8}, {l:'Bust', i:'📉', y:1.5, s:2}, {l:'Chaos', i:'🌀', y:4, s:5} ].map(p => (<button key={p.l} onClick={() => setConfig({ yeast: p.y, sugar: p.s, knead: 1 })} className="p-4 rounded-2xl bg-white border border-stone-100 shadow-sm hover:border-orange-300 hover:shadow-md transition-all flex flex-col items-center gap-2 group"><span className="text-2xl group-hover:scale-110 transition-transform">{p.i}</span><span className="text-xs font-bold text-stone-600 uppercase tracking-wider">{p.l}</span></button>))}</div>
                        <Button onClick={handleProof} className="w-full py-5 text-lg shadow-xl" variant="oven">Start Proofing</Button>
                    </div>
                </PremiumCard>
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-lg relative overflow-hidden h-96">
                         <h4 className="text-xs font-black text-stone-400 uppercase mb-6 tracking-[0.2em] flex items-center gap-2"><Sparkles size={14}/> Texture Analysis</h4>
                         <div style={{ width: '100%', height: '320px', minHeight: '320px', minWidth: '0' }}>
                            <ResponsiveContainer width="99%" height="100%">
                                <AreaChart data={downsampleData(dataset.data, 60, '')}><defs><linearGradient id="colorOriginal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/><stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/></linearGradient><linearGradient id="colorSynthetic" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.5}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient></defs><Area type="monotone" dataKey={dataset.columns.find(c => dataset.profiles[c].type === 'number') || ''} stroke="#94a3b8" strokeDasharray="5 5" fill="url(#colorOriginal)" strokeWidth={2} /><Area type="monotone" dataKey={dataset.columns.find(c => dataset.profiles[c].type === 'number') || ''} stroke="#f97316" strokeWidth={4} fill="url(#colorSynthetic)" className="drop-shadow-lg" animationDuration={1500} /></AreaChart>
                            </ResponsiveContainer>
                         </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-[#f5f5f4] p-6 rounded-[2rem] border-2 border-dashed border-stone-300 flex flex-col justify-center items-center opacity-70 hover:opacity-100 transition-all cursor-pointer" onClick={() => activateBatch(dataset.data, dataset.name)}><Database size={32} className="text-stone-400 mb-2"/><div className="font-bold text-stone-600 text-lg">Revert to Starter</div></div>
                         {batches.map((b, i) => (<div key={i} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all relative overflow-hidden group"><div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-50 to-transparent rounded-bl-[3rem] -mr-6 -mt-6"></div><div className="font-serif font-bold text-stone-900 text-xl mb-1 relative z-10">{b.name}</div><div className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-6 relative z-10">Yeast {b.config.yeast} • Sugar {b.config.sugar}</div><Button onClick={() => activateBatch(b.data, b.name)} className="w-full shadow-orange-100 relative z-10">Bake Batch</Button></div>))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- View: Timewarp (Premium Charting) ---

export const TimewarpView: React.FC<{ dataset: Dataset, onUpdateDataset: (d: Dataset) => void }> = ({ dataset, onUpdateDataset }) => {
    const [trend, setTrend] = useState(0);
    const [volatility, setVolatility] = useState(1);
    const [offset, setOffset] = useState(0);
    const numCol = useMemo(() => dataset.columns.find(c => dataset.profiles[c]?.type === 'number'), [dataset]);
    const chartData = useMemo(() => { if (!numCol) return []; const base = downsampleData(dataset.data, 100, numCol); const regression = calculateLinearRegression(base, numCol); return projectFutureData(base, regression, numCol, 20, trend, volatility, offset); }, [dataset, numCol, trend, volatility, offset]);

    return (
        <div className="h-full flex flex-col p-10 pb-48 max-w-[1600px] mx-auto space-y-10 overflow-y-auto bg-stone-900 text-white animate-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end border-b border-stone-800 pb-8">
                <div><h2 className="text-6xl font-serif font-black text-white tracking-tighter">Timewarp</h2><p className="text-stone-400 text-xl mt-3 font-light">Temporal Simulation & Forecasting Engine</p></div>
                <div className="text-right hidden md:block"><div className="text-orange-500 font-mono text-3xl font-bold animate-pulse">LIVE MODE</div></div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                <div className="lg:col-span-1 bg-stone-800 p-8 rounded-[2.5rem] border border-stone-700 shadow-2xl space-y-8">
                    <div className="space-y-6">
                        <label className="text-xs font-black text-stone-500 uppercase tracking-[0.25em]">Trend Vector</label><input type="range" min="-50" max="50" value={trend} onChange={e => setTrend(Number(e.target.value))} className="w-full h-2 bg-stone-950 rounded-full appearance-none cursor-pointer accent-orange-500" />
                        <label className="text-xs font-black text-stone-500 uppercase tracking-[0.25em]">Market Volatility</label><input type="range" min="0" max="5" step="0.1" value={volatility} onChange={e => setVolatility(Number(e.target.value))} className="w-full h-2 bg-stone-950 rounded-full appearance-none cursor-pointer accent-blue-500" />
                        <label className="text-xs font-black text-stone-500 uppercase tracking-[0.25em]">Offset Shift</label><input type="range" min="-1000" max="1000" value={offset} onChange={e => setOffset(Number(e.target.value))} className="w-full h-2 bg-stone-950 rounded-full appearance-none cursor-pointer accent-purple-500" />
                    </div>
                    <div className="pt-8 border-t border-stone-700 space-y-4">
                         <Button className="w-full bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50" onClick={() => setOffset(prev => prev - (prev * 0.3))}>Inject Crash (-30%)</Button>
                         <Button className="w-full bg-green-900/30 text-green-400 border border-green-900/50 hover:bg-green-900/50" onClick={() => setOffset(prev => prev + (prev * 0.3))}>Inject Spike (+30%)</Button>
                    </div>
                </div>
                <div className="lg:col-span-3 bg-black rounded-[2.5rem] border-[4px] border-stone-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-2 relative overflow-hidden min-h-[500px]">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.2)_0px,rgba(0,0,0,0.2)_1px,transparent_1px,transparent_4px)] pointer-events-none z-20 opacity-30"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-orange-900/10 pointer-events-none z-10"></div>
                    <div style={{ width: '100%', height: '100%', minHeight: '480px', minWidth: '0' }}>
                        <ResponsiveContainer width="99%" height="100%">
                            <LineChart data={chartData} margin={{ top: 40, right: 40, left: 20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="name" hide />
                                <YAxis stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #444', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fb923c' }} />
                                <Legend />
                                <Line type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} dot={false} name="Historical" opacity={0.5} />
                                <Line type="monotone" dataKey="forecast" stroke="#f97316" strokeWidth={4} dot={false} name="Projection" animationDuration={500} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- View: Exploration (Radar + Matrix + Sonification) ---

export const ExplorationView: React.FC<{ dataset: Dataset }> = ({ dataset }) => {
    const correlation = useMemo(() => calculateCorrelationMatrix(dataset.data, dataset.columns), [dataset]);
    const numCols = useMemo(() => dataset.columns.filter(c => dataset.profiles[c].type === 'number'), [dataset]);
    const [scatterX, setScatterX] = useState(numCols[0] || '');
    const [scatterY, setScatterY] = useState(numCols[1] || numCols[0] || '');

    const handleSonify = () => {
        if(numCols.length > 0) {
            playDataSonification(dataset.data, numCols[0]);
        }
    }

    return (
        <div className="h-full flex flex-col p-10 pb-48 max-w-[1600px] mx-auto space-y-10 overflow-y-auto bg-grain animate-in slide-in-from-bottom-4 duration-700">
             <header className="flex justify-between items-end">
                <div><h2 className="text-6xl font-serif font-black text-stone-900 tracking-tighter">Flavor Profile</h2><p className="text-stone-500 text-xl mt-2 font-light">Deep analysis of data texture and pairing.</p></div>
                <Button onClick={handleSonify} variant="secondary" className="gap-2 text-sm"><Music size={16}/> Listen to Data</Button>
             </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 <PremiumCard title="Correlation Matrix" className="h-[600px] bg-white">
                     <div className="overflow-auto h-full p-2 custom-scrollbar">
                         <div className="grid gap-2" style={{ gridTemplateColumns: `auto repeat(${correlation.columns.length}, minmax(70px, 1fr))` }}>
                             <div className="p-2"></div>
                             {correlation.columns.map(c => <div key={c} className="text-[10px] font-bold text-stone-400 -rotate-45 origin-bottom-left translate-x-4 uppercase tracking-wider">{c.substring(0,10)}</div>)}
                             {correlation.columns.map(rowCol => (<React.Fragment key={rowCol}><div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider text-right pr-4 self-center">{rowCol.substring(0,10)}</div>{correlation.columns.map(colCol => { const val = correlation.matrix.find(m => m.x === rowCol && m.y === colCol)?.value || 0; const opacity = Math.abs(val); const color = val > 0 ? '249, 115, 22' : '59, 130, 246'; return (<div key={`${rowCol}-${colCol}`} onClick={() => { setScatterX(rowCol); setScatterY(colCol); }} className="aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-sm transition-transform hover:scale-110 cursor-pointer" title={`${rowCol} vs ${colCol}: ${val}`} style={{ backgroundColor: `rgba(${color}, ${opacity})`, opacity: Math.max(0.1, opacity) }}>{val.toFixed(1)}</div>) })}</React.Fragment>))}
                         </div>
                     </div>
                 </PremiumCard>
                 <PremiumCard title="Pairing Detail" className="h-[600px] border-stone-200">
                     <div className="flex gap-4 mb-6 p-4 bg-stone-50 rounded-2xl">
                         <div className="flex-1"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 block">X Axis</label><select value={scatterX} onChange={e => setScatterX(e.target.value)} className="block w-full p-2 rounded-lg bg-white border border-stone-200 text-sm font-bold outline-none">{numCols.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                         <div className="flex-1"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 block">Y Axis</label><select value={scatterY} onChange={e => setScatterY(e.target.value)} className="block w-full p-2 rounded-lg bg-white border border-stone-200 text-sm font-bold outline-none">{numCols.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                     </div>
                     <div style={{ width: '100%', height: '400px', minHeight: '400px', minWidth: '0' }}>
                        <ResponsiveContainer width="99%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                                <XAxis type="number" dataKey={scatterX} name={scatterX} stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis type="number" dataKey={scatterY} name={scatterY} stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                <Scatter name="Data" data={downsampleData(dataset.data, 200, '')} fill="#f97316" fillOpacity={0.6} shape="circle" />
                            </ScatterChart>
                        </ResponsiveContainer>
                     </div>
                 </PremiumCard>
            </div>
        </div>
    )
}

// --- View: Report (Premium Editorial Edition) ---

export const ReportView: React.FC<{ dataset: Dataset }> = ({ dataset }) => {
    const [sections, setSections] = useState<ReportSection[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([{ id: '1', role: 'ai', text: 'I am your Executive Editor. Use this panel to refine sections or request new analysis.' }]);
    const [chatInput, setChatInput] = useState('');
    const [isPrinting, setIsPrinting] = useState(false);
    const [showInsertMenu, setShowInsertMenu] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    
    // Initial Doc Generation
    useEffect(() => {
        const initialSections = generateReportDocument(dataset);
        setSections(initialSections);
    }, [dataset]);

    const handleDownload = async () => {
        setIsPrinting(true);
        setTimeout(() => {
            downloadPDF(sections, `Strategic_Audit_${dataset.name}`);
            setIsPrinting(false);
        }, 100);
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        const userMsg = { id: crypto.randomUUID(), role: 'user' as const, text: chatInput };
        setMessages(prev => [...prev, userMsg]);
        setChatInput('');
        
        // Enhance context with real stats
        const numCols = dataset.columns.filter(c => dataset.profiles[c].type === 'number');
        const summaryStats = numCols.slice(0, 5).map(c => `${c} (mean: ${dataset.profiles[c].mean})`).join('; ');
        const datasetSummary = `Dataset: ${dataset.name}, Rows: ${dataset.rowCount}. Key Stats: ${summaryStats}`;
        
        const action = await performReportAction(userMsg.text, sections, datasetSummary);

        if (action.type === 'add_section' && action.sectionData) {
            setSections(prev => [...prev, action.sectionData!]);
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'ai', text: action.message || "Section added." }]);
        } else if (action.type === 'update_section' && action.sectionData) {
             setSections(prev => [...prev, { ...action.sectionData!, title: `Update: ${action.sectionData!.title}` }]);
             setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'ai', text: action.message || "I've added the updated analysis." }]);
        } else {
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'ai', text: action.message || "I've noted that. Please try a specific instruction like 'Add a risk section'." }]);
        }
    };

    const handleRewrite = async (id: string, content: string, instruction: string) => {
         const newContent = await rewriteSection(content, instruction);
         updateSectionContent(id, newContent);
    }

    const updateSectionContent = (id: string, newContent: string) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, content: newContent } : s));
    }

    const handleSmartInsert = (type: 'swot' | 'roadmap' | 'stats') => {
        const id = crypto.randomUUID();
        let newSection: ReportSection;
        
        if (type === 'swot') {
            newSection = {
                id, type: 'stats_grid', title: 'Ad-Hoc SWOT Analysis',
                stats: [
                    { label: 'Strength', value: 'High data fidelity', trend: 'up' },
                    { label: 'Weakness', value: 'Seasonal gaps', trend: 'down' },
                    { label: 'Opportunity', value: 'Market expansion', trend: 'neutral' },
                    { label: 'Threat', value: 'Competitor entry', trend: 'neutral' }
                ]
            };
        } else if (type === 'roadmap') {
             newSection = {
                 id, type: 'text', title: 'Action Roadmap',
                 content: 'PHASE 1: Immediate data cleaning.\nPHASE 2: Leverage trends.\nPHASE 3: Scale.'
             };
        } else {
             newSection = {
                 id, type: 'text', title: 'Statistical Breakdown', content: 'Detailed statistical analysis pending...'
             };
        }
        setSections(prev => [...prev, newSection]);
        setShowInsertMenu(false);
    }

    return (
        <div className={`h-full flex flex-col md:flex-row bg-white overflow-hidden font-sans transition-all duration-500 ${focusMode ? 'bg-stone-50' : 'bg-white'}`}>
             {/* Left Panel: AI Editor */}
             <div className={`md:w-96 bg-[#292524] border-r border-[#44403c] flex flex-col shrink-0 z-20 shadow-2xl transition-all duration-500 ease-in-out ${focusMode ? '-ml-96' : 'ml-0'}`}>
                 <div className="p-6 border-b border-[#44403c] bg-[#292524] flex items-center justify-between">
                     <h2 className="text-sm font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2"><Bot size={18}/> Editor Intelligence</h2>
                     <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                     {messages.map(m => (
                         <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                             <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed font-medium shadow-md transition-all duration-300 animate-fade-in-up ${m.role === 'user' ? 'bg-orange-600 text-white rounded-br-none' : 'bg-[#44403c] text-stone-200 rounded-bl-none border border-[#57534e]'}`}>
                                 {m.text}
                             </div>
                         </div>
                     ))}
                 </div>

                 <div className="p-6 border-t border-[#44403c] bg-[#292524]">
                     <div className="relative">
                         <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask AI to expand, refine, or add sections..." className="w-full bg-[#1c1917] border border-[#57534e] text-stone-200 p-4 pr-12 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm shadow-inner transition-all placeholder-stone-600" />
                         <button onClick={handleSendMessage} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-orange-500 p-2 transition-colors"><Send size={18}/></button>
                     </div>
                 </div>
             </div>

             {/* Right Panel: Seamless Document Preview */}
             <div className="flex-1 flex flex-col min-w-0 bg-white relative animate-in fade-in duration-700">
                 <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 z-50 px-8 transition-all">
                     <div><h1 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2"><FileText size={14}/> Live Strategic Document</h1></div>
                     <div className="flex gap-3 relative">
                         <Button onClick={() => setFocusMode(!focusMode)} variant="ghost" className="px-3 py-2 text-xs font-bold uppercase tracking-wider" title="Toggle Focus Mode">
                            {focusMode ? <EyeOff size={14} className="text-orange-500"/> : <Eye size={14}/>}
                         </Button>
                         <div className="relative">
                             <Button onClick={() => setShowInsertMenu(!showInsertMenu)} variant="secondary" className="px-4 py-2 text-xs font-bold uppercase tracking-wider gap-2"><Plus size={14}/> Smart Insert</Button>
                             {showInsertMenu && (
                                 <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-stone-200 shadow-xl rounded-xl overflow-hidden z-[60] flex flex-col animate-fade-in-up">
                                     <button onClick={() => handleSmartInsert('swot')} className="px-4 py-3 text-left text-sm font-bold text-stone-700 hover:bg-stone-50 border-b border-stone-100 flex items-center gap-2"><LayoutGrid size={14} className="text-orange-500"/> SWOT Matrix</button>
                                     <button onClick={() => handleSmartInsert('roadmap')} className="px-4 py-3 text-left text-sm font-bold text-stone-700 hover:bg-stone-50 border-b border-stone-100 flex items-center gap-2"><List size={14} className="text-blue-500"/> Action Roadmap</button>
                                 </div>
                             )}
                         </div>
                         <Button onClick={handleDownload} variant="oven" disabled={isPrinting} className="shadow-lg px-6 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                             {isPrinting ? <RotateCw className="animate-spin" size={14}/> : <Printer size={14}/>} {isPrinting ? 'Processing...' : 'Export PDF'}
                         </Button>
                     </div>
                 </div>

                 <div className="flex-1 overflow-y-auto custom-scrollbar bg-white relative">
                     {/* Document Container - Fluid height, max width centered, no paper borders */}
                     <div id="report-document-container" className="max-w-4xl mx-auto min-h-full bg-white relative selection:bg-orange-100 selection:text-orange-900 flex flex-col pt-12 pb-32">
                         
                         {/* Document Content */}
                         <div className="flex-1 flex flex-col relative z-10 px-12 md:px-16 space-y-8">
                            {sections.map((section, index) => (
                                <div key={section.id} className="relative group">
                                    
                                    {/* AI Context Menu (Floating in margin) */}
                                    {section.type === 'text' && (
                                        <div className="absolute -left-36 top-0 hidden xl:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                            <div className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mb-1 text-right">AI Tools</div>
                                            <button onClick={() => handleRewrite(section.id, section.content || '', 'more professional')} className="bg-stone-50 text-stone-600 p-2 rounded-lg border border-stone-100 hover:border-orange-200 hover:text-orange-600 transition-all text-xs font-bold flex items-center gap-2 whitespace-nowrap shadow-sm justify-end"><Sparkles size={12}/> Polish</button>
                                            <button onClick={() => handleRewrite(section.id, section.content || '', 'more detailed')} className="bg-stone-50 text-stone-600 p-2 rounded-lg border border-stone-100 hover:border-orange-200 hover:text-orange-600 transition-all text-xs font-bold flex items-center gap-2 whitespace-nowrap shadow-sm justify-end"><Plus size={12}/> Expand</button>
                                        </div>
                                    )}

                                    {section.type === 'header' && (
                                        <div className="pb-16 border-b border-stone-900 mb-12">
                                            <div className="flex justify-between items-start mb-24">
                                                <div className="flex items-center gap-3 text-stone-900"><ChefHat size={32}/><span className="font-serif font-bold text-xl tracking-tight">Data Bakery Intelligence</span></div>
                                                <div className="text-right">
                                                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-1">Audit Reference</div>
                                                    <div className="font-mono text-xs text-stone-900">{dataset.id.substring(0,8).toUpperCase()}</div>
                                                </div>
                                            </div>
                                            <h1 className="text-7xl font-serif font-black text-stone-900 mb-8 leading-[0.9] tracking-tighter">{section.title}</h1>
                                            <p className="text-stone-500 font-mono text-xs uppercase tracking-[0.2em] max-w-md leading-relaxed">{section.content}</p>
                                        </div>
                                    )}

                                    {section.type === 'text' && (
                                        <div className="mb-4">
                                            {section.title && <h3 className="text-base font-bold text-stone-900 mb-3 uppercase tracking-widest">{section.title}</h3>}
                                            <AutoResizingTextarea
                                                value={section.content || ''}
                                                onChange={(val) => updateSectionContent(section.id, val)}
                                                className="w-full text-[12pt] text-stone-800 leading-[1.8] bg-transparent border-none focus:ring-0 p-0 font-serif resize-none overflow-hidden placeholder-stone-300 min-h-[1em] hover:bg-stone-50 transition-colors rounded-lg -ml-2 px-2"
                                                style={{ textAlign: 'justify' }}
                                            />
                                        </div>
                                    )}

                                    {section.type === 'stats_grid' && (
                                        <div className="my-12 py-10 border-y border-stone-200">
                                            {section.title && <h3 className="text-sm font-bold text-orange-600 mb-8 uppercase tracking-widest border-l-4 border-orange-500 pl-3">{section.title}</h3>}
                                            <div className="grid grid-cols-2 gap-8">
                                                {section.stats?.map((stat, i) => (
                                                    <div key={i} className={`flex flex-col p-6 rounded-xl border ${i % 2 === 0 ? 'bg-stone-50/50 border-stone-100' : 'bg-white border-stone-200 shadow-sm'}`}>
                                                        <div className="text-[10px] font-black text-stone-400 uppercase tracking-[0.15em] mb-3">{stat.label}</div>
                                                        <div className="text-lg font-serif font-medium text-stone-900 mb-2 leading-tight">{stat.value}</div>
                                                        <div className={`text-[10px] font-bold flex items-center gap-1 uppercase tracking-wide ${stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-stone-400'}`}>
                                                            {stat.trend === 'up' ? '▲ Strength' : stat.trend === 'down' ? '▼ Weakness' : '• Neutral'} 
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Digital Signature Block */}
                            <div className="mt-20 border-t border-stone-900 pt-8 w-64">
                                <div className="font-serif italic text-3xl text-stone-900 mb-2 font-bold opacity-80" style={{ fontFamily: '"Playfair Display", serif' }}>Data Bakery AI</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Authorized Signature</div>
                            </div>

                         </div>
                         
                         {/* Visual Footer (Screen Only) */}
                         <div className="mt-24 pt-8 border-t border-stone-100 flex items-center justify-between px-16 text-[9px] font-mono text-stone-400 uppercase tracking-widest">
                             <span>Generated by Data Bakery AI</span>
                             <span>Confidential Strategic Document</span>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
    )
}
