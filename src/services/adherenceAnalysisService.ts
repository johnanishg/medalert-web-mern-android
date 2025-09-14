import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface AdherenceRecord {
  timestamp: string;
  taken: boolean;
  notes?: string;
  recordedBy: string;
}

export interface MedicineAdherence {
  medicineIndex: number;
  name: string;
  dosage: string;
  frequency: string;
  timing: string[];
  adherence: AdherenceRecord[];
  lastTaken?: string;
  prescribedDate: string;
}

export interface AdherenceAnalysis {
  overallAdherenceRate: number;
  medicineInsights: MedicineInsight[];
  recommendations: string[];
  patterns: string[];
  riskFactors: string[];
  summary: string;
}

export interface MedicineInsight {
  medicineName: string;
  adherenceRate: number;
  missedDoses: number;
  totalDoses: number;
  patterns: string[];
  recommendations: string[];
}

export class AdherenceAnalysisService {
  private model: any;

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  async analyzeAdherence(patientName: string, adherenceData: MedicineAdherence[]): Promise<AdherenceAnalysis> {
    try {
      // First, validate that we have real data
      console.log('Adherence data received:', adherenceData);
      
      // Filter out medicines with no adherence data
      const medicinesWithData = adherenceData.filter(med => 
        med.adherence && med.adherence.length > 0
      );
      
      console.log('Medicines with adherence data:', medicinesWithData.length);
      
      // If no real adherence data, return default analysis
      if (medicinesWithData.length === 0) {
        console.log('No adherence data found, returning default analysis');
        return this.getDefaultAnalysis(adherenceData);
      }
      
      const prompt = this.createAnalysisPrompt(patientName, medicinesWithData);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const analysis = this.parseAnalysisResponse(text);
      
      // Validate that the analysis only contains data from the actual medicines
      const validatedAnalysis = this.validateAnalysis(analysis, medicinesWithData);
      
      return validatedAnalysis;
    } catch (error) {
      console.error('Error analyzing adherence:', error);
      return this.getDefaultAnalysis(adherenceData);
    }
  }

  private createAnalysisPrompt(patientName: string, adherenceData: MedicineAdherence[]): string {
    const currentDate = new Date().toISOString().split('T')[0];
    
    let prompt = `You are a medical AI assistant analyzing patient medication adherence. Please provide a comprehensive analysis in JSON format.

IMPORTANT: Only analyze the exact data provided below. Do not generate or invent any additional data, medicines, or adherence records that are not explicitly listed.

Patient: ${patientName}
Analysis Date: ${currentDate}

Medication Adherence Data:
`;

    adherenceData.forEach((medicine, index) => {
      prompt += `
Medicine ${index + 1}: ${medicine.name}
- Dosage: ${medicine.dosage}
- Frequency: ${medicine.frequency}
- Timing: ${medicine.timing.join(', ')}
- Prescribed: ${medicine.prescribedDate}
- Last Taken: ${medicine.lastTaken || 'Never'}

Adherence Records (${medicine.adherence.length} records):
`;

      medicine.adherence.forEach((record, recordIndex) => {
        const date = new Date(record.timestamp).toLocaleDateString();
        const time = new Date(record.timestamp).toLocaleTimeString();
        prompt += `  ${recordIndex + 1}. ${date} ${time} - ${record.taken ? 'TAKEN' : 'MISSED'}${record.notes ? ` (${record.notes})` : ''}\n`;
      });
    });

    prompt += `
Please analyze this data and provide a JSON response with the following structure:
{
  "overallAdherenceRate": number (0-100),
  "medicineInsights": [
    {
      "medicineName": string,
      "adherenceRate": number (0-100),
      "missedDoses": number,
      "totalDoses": number,
      "patterns": [string array of observed patterns],
      "recommendations": [string array of specific recommendations]
    }
  ],
  "recommendations": [string array of general recommendations],
  "patterns": [string array of overall patterns observed],
  "riskFactors": [string array of potential risk factors],
  "summary": string (brief 2-3 sentence summary)
}

Focus on:
1. Adherence patterns and trends
2. Time-based analysis (morning vs evening adherence)
3. Medicine-specific issues
4. Risk factors for non-adherence
5. Actionable recommendations for healthcare providers
6. Patient engagement strategies

CRITICAL: Only include medicines and data that are explicitly listed above. Do not add any medicines, adherence records, or data that is not provided in the input. If there is insufficient data for analysis, indicate this clearly in your response.

Be specific, medical-focused, and provide actionable insights based ONLY on the provided data.`;

    return prompt;
  }

  private parseAnalysisResponse(text: string): AdherenceAnalysis {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        return JSON.parse(jsonStr);
      }
    } catch (error) {
      console.error('Error parsing analysis response:', error);
    }

    // Fallback to default analysis
    return this.getDefaultAnalysis([]);
  }

  private validateAnalysis(analysis: AdherenceAnalysis, actualMedicines: MedicineAdherence[]): AdherenceAnalysis {
    // Filter medicine insights to only include actual medicines from database
    const validatedMedicineInsights = analysis.medicineInsights.filter(insight => 
      actualMedicines.some(med => med.name === insight.medicineName)
    );
    
    // Recalculate overall adherence rate based on actual data only
    const totalRecords = actualMedicines.reduce((sum, med) => sum + (med.adherence?.length || 0), 0);
    const takenRecords = actualMedicines.reduce((sum, med) => 
      sum + (med.adherence?.filter(record => record.taken).length || 0), 0
    );
    const overallRate = totalRecords > 0 ? Math.round((takenRecords / totalRecords) * 100) : 0;
    
    return {
      ...analysis,
      overallAdherenceRate: overallRate,
      medicineInsights: validatedMedicineInsights,
      summary: `Overall adherence rate is ${overallRate}%. ${totalRecords} medication events recorded across ${actualMedicines.length} medicines.`
    };
  }

  private getDefaultAnalysis(adherenceData: MedicineAdherence[]): AdherenceAnalysis {
    const totalRecords = adherenceData.reduce((sum, med) => sum + (med.adherence?.length || 0), 0);
    const takenRecords = adherenceData.reduce((sum, med) => 
      sum + (med.adherence?.filter(record => record.taken).length || 0), 0
    );
    const overallRate = totalRecords > 0 ? Math.round((takenRecords / totalRecords) * 100) : 0;

    return {
      overallAdherenceRate: overallRate,
      medicineInsights: adherenceData.map(med => {
        const taken = (med.adherence || []).filter(record => record.taken).length;
        const total = med.adherence?.length || 0;
        return {
          medicineName: med.name,
          adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 0,
          missedDoses: total - taken,
          totalDoses: total,
          patterns: total === 0 ? ['No adherence data available'] : ['Insufficient data for pattern analysis'],
          recommendations: total === 0 ? ['Start tracking adherence'] : ['Monitor adherence more closely', 'Consider patient education']
        };
      }),
      recommendations: [
        'Implement regular adherence monitoring',
        'Provide patient education on medication importance',
        'Consider reminder systems'
      ],
      patterns: ['Limited data available for pattern analysis'],
      riskFactors: overallRate < 60 ? ['Low adherence rate detected'] : [],
      summary: `Overall adherence rate is ${overallRate}%. ${totalRecords} medication events recorded across ${adherenceData.length} medicines.`
    };
  }

  // Helper method to calculate adherence rate for a specific medicine
  calculateMedicineAdherenceRate(adherence: AdherenceRecord[]): number {
    if (adherence.length === 0) return 0;
    const taken = adherence.filter(record => record.taken).length;
    return Math.round((taken / adherence.length) * 100);
  }

  // Helper method to get recent adherence (last 7 days)
  getRecentAdherence(adherence: AdherenceRecord[], days: number = 7): AdherenceRecord[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return adherence.filter(record => 
      new Date(record.timestamp) >= cutoffDate
    );
  }

  // Helper method to check if medicine is due
  isMedicineDue(medicine: MedicineAdherence): boolean {
    if (!medicine.timing || medicine.timing.length === 0) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Check if any scheduled time is within the next 30 minutes
    return medicine.timing.some(timeStr => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const scheduledTime = hours * 60 + minutes;
      const timeDiff = scheduledTime - currentTime;
      
      return timeDiff >= 0 && timeDiff <= 30; // Due within 30 minutes
    });
  }
}

export const adherenceAnalysisService = new AdherenceAnalysisService();
