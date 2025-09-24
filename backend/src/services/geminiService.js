import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

class GeminiService {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.isInitialized = false;
        this.initializeGemini();
    }

    initializeGemini() {
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey || apiKey === 'your-gemini-api-key-here') {
            console.warn('⚠️  Gemini API key not found. Chatbot will be disabled.');
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
            console.log('✅ Gemini AI initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Gemini AI:', error);
        }
    }

    async sendMessage(message, context, chatHistory = []) {
        if (!this.isInitialized || !this.model) {
            return {
                success: false,
                message: "I'm sorry, the AI assistant is currently unavailable. Please check the API configuration."
            };
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
            
            return {
                success: true,
                message: response.text()
            };
        } catch (error) {
            console.error('Error generating response:', error);
            return {
                success: false,
                message: "I'm sorry, I encountered an error while processing your request. Please try again."
            };
        }
    }

    async analyzeHealthData(context) {
        if (!this.isInitialized || !this.model) {
            return {
                success: false,
                message: "I'm sorry, the AI assistant is currently unavailable for health analysis."
            };
        }

        try {
            const analysisPrompt = this.createHealthAnalysisPrompt(context);
            const result = await this.model.generateContent(analysisPrompt);
            const response = await result.response;
            
            return {
                success: true,
                message: response.text()
            };
        } catch (error) {
            console.error('Error generating health analysis:', error);
            return {
                success: false,
                message: "I'm sorry, I encountered an error while analyzing your health data. Please try again."
            };
        }
    }

    createSystemPrompt(context) {
        const { dashboardType, userInfo, currentData, availableFeatures } = context;
        
        return `You are an AI assistant for MedAlert, a comprehensive medicine alert and healthcare management system.

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
    }

    formatDashboardData(dashboardType, data) {
        switch (dashboardType) {
            case 'patient':
                const medicines = data?.medicines || [];
                const visits = data?.visits || [];
                const diagnoses = data?.diagnoses || [];
                const adherenceData = data?.adherenceData || [];
                
                return `
COMPREHENSIVE PATIENT HEALTH OVERVIEW:

Current Medications (${medicines.length}):
${medicines.length > 0 ? medicines.map(med => `  - ${med.name} (${med.dosage}) - ${med.frequency}`).join('\n') : '  - No medications currently prescribed'}

Recent Medical Visits (${visits.length}):
${visits.length > 0 ? visits.slice(0, 5).map(visit => `  - ${new Date(visit.visitDate).toLocaleDateString()}: Dr. ${visit.doctorName}`).join('\n') : '  - No recent visits recorded'}

Diagnoses & Medical Conditions (${diagnoses.length}):
${diagnoses.length > 0 ? diagnoses.map(diag => `  - ${diag.condition || diag.diagnosis}`).join('\n') : '  - No diagnoses recorded'}

Medication Adherence:
${adherenceData.length > 0 ? 'Adherence data available' : '  - No adherence data available'}

Active Notifications: ${data?.notifications?.length || 0} medicine reminders
                `.trim();

            case 'doctor':
                return `
- Patient Search: ${data?.searchId ? `Searching for patient ID: ${data.searchId}` : 'No active search'}
- Selected Patient: ${data?.selectedPatient?.name || 'None selected'}
- Patient List: ${data?.patients?.length || 0} patients
                `.trim();

            case 'admin':
                return `
- Active Section: ${data?.activeSection || 'None'}
- Total Users: ${data?.users ? Object.values(data.users).flat().length : 0}
- Pending Approvals: ${data?.pendingApprovals?.length || 0}
                `.trim();

            default:
                return 'Dashboard data not available';
        }
    }

    createHealthAnalysisPrompt(context) {
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

    isAvailable() {
        return this.isInitialized;
    }
}

// Create singleton instance
const geminiService = new GeminiService();
export default geminiService;
