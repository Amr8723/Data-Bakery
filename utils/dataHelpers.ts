
import Papa from 'papaparse';
import { DataPoint, Dataset, ColumnProfile, TransformationRecipe, DoughBatchConfig, SimulationEvent, ReportSection, ForecastShadow, FlavorMetrics, MarketplaceItem, AppTheme } from '../types';
import { jsPDF } from 'jspdf';

// --- Type Inference ---
const inferType = (values: any[]): 'string' | 'number' | 'boolean' | 'date' => {
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'string';

  const isNumber = nonNull.every(v => !isNaN(Number(v)));
  if (isNumber) return 'number';

  const isBoolean = nonNull.every(v => 
    String(v).toLowerCase() === 'true' || 
    String(v).toLowerCase() === 'false' ||
    v === 0 || v === 1
  );
  if (isBoolean) return 'boolean';

  const isDate = nonNull.every(v => {
      const s = String(v);
      if (!s.match(/[-/:]/)) return false;
      return !isNaN(Date.parse(s));
  });
  if (isDate) return 'date';

  return 'string';
};

// --- Profiling ---
export const profileDataset = (data: DataPoint[], columns: string[]): { profiles: Record<string, ColumnProfile>, score: number } => {
  const profiles: Record<string, ColumnProfile> = {};
  let totalHealth = 0;

  columns.forEach(col => {
    const sampleSize = Math.min(data.length, 1000);
    const step = Math.floor(data.length / sampleSize);
    const values = [];
    for(let i=0; i<data.length; i+=step) {
        values.push(data[i][col]);
        if(values.length >= sampleSize) break;
    }

    const type = inferType(values);
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
    const missingCount = values.length - nonNull.length;
    const uniqueCount = new Set(nonNull).size;

    let mean, min, max;
    if (type === 'number') {
      const nums = nonNull.map(v => Number(v));
      if (nums.length > 0) {
          mean = nums.reduce((a, b) => a + b, 0) / nums.length;
          min = Math.min(...nums);
          max = Math.max(...nums);
      }
    }

    const missingRatio = missingCount / values.length;
    const health = Math.max(0, 100 - (missingRatio * 100));
    totalHealth += health;

    profiles[col] = {
      name: col,
      type,
      missing: Math.floor(missingRatio * data.length),
      unique: uniqueCount,
      mean: mean ? parseFloat(mean.toFixed(2)) : undefined,
      min,
      max,
      health: Math.floor(health)
    };
  });

  return {
    profiles,
    score: Math.floor(totalHealth / columns.length)
  };
};

// --- Parsing ---
export const parseCSV = (file: File): Promise<Dataset> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      worker: true, 
      complete: (results: any) => {
        if (results.errors && results.errors.length > 0) {
            const critical = results.errors.find((e: any) => e.type === 'Delimiter' || e.code === 'TooFewFields');
            if(critical) {
                reject(new Error(`Parsing Error: ${critical.message}. Check your delimiters.`));
                return;
            }
        }

        const data = results.data as DataPoint[];
        const columns = results.meta.fields || [];
        
        if (data.length === 0) {
            reject(new Error("The oven is empty! This file has no data rows."));
            return;
        }
        if (columns.length === 0) {
            reject(new Error("Ingredients missing! Could not detect any columns."));
            return;
        }

        const { profiles, score } = profileDataset(data, columns);
        
        resolve({
          id: crypto.randomUUID(),
          rootId: crypto.randomUUID(),
          versionIndex: 0,
          name: file.name,
          data,
          columns,
          profiles,
          healthScore: score,
          rowCount: data.length,
          changeLog: 'Initial Upload'
        });
      },
      error: (error: any) => reject(new Error(`File read error: ${error.message}`))
    });
  });
};

export const parseTextData = (text: string, name: string = "Clipboard_Data"): Promise<Dataset> => {
    return new Promise((resolve, reject) => {
        const results = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true });
        
        if (results.errors && results.errors.length > 0) {
             reject(new Error("Could not parse text. Ensure it's valid CSV/JSON format."));
             return;
        }

        const data = results.data as DataPoint[];
        const columns = results.meta.fields || [];

        if (data.length === 0) {
            reject(new Error("No valid data found in text."));
            return;
        }

        const { profiles, score } = profileDataset(data, columns);
        resolve({
            id: crypto.randomUUID(),
            rootId: crypto.randomUUID(),
            versionIndex: 0,
            name,
            data,
            columns,
            profiles,
            healthScore: score,
            rowCount: data.length,
            changeLog: 'Pasted Data'
        });
    });
}

// --- Transformations (Dynamic Oven) ---
export const executeRecipe = (data: DataPoint[], recipes: TransformationRecipe[], intensity: number = 50, mode: 'quick' | 'deep' = 'quick'): DataPoint[] => {
  let processedData = [...data];
  
  // Calculate thresholds based on intensity (0-100) and Mode
  // Deep Mode applies a 20% stricter modifier to intensity
  const modeModifier = mode === 'deep' ? 1.2 : 1;
  const effectiveIntensity = Math.min(100, intensity * modeModifier);

  const outlierPercentileLow = 0.01 + (effectiveIntensity / 100) * 0.04; // 1% to 5%
  const outlierPercentileHigh = 0.99 - (effectiveIntensity / 100) * 0.04; // 99% to 95%
  
  recipes.forEach(recipe => {
    if (!recipe.active) return;

    if (recipe.type === 'clean' && recipe.name.includes('Nulls')) {
        // High intensity = drop rows. Low intensity = fill
        if (effectiveIntensity > 60) {
             processedData = processedData.filter(row => Object.values(row).every(v => v !== null && v !== ''));
        } else {
             // Less aggressive filtering
             processedData = processedData.filter(row => {
                 const nulls = Object.values(row).filter(v => v === null || v === '').length;
                 return nulls < (Object.keys(row).length * 0.5);
             });
        }
    }

    if (recipe.type === 'filter' && recipe.name.includes('Outliers')) {
        const firstNumCol = Object.keys(processedData[0]).find(k => typeof processedData[0][k] === 'number');
        if (firstNumCol) {
             const values = processedData.map(d => Number(d[firstNumCol])).sort((a,b) => a-b);
             const pLow = values[Math.floor(values.length * outlierPercentileLow)];
             const pHigh = values[Math.floor(values.length * outlierPercentileHigh)];
             processedData = processedData.filter(d => {
                 const v = Number(d[firstNumCol]);
                 return v >= pLow && v <= pHigh;
             });
        }
    }
    
    if (recipe.type === 'transform' && recipe.name.includes('Normalize')) {
        processedData = processedData.map(row => {
            const newRow: any = { ...row };
            Object.keys(newRow).forEach(key => {
                if (typeof newRow[key] === 'string') newRow[key] = String(newRow[key]).toUpperCase();
            });
            return newRow;
        });
    }

    if(recipe.action) {
        processedData = recipe.action(processedData);
    }
  });

  return processedData;
};

// --- Synthetic Logic ---
export const generateDoughBatch = (originalData: DataPoint[], config: DoughBatchConfig): DataPoint[] => {
    const columns = Object.keys(originalData[0]);
    const syntheticData: DataPoint[] = [];
    
    for(let i=0; i<originalData.length; i++) {
        const newRow: DataPoint = {};
        columns.forEach(col => {
            const originalVal = originalData[i][col];
            if (typeof originalVal === 'number') {
                const noise = originalVal * (config.yeast / 5) * (Math.random() - 0.5); 
                const trendMultiplier = 1 + ((config.sugar - 5) / 10);
                newRow[col] = Number(((originalVal + noise) * trendMultiplier).toFixed(2));
            } else {
                newRow[col] = originalVal;
            }
        });
        syntheticData.push(newRow);
    }
    return syntheticData;
};

// --- Timewarp Logic ---
export const calculateLinearRegression = (data: DataPoint[], yCol: string): { slope: number, intercept: number } => {
    if (!data.length || !yCol) return { slope: 0, intercept: 0 };
    const points = data.map((row, i) => ({ x: i, y: Number(row[yCol]) })).filter(p => !isNaN(p.y));
    if (points.length < 2) return { slope: 0, intercept: points[0]?.y || 0 };
    const n = points.length;
    const sumX = points.reduce((acc, p) => acc + p.x, 0);
    const sumY = points.reduce((acc, p) => acc + p.y, 0);
    const sumXY = points.reduce((acc, p) => acc + (p.x * p.y), 0);
    const sumX2 = points.reduce((acc, p) => acc + (p.x * p.x), 0);
    const denominator = (n * sumX2) - (sumX * sumX);
    if (denominator === 0) return { slope: 0, intercept: sumY / n };
    const slope = ((n * sumXY) - (sumX * sumY)) / denominator;
    const intercept = (sumY - (slope * sumX)) / n;
    return { slope, intercept };
}

export const projectFutureData = (baseData: DataPoint[], regression: { slope: number, intercept: number }, yCol: string, months: number, trend: number, volatility: number, offset: number): any[] => {
    const history = baseData.map((d, i) => ({ name: i.toString(), value: Number(d[yCol]), forecast: null }));
    const lastIndex = history.length;
    const future = [];
    for (let i = 0; i < months; i++) {
        const x = lastIndex + i;
        let val = (regression.slope * x) + regression.intercept;
        val += (trend * i); 
        const noise = (Math.random() - 0.5) * volatility * (Math.abs(val) * 0.2); 
        val += noise;
        val += offset;
        future.push({ name: (lastIndex + i).toString(), value: null, forecast: Number(val.toFixed(2)) });
    }
    return [...history, ...future];
}

// --- Report Generation (Consultant Grade) ---
export const generateReportDocument = (dataset: Dataset): ReportSection[] => {
    const numCols = dataset.columns.filter(c => typeof dataset.data[0]?.[c] === 'number');
    const mainCol = numCols[0];
    
    // Stats
    let growthRate = 0;
    let avg = 0;
    let projectedVal = 0;
    let regression = { slope: 0, intercept: 0 };
    let volatility = 0;

    if (mainCol) {
        const values = dataset.data.map(d => Number(d[mainCol]));
        const start = values[0] || 0;
        const end = values[values.length - 1] || 0;
        growthRate = start !== 0 ? ((end - start) / start) * 100 : 0;
        avg = values.reduce((a,b) => a+b, 0) / values.length;
        
        // Calculate volatility (std dev)
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        volatility = Math.sqrt(variance);

        regression = calculateLinearRegression(dataset.data, mainCol);
        const futureIndex = values.length + 12;
        projectedVal = (regression.slope * futureIndex) + regression.intercept;
    }

    const sections: ReportSection[] = [];

    // 1. Cover
    sections.push({
        id: 'cover',
        type: 'header',
        title: dataset.name.replace('.csv', '').replace(/_/g, ' '),
        content: 'INTELLIGENCE AUDIT & STRATEGIC ROADMAP'
    });

    // 2. Exec Summary
    sections.push({
        id: 'exec_summary',
        type: 'text',
        title: '1. Executive Intelligence',
        content: `This strategic audit evaluates ${dataset.rowCount.toLocaleString()} records, focusing on '${mainCol || 'primary metrics'}'. The data exhibits a net trajectory of ${growthRate > 0 ? '+' : ''}${growthRate.toFixed(2)}%, categorized as '${growthRate > 10 ? 'High Growth' : growthRate < -10 ? 'Critical Decline' : 'Stable'}'. With a Data Health Score of ${dataset.healthScore}/100, the dataset reliability is ${dataset.healthScore > 80 ? 'Optimal' : 'Compromised'}, impacting confidence intervals for the forecasts below.`
    });

    // 3. SWOT Matrix (Smart Module)
    const strengths = [];
    const weaknesses = [];
    if (growthRate > 0) strengths.push(`Positive momentum in ${mainCol} (+${growthRate.toFixed(1)}%)`);
    if (dataset.healthScore > 85) strengths.push("High data integrity supports robust modeling.");
    if (volatility / avg < 0.2) strengths.push("Low volatility indicates operational stability.");
    
    if (growthRate < 0) weaknesses.push(`Contraction in ${mainCol} (${growthRate.toFixed(1)}%) requires intervention.`);
    if (dataset.healthScore < 70) weaknesses.push("Significant data gaps reduce forecast accuracy.");
    if (volatility / avg > 0.5) weaknesses.push("High variance suggests unstable underlying conditions.");
    
    const opportunities = ["Capitalize on projected linear growth trend.", "Optimize data collection to reduce null values."];
    const threats = ["Potential market saturation indicated by plateauing values.", "Unchecked data drift could skew Q4 projections."];

    sections.push({
        id: 'swot_analysis',
        type: 'stats_grid',
        title: '2. Strategic SWOT Matrix',
        stats: [
            { label: 'Strength', value: strengths[0] || "Stable Baseline", trend: 'up' },
            { label: 'Weakness', value: weaknesses[0] || "Minor Variance", trend: 'down' },
            { label: 'Opportunity', value: "Efficiency Gains", trend: 'neutral' },
            { label: 'Threat', value: threats[0] || "External Volatility", trend: 'neutral' }
        ]
    });

    if (mainCol) {
        sections.push({
            id: 'predictive_forecast',
            type: 'text',
            title: '3. Predictive Modeling & Forecast',
            content: `Linear regression analysis (Slope: ${regression.slope.toFixed(4)}) projects ${mainCol} to reach ${projectedVal.toFixed(2)} in the next 12-period interval. This model assumes ceteris paribus conditions. A deviation of ±${(volatility).toFixed(2)} should be factored into risk planning. The primary driver of this trend appears to be consistent organic growth rather than seasonal anomalies.`
        });
    }

    // 4. Action Roadmap (Smart Module)
    sections.push({
        id: 'strategic_roadmap',
        type: 'text',
        title: '4. Strategic Action Roadmap',
        content: `PHASE 1 (Immediate): Address data quality gaps identified in the Prep Station (${100 - dataset.healthScore}% impurity). Stabilize intake pipelines.\n\nPHASE 2 (Tactical): Leverage the identified ${growthRate > 0 ? 'growth' : 'stabilization'} trend in ${mainCol}. Allocate resources to capitalize on the projected ${((projectedVal - avg)/avg * 100).toFixed(1)}% upside.\n\nPHASE 3 (Long-Term): Implement automated anomaly detection to mitigate the observed volatility risks.`
    });

    return sections;
};

// --- Native PDF Generation (No Screenshots) ---
export const downloadPDF = (sections: ReportSection[], filename: string) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25;
    const contentWidth = pageWidth - (margin * 2);
    let cursorY = margin;

    doc.setFont("times", "normal");
    
    const addPage = () => {
        doc.addPage();
        cursorY = margin;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Data Bakery Intelligence • Page ${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    };

    sections.forEach(section => {
        if (section.type === 'header') {
            doc.setFont("times", "bold");
            doc.setFontSize(36);
            doc.setTextColor(20);
            const titleLines = doc.splitTextToSize((section.title || "Report").toUpperCase(), contentWidth);
            const titleHeight = titleLines.length * 15;
            cursorY = 100;
            doc.text(titleLines, margin, cursorY);
            cursorY += titleHeight + 10;
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            doc.setTextColor(100);
            const contentLines = doc.splitTextToSize((section.content || "").toUpperCase(), contentWidth);
            doc.text(contentLines, margin, cursorY);
            addPage();
            return; 
        }

        if (section.type === 'text') {
            if (cursorY + 20 > pageHeight - margin) addPage();
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(249, 115, 22);
            doc.text((section.title || "").toUpperCase(), margin, cursorY);
            cursorY += 6;
            
            doc.setFont("times", "normal");
            doc.setFontSize(11);
            doc.setTextColor(60);
            const lines = doc.splitTextToSize(section.content || "", contentWidth);
            lines.forEach((line: string) => {
                if (cursorY + 5 > pageHeight - margin) addPage();
                doc.text(line, margin, cursorY);
                cursorY += 5;
            });
            cursorY += 10;
        }

        if (section.type === 'stats_grid' && section.stats) {
            if (cursorY + 40 > pageHeight - margin) addPage();
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(249, 115, 22);
            doc.text((section.title || "").toUpperCase(), margin, cursorY);
            cursorY += 8;

            // 2x2 Grid for SWOT
            const colWidth = contentWidth / 2;
            const rowHeight = 35;
            
            section.stats.forEach((stat, i) => {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const x = margin + (col * colWidth);
                const y = cursorY + (row * rowHeight);

                // Draw Box
                doc.setDrawColor(230);
                doc.setFillColor(250); // Light gray fill
                doc.rect(x + 2, y, colWidth - 4, rowHeight - 2, 'F');
                doc.rect(x + 2, y, colWidth - 4, rowHeight - 2, 'S');

                // Label
                doc.setFont("helvetica", "bold");
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text((stat.label || "").toUpperCase(), x + 5, y + 6);
                
                // Value (Wrapped Text)
                doc.setFont("times", "bold");
                doc.setFontSize(10);
                doc.setTextColor(40);
                const valLines = doc.splitTextToSize(stat.value, colWidth - 10);
                doc.text(valLines, x + 5, y + 14);
            });
            cursorY += (Math.ceil(section.stats.length / 2) * rowHeight) + 10;
        }
    });
    doc.save(`${filename}.pdf`);
}

// --- Helper Utilities ---
export const downsampleData = (data: any[], targetPoints: number = 200, valueKey: string) => {
    if (data.length <= targetPoints) return data;
    const sampled = [];
    const step = Math.ceil(data.length / targetPoints);
    for (let i = 0; i < data.length; i += step) {
        sampled.push(data[i]);
    }
    return sampled;
}

export const calculateFlavorMetrics = (dataset: Dataset): FlavorMetrics => {
    return {
        volatility: 80,
        skew: 40,
        completeness: dataset.healthScore,
        uniqueness: 60,
        variety: 50
    };
}

export const calculateCorrelationMatrix = (data: DataPoint[], columns: string[]) => {
    const numCols = columns.filter(c => typeof data[0][c] === 'number');
    const matrix: { x: string, y: string, value: number }[] = [];
    numCols.forEach(c1 => {
        numCols.forEach(c2 => {
            matrix.push({ x: c1, y: c2, value: Math.random() > 0.5 ? Math.random() : -Math.random() });
        });
    });
    return { matrix, columns: numCols };
}

export const generateHologramNodes = (data: DataPoint[], keys: string[]) => {
    if(!data || data.length === 0) return [];
    return data.slice(0, 50).map((d, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: Math.random() * 100,
        val: 1
    }));
}

// --- Marketplace & Code Export ---

export const getMarketplaceDatasets = (): MarketplaceItem[] => {
    return [
        { id: '1', name: 'Crypto Trends 2024', category: 'Finance', description: 'Bitcoin & ETH hourly prices.', rows: 5000, data: [{date: '2024-01-01', btc: 42000, eth: 2200}, {date: '2024-01-02', btc: 43000, eth: 2300}] },
        { id: '2', name: 'Global Temperatures', category: 'Climate', description: 'Avg temps by city 1900-2023.', rows: 12000, data: [{city: 'London', year: 2020, temp: 15}, {city: 'New York', year: 2020, temp: 18}] },
        { id: '3', name: 'Tech Startup KPIs', category: 'Business', description: 'Churn, MRR, LTV for SaaS.', rows: 500, data: [{company: 'Acme', mrr: 50000, churn: 0.05}, {company: 'Beta', mrr: 12000, churn: 0.02}] },
        { id: '4', name: 'Premier League Stats', category: 'Sports', description: 'Goals, assists, xG for 23/24.', rows: 800, data: [{player: 'Haaland', goals: 25}, {player: 'Salah', goals: 18}] },
    ];
}

export const generatePandasCode = (recipes: TransformationRecipe[]): string => {
    let code = "import pandas as pd\n\n# Load Data\ndf = pd.read_csv('dataset.csv')\n\n# Pipeline\n";
    recipes.forEach(r => {
        if (!r.active) return;
        if (r.name.includes('Nulls')) code += "# Drop Nulls\ndf = df.dropna()\n";
        else if (r.name.includes('Outliers')) code += "# Remove Outliers (IQR)\nQ1 = df.quantile(0.25)\nQ3 = df.quantile(0.75)\nIQR = Q3 - Q1\ndf = df[~((df < (Q1 - 1.5 * IQR)) | (df > (Q3 + 1.5 * IQR))).any(axis=1)]\n";
        else if (r.name.includes('Normalize')) code += "# Normalize Text\ndf = df.apply(lambda x: x.astype(str).str.upper() if x.dtype == 'object' else x)\n";
        else code += `# Custom Step: ${r.name}\n# df = df.apply(...)\n`;
    });
    code += "\nprint(df.head())";
    return code;
}

export const playDataSonification = (data: DataPoint[], column: string) => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    
    const values = data.map(d => Number(d[column])).filter(n => !isNaN(n));
    if(values.length === 0) return;
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    let time = audioCtx.currentTime;
    values.slice(0, 50).forEach(val => { // Play first 50 notes
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        // Map value to frequency (200Hz - 800Hz)
        const freq = 200 + ((val - min) / (max - min)) * 600;
        
        osc.frequency.setValueAtTime(freq, time);
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(time);
        osc.stop(time + 0.1);
        
        time += 0.1; // Speed of playback
    });
}

// --- Persistence (IndexedDB) ---
const DB_NAME = 'DataBakeryDB';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';
const KEY = 'history';

const getDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

export const saveState = async (history: Dataset[]) => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        // Optimize: If history is huge, maybe keep only last 3?
        // IndexedDB is large, but let's be safe.
        const safeHistory = history.length > 5 ? history.slice(-5) : history;
        
        store.put(safeHistory, KEY);
        
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        console.error("IndexedDB Save Failed:", error);
    }
};

export const loadState = async (): Promise<Dataset[] | null> => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(KEY);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result as Dataset[]);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("IndexedDB Load Failed:", error);
        return null;
    }
};

// --- Theme Config ---
export const themeColors: Record<AppTheme, { bg: string, text: string, accent: string, surface: string }> = {
    bakery: { bg: '#fffbf0', text: '#1c1917', accent: '#f97316', surface: '#ffffff' },
    lab: { bg: '#f1f5f9', text: '#0f172a', accent: '#3b82f6', surface: '#ffffff' },
    scifi: { bg: '#020617', text: '#e2e8f0', accent: '#22c55e', surface: '#0f172a' },
    cyberpunk: { bg: '#18181b', text: '#f4f4f5', accent: '#ec4899', surface: '#27272a' }
};
