
export interface DataPoint {
  [key: string]: string | number | boolean | null;
}

export interface ColumnProfile {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  missing: number;
  unique: number;
  mean?: number;
  min?: number;
  max?: number;
  health: number; // 0-100
}

export interface Dataset {
  id: string; // Unique ID for this specific version state
  rootId: string; // ID of the original uploaded file
  versionIndex: number;
  name: string;
  data: DataPoint[];
  columns: string[];
  profiles: Record<string, ColumnProfile>;
  healthScore: number;
  rowCount: number;
  isSynthetic?: boolean;
  changeLog?: string; // Description of what changed in this version
}

export type RecipeType = 'clean' | 'filter' | 'transform' | 'merge' | 'synthetic';

export interface TransformationRecipe {
  id: string;
  type: RecipeType;
  name: string;
  description: string;
  active: boolean;
  action?: (data: DataPoint[]) => DataPoint[]; 
}

export interface RecipeVersion {
  id: string;
  timestamp: number;
  recipes: TransformationRecipe[];
  note: string;
}

export type SousChefPersona = 'executive' | 'grandma' | 'gordon' | 'scientist';

export interface Insight {
  title: string;
  description: string;
  type: 'anomaly' | 'trend' | 'correlation' | 'general';
  confidence: number;
}

export interface SimulationEvent {
  id: string;
  name: string;
  index: number; // Time index where it happens
  effect: 'spike' | 'crash' | 'drift_up' | 'drift_down' | 'noise';
  intensity: number; // 0-1 multiplier
}

export interface TimeBranch {
    id: string;
    name: string;
    type: 'optimistic' | 'pessimistic' | 'normal' | 'custom';
    events: SimulationEvent[];
    color: string;
}

export interface DoughBatchConfig {
    yeast: number; // Variance/Noise
    sugar: number; // Trend
    knead: number; // Smoothing
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    text: string;
}

export interface ToastNotification {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}

export interface TutorialStep {
    target: string; // CSS selector or ID
    title: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface FlavorMetrics {
    volatility: number;
    skew: number;
    completeness: number;
    uniqueness: number;
    variety: number;
}

export interface ForecastShadow {
    index: number;
    upper: number;
    lower: number;
}

export interface ReportSection {
    id: string;
    type: 'header' | 'text' | 'chart' | 'stats_grid';
    title?: string;
    content?: string;
    chartType?: 'line' | 'bar' | 'area';
    chartData?: any[];
    stats?: { label: string; value: string; trend: 'up' | 'down' | 'neutral' }[];
}

export interface AIReportAction {
    type: 'add_section' | 'update_section' | 'none';
    sectionData?: ReportSection;
    message: string;
}

export interface MarketplaceItem {
    id: string;
    name: string;
    category: string;
    description: string;
    rows: number;
    data: DataPoint[]; // Mock data for instant load
}

export type AppTheme = 'bakery' | 'lab' | 'scifi' | 'cyberpunk';

export interface PerformanceMetrics {
    fps: number;
    memory: number; // MB
    loadTime: number; // ms
    datasetSize: number; // rows
    activeAnimations: number;
}

export interface Collaborator {
    id: string;
    name: string;
    color: string;
    cursorX: number;
    cursorY: number;
    activeStation: AppView;
    role: 'Head Chef' | 'Sous Chef';
}

export interface ChefNote {
    id: string;
    x: number;
    y: number;
    text: string;
    author: string;
}

export interface PipelineTemplate {
    id: string;
    name: string;
    recipes: TransformationRecipe[];
}

export enum AppView {
  ONBOARDING = 'ONBOARDING',
  OVEN = 'OVEN',
  INGREDIENTS = 'INGREDIENTS',
  DATALOOM = 'DATALOOM',
  TIMEWARP = 'TIMEWARP',
  EXPLORATION = 'EXPLORATION',
  REPORT = 'REPORT',
  KITCHEN_3D = 'KITCHEN_3D'
}
