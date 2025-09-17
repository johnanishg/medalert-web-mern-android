import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface DashboardContext {
  dashboardType: 'patient' | 'doctor' | 'admin' | 'caretaker' | 'manager' | 'employee';
  userInfo: any;
  currentData: {
    medicines?: any[];
    visits?: any[];
    notifications?: any[];
    caretakerApprovals?: any[];
    diagnoses?: any[];
    medicalHistory?: any[];
    adherenceData?: any[];
    prescriptions?: any[];
  };
  availableFeatures: string[];
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private isInitialized = false;

  constructor() {
    this.initializeGemini();
  }

  private initializeGemini() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      console.warn('Gemini API key not found. Chatbot will be disabled.');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
          }
        ]
      });
      this.isInitialized = true;
      console.log('Gemini AI initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
    }
  }

  async sendMessage(message: string, context: DashboardContext, chatHistory: ChatMessage[] = []): Promise<string> {
    if (!this.isInitialized || !this.model) {
      return "I'm sorry, the AI assistant is currently unavailable. Please check the API configuration.";
    }

    try {
      // Create context-aware system prompt
      const systemPrompt = this.createSystemPrompt(context);
      
      // Format chat history for Gemini
      const historyText = chatHistory
        .slice(-10) // Keep last 10 messages for context
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      const fullPrompt = `${systemPrompt}

Previous conversation:
${historyText}

Current user message: ${message}

Please provide a helpful response based on the MedAlert system context and the user's current dashboard.`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating response:', error);
      return "I'm sorry, I encountered an error while processing your request. Please try again.";
    }
  }

  private createSystemPrompt(context: DashboardContext): string {
    const { dashboardType, userInfo, currentData, availableFeatures } = context;
    
    let prompt = `You are an AI assistant for MedAlert, a comprehensive medicine alert and healthcare management system. 

You are currently helping a user in the ${dashboardType} dashboard. 

User Information:
- Name: ${userInfo?.name || 'Not provided'}
- Role: ${dashboardType}
- Email: ${userInfo?.email || 'Not provided'}

Available Features in this dashboard:
${availableFeatures.map(feature => `- ${feature}`).join('\n')}

Current Dashboard Data:
${this.formatDashboardData(dashboardType, currentData)}

IMPORTANT GUIDELINES:
1. Only provide information and assistance related to the MedAlert healthcare system
2. Do not provide medical advice or diagnoses - always recommend consulting healthcare professionals
3. Focus on helping users navigate the system features and understand their data
4. Be helpful, professional, and concise
5. If asked about topics unrelated to MedAlert or healthcare, politely redirect to relevant system features
6. Use the current dashboard context to provide relevant suggestions and information

ANALYSIS CAPABILITIES:
You can analyze and provide insights on:
- Medication patterns and adherence trends
- Visit history and medical timeline
- Diagnosis patterns and health progression
- Medication interactions and timing optimization
- Health trends and patterns over time
- Caretaker and notification management
- System usage and feature recommendations

You should help users with:
- Understanding their comprehensive health data
- Identifying patterns in their medical history
- Interpreting medication adherence and effectiveness
- Analyzing visit patterns and health trends
- Understanding diagnosis progression
- Optimizing medication schedules and notifications
- Navigating the system features effectively
- Suggesting relevant actions based on their data
- Explaining system functionality and benefits

Remember: You are a healthcare system assistant, not a medical professional. Always recommend consulting healthcare professionals for medical decisions.`;

    return prompt;
  }

  private formatDashboardData(dashboardType: string, data: any): string {
    switch (dashboardType) {
      case 'patient':
        const medicines = data?.medicines || [];
        const visits = data?.visits || [];
        const diagnoses = data?.diagnoses || [];
        const medicalHistory = data?.medicalHistory || [];
        const adherenceData = data?.adherenceData || [];
        
        let medicineDetails = '';
        if (medicines.length > 0) {
          medicineDetails = medicines.map((med: any) => 
            `  - ${med.name} (${med.dosage}) - ${med.frequency} - ${med.duration || 'As prescribed'}`
          ).join('\n');
        }

        let visitDetails = '';
        if (visits.length > 0) {
          visitDetails = visits.slice(0, 5).map((visit: any) => 
            `  - ${new Date(visit.visitDate).toLocaleDateString()}: Dr. ${visit.doctorName} - ${visit.diagnosis || 'No diagnosis recorded'}`
          ).join('\n');
        }

        let diagnosisDetails = '';
        if (diagnoses.length > 0) {
          diagnosisDetails = diagnoses.map((diag: any) => 
            `  - ${diag.condition || diag.diagnosis} (${diag.severity || 'Unknown severity'}) - ${diag.date ? new Date(diag.date).toLocaleDateString() : 'Date unknown'}`
          ).join('\n');
        }

        let adherenceDetails = '';
        if (adherenceData.length > 0) {
          const totalDoses = adherenceData.reduce((sum: number, med: any) => sum + (med.adherence?.length || 0), 0);
          const takenDoses = adherenceData.reduce((sum: number, med: any) => 
            sum + (med.adherence?.filter((ad: any) => ad.taken).length || 0), 0
          );
          const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
          adherenceDetails = `Overall adherence rate: ${adherenceRate}% (${takenDoses}/${totalDoses} doses taken)`;
        }

        return `
COMPREHENSIVE PATIENT HEALTH OVERVIEW:

Current Medications (${medicines.length}):
${medicineDetails || '  - No medications currently prescribed'}

Recent Medical Visits (${visits.length}):
${visitDetails || '  - No recent visits recorded'}

Diagnoses & Medical Conditions (${diagnoses.length}):
${diagnosisDetails || '  - No diagnoses recorded'}

Medical History:
${medicalHistory.length > 0 ? medicalHistory.map((h: any) => `  - ${h.description || h.condition} (${h.date ? new Date(h.date).toLocaleDateString() : 'Date unknown'})`).join('\n') : '  - No medical history recorded'}

Medication Adherence:
${adherenceDetails || '  - No adherence data available'}

Active Notifications: ${data?.notifications?.length || 0} medicine reminders
Caretaker Approvals: ${data?.caretakerApprovals?.length || 0} pending approvals`;

      case 'doctor':
        return `
- Patient Search: ${data?.searchId ? `Searching for patient ID: ${data.searchId}` : 'No active search'}
- Selected Patient: ${data?.selectedPatient?.name || 'None selected'}
- Patient List: ${data?.patients?.length || 0} patients`;

      case 'admin':
        return `
- Active Section: ${data?.activeSection || 'None'}
- Total Users: ${data?.users ? Object.values(data.users).flat().length : 0}
- Pending Approvals: ${data?.pendingApprovals?.length || 0}`;

      default:
        return 'Dashboard data not available';
    }
  }

  async analyzeHealthData(context: DashboardContext): Promise<string> {
    if (!this.isInitialized || !this.model) {
      return "I'm sorry, the AI assistant is currently unavailable for health analysis.";
    }

    try {
      const analysisPrompt = this.createHealthAnalysisPrompt(context);
      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating health analysis:', error);
      return "I'm sorry, I encountered an error while analyzing your health data. Please try again.";
    }
  }

  private createHealthAnalysisPrompt(context: DashboardContext): string {
    const { userInfo, currentData } = context;
    
    return `You are a healthcare data analysis AI for MedAlert. Analyze the following comprehensive patient data and provide insights:

PATIENT INFORMATION:
- Name: ${userInfo?.name || 'Not provided'}
- Age: ${userInfo?.age || 'Not provided'}
- Gender: ${userInfo?.gender || 'Not provided'}

COMPREHENSIVE HEALTH DATA:
${this.formatDashboardData('patient', currentData)}

ANALYSIS REQUEST:
Please provide a comprehensive health analysis including:

1. MEDICATION ANALYSIS:
   - Current medication overview and patterns
   - Potential interactions or timing issues
   - Adherence patterns and recommendations
   - Dosage and frequency optimization suggestions

2. HEALTH TREND ANALYSIS:
   - Visit frequency and patterns
   - Diagnosis progression over time
   - Health condition trends
   - Risk factors identification

3. MEDICAL HISTORY INSIGHTS:
   - Key health milestones
   - Treatment effectiveness patterns
   - Doctor visit patterns
   - Follow-up recommendations

4. ADHERENCE & COMPLIANCE:
   - Medication adherence rates
   - Missed dose patterns
   - Notification effectiveness
   - Improvement suggestions

5. HEALTH RECOMMENDATIONS:
   - Lifestyle suggestions based on data
   - Medication timing optimizations
   - Caretaker involvement recommendations
   - System feature utilization tips

IMPORTANT: 
- Do not provide medical diagnoses or treatment advice
- Always recommend consulting healthcare professionals
- Focus on data patterns and system optimization
- Be specific and actionable in recommendations
- Highlight any concerning patterns that need medical attention

Provide a structured, comprehensive analysis that helps the patient understand their health data and optimize their healthcare management.`;
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }
}

// Create singleton instance
const geminiService = new GeminiService();
export default geminiService;