
import { GoogleGenAI } from "@google/genai";
import { Dataset, TransformationRecipe, SousChefPersona, AIReportAction, ReportSection } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to prevent token overflow
const truncateForPrompt = (data: any[], length: number = 5) => {
    return JSON.stringify(data.slice(0, length));
}

export const checkDataHealth = async (dataset: Dataset, persona: SousChefPersona = 'executive'): Promise<{ summary: string; score: number; recommendations: string[] }> => {
  if (!apiKey) {
      const summaries: Record<string, string> = {
          executive: "The dataset structure is parsed. Review key metrics below.",
          grandma: "Oh honey, you've brought me some lovely ingredients! Let's see what we can bake.",
          gordon: "THIS DATA IS RAW! LOOK AT THOSE NULL VALUES!",
          scientist: "Preliminary analysis complete. Anomalies detected in null distribution."
      };
      return { 
          summary: summaries[persona] || summaries.executive, 
          score: dataset.healthScore, 
          recommendations: ["Check for nulls", "Standardize date formats", "Remove duplicates"] 
      };
  }

  const sample = truncateForPrompt(dataset.data, 3);
  const columns = JSON.stringify(dataset.columns);
  
  const personaInstructions: Record<string, string> = {
      executive: "Speak like a professional CEO. Be concise, focus on value and ROI.",
      grandma: "Speak like a sweet baking grandmother. Use baking metaphors (dough, rising, sugar). Be encouraging.",
      gordon: "Speak like an angry celebrity chef (Gordon Ramsay). Yell about the data quality. Be harsh but helpful.",
      scientist: "Speak like a data scientist. Be technical, mention distributions, variance, and null hypotheses."
  };

  const prompt = `
    Analyze this dataset sample (columns: ${columns}, first 3 rows: ${sample}).
    Persona: ${personaInstructions[persona] || personaInstructions.executive}
    1. Give a summary of what this data represents in the requested persona.
    2. Estimate a "Health Score" (0-100) based on quality.
    3. List 3 brief specific recommendations to clean or improve it.
    
    Return JSON: { "summary": string, "score": number, "recommendations": string[] }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text);
  } catch (e) {
    return {
      summary: "Data parsed successfully.",
      score: 80,
      recommendations: ["Validate columns", "Check for outliers"]
    };
  }
};

export const generateRecipe = async (instruction: string, columns: string[]): Promise<TransformationRecipe[]> => {
  if (!apiKey) return [];

  const prompt = `
    I have a dataset with columns: ${JSON.stringify(columns)}.
    User wants: "${instruction}".
    Create a list of data transformation steps (recipes) to achieve this.
    Return JSON array of objects: { "id": "uuid", "type": "clean"|"filter"|"transform", "name": "Short Title", "description": "What it does", "active": true }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [
      { id: crypto.randomUUID(), type: 'clean', name: 'Manual Step', description: 'Could not generate AI recipe', active: true }
    ];
  }
};

export const performReportAction = async (
    userMessage: string, 
    currentSections: ReportSection[], 
    datasetSummary: string
): Promise<AIReportAction> => {
    if (!apiKey) {
        return {
            type: 'none',
            message: "I can't edit reports while offline. Please check your API key."
        };
    }

    const sectionContext = currentSections.map(s => `ID: ${s.id}, Title: ${s.title}, Type: ${s.type}`).join('\n');

    const prompt = `
        You are an intelligent report editor for a data analytics tool.
        User Request: "${userMessage}"
        Dataset Context: ${datasetSummary}
        Current Sections: 
        ${sectionContext}

        Determine the best action:
        1. 'add_section': Create a new section based on the request.
        2. 'none': If the request is conversational or unclear.

        Return JSON:
        {
            "type": "add_section" | "none",
            "message": "Short response to user",
            "sectionData": {
                "id": "generate_uuid",
                "type": "text" | "chart" | "stats_grid",
                "title": "Section Title",
                "content": "Section content (text)",
                "chartType": "line" | "bar" | "area" (optional, if chart needed),
                "stats": [{"label": "Name", "value": "123", "trend": "up"}] (optional, if stats_grid needed)
            } (only if type is add_section)
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("Report Action Error", e);
        return { type: 'none', message: "I had trouble processing that request." };
    }
};

export const rewriteSection = async (content: string, instruction: string): Promise<string> => {
    if (!apiKey) return content + " (AI Unavailable)";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Rewrite the following text to be ${instruction}. Keep the facts same. Text: "${content}"`
        });
        return response.text || content;
    } catch (e) {
        return content;
    }
}

export const generateSlideContent = async (topic: string, dataSummary: string): Promise<{ title: string; bullets: string[] }> => {
    if (!apiKey) return { title: topic, bullets: ["AI unavailable", "Please check API Key"] };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a slide for a presentation about "${topic}". Data Context: ${dataSummary}. Return JSON: { "title": "Slide Title", "bullets": ["Point 1", "Point 2", "Point 3"] }`,
            config: { responseMimeType: 'application/json' }
        });
        const text = response.text;
        if (!text) return { title: topic, bullets: [] };
        return JSON.parse(text);
    } catch (e) {
        return { title: topic, bullets: ["Could not generate content"] };
    }
};

export const generateSimulationParams = async (scenario: string): Promise<{ trend: number; volatility: number; offset: number }> => {
    if (!apiKey) return { trend: 0, volatility: 1, offset: 0 };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate simulation parameters for scenario: "${scenario}". Return JSON: { "trend": number (-50 to 50), "volatility": number (0-5), "offset": number (-1000 to 1000) }`,
            config: { responseMimeType: 'application/json' }
        });
        const text = response.text;
        if (!text) return { trend: 0, volatility: 1, offset: 0 };
        return JSON.parse(text);
    } catch(e) {
        return { trend: 0, volatility: 1, offset: 0 };
    }
}

export const explainDataPoint = async (point: any, context: string): Promise<string> => {
     if (!apiKey) return "AI explanation unavailable.";
     try {
         const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: `Explain this data point: ${JSON.stringify(point)}. Context: ${context}. Keep it under 20 words.`
         });
         return response.text || "No explanation.";
     } catch(e) {
         return "Error explaining point.";
     }
}

export const critiqueReport = async (report: string): Promise<string> => {
    if (!apiKey) return "Critique unavailable.";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Critique this data report and suggest one improvement:\n\n${report}`
        });
        return response.text || "Report looks good.";
    } catch (e) {
        return "Critique failed.";
    }
}

export const parseImageToData = async (imageBase64: string): Promise<{ data: any[], columns: string[] }> => {
    // In a real scenario, this connects to Gemini 1.5 Flash Vision capabilities.
    // For this implementation, we will simulate a smart OCR response if no API key, or use mocked return for demo continuity.
    
    // Simulate complex extraction
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                columns: ["Item", "Quantity", "Price", "Total", "Category"],
                data: [
                    { Item: "Flour (Sacks)", Quantity: 5, Price: 45.00, Total: 225.00, Category: "Raw Material" },
                    { Item: "Sugar (Bags)", Quantity: 10, Price: 22.50, Total: 225.00, Category: "Raw Material" },
                    { Item: "Eggs (Crates)", Quantity: 20, Price: 15.00, Total: 300.00, Category: "Perishable" },
                    { Item: "Butter (Blocks)", Quantity: 50, Price: 8.50, Total: 425.00, Category: "Perishable" },
                    { Item: "Yeast (Packets)", Quantity: 100, Price: 2.00, Total: 200.00, Category: "Additive" }
                ]
            });
        }, 2500);
    });
}
