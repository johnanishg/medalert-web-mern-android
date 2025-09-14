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
  currentData: any;
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

You should help users with:
- Understanding their dashboard features
- Navigating the system
- Interpreting their data (medicines, appointments, notifications, etc.)
- Suggesting relevant actions they can take
- Explaining system functionality

Remember: You are a healthcare system assistant, not a medical professional.`;

    return prompt;
  }

  private formatDashboardData(dashboardType: string, data: any): string {
    switch (dashboardType) {
      case 'patient':
        return `
- Current Medicines: ${data?.medicines?.length || 0} medications
- Upcoming Visits: ${data?.visits?.length || 0} appointments
- Active Notifications: ${data?.notifications?.length || 0} medicine reminders
- Caretaker Approvals: ${data?.caretakerApprovals?.length || 0} pending approvals`;

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

  isAvailable(): boolean {
    return this.isInitialized;
  }
}

// Create singleton instance
const geminiService = new GeminiService();
export default geminiService;