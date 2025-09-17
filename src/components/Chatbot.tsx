import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Settings, AlertCircle, BarChart3, Heart } from 'lucide-react';
import geminiService, { ChatMessage, DashboardContext } from '../services/geminiService';
import logger from '../services/logger';

interface ChatbotProps {
  dashboardContext: DashboardContext;
}

const Chatbot: React.FC<ChatbotProps> = ({ dashboardContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsAvailable(geminiService.isAvailable());
    
    // Add welcome message when chatbot opens
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Hello! I'm your MedAlert AI assistant. I can help you navigate the ${dashboardContext.dashboardType} dashboard and understand your healthcare data. How can I assist you today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, dashboardContext.dashboardType, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !isAvailable) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      logger.apiCall('Gemini API', 'Sending message to chatbot', { 
        message: inputMessage, 
        dashboardType: dashboardContext.dashboardType 
      }, 'medium');

      const response = await geminiService.sendMessage(
        inputMessage.trim(), 
        dashboardContext, 
        messages
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      logger.apiResponse('Gemini API', 'Received chatbot response', { 
        responseLength: response.length 
      }, 'medium');

    } catch (error) {
      logger.error('Chatbot Error', 'Failed to get response from Gemini', error, 'high');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again or check your internet connection.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    logger.userAction('Chatbot', 'Cleared chat history', {}, 'low');
  };

  const handleComprehensiveAnalysis = async () => {
    if (isLoading || !isAvailable) return;

    setIsLoading(true);

    try {
      logger.apiCall('Gemini API', 'Requesting comprehensive health analysis', { 
        dashboardType: dashboardContext.dashboardType 
      }, 'high');

      const analysis = await geminiService.analyzeHealthData(dashboardContext);

      const analysisMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `## 📊 Comprehensive Health Analysis\n\n${analysis}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, analysisMessage]);
      
      logger.apiResponse('Gemini API', 'Received comprehensive health analysis', { 
        analysisLength: analysis.length 
      }, 'high');

    } catch (error) {
      logger.error('Chatbot Error', 'Failed to get health analysis from Gemini', error, 'high');
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while analyzing your health data. Please try again.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAvailable) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-red-100 border border-red-300 rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-red-700">AI Assistant Unavailable</span>
          </div>
          <p className="text-xs text-red-600 mt-1">
            Please configure your Gemini API key
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors duration-200 z-50"
        title="Open AI Assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 h-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">MedAlert AI</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleComprehensiveAnalysis}
                disabled={isLoading}
                className="text-blue-200 hover:text-white transition-colors disabled:opacity-50"
                title="Comprehensive Health Analysis"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={clearChat}
                className="text-blue-200 hover:text-white transition-colors"
                title="Clear Chat"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-blue-200 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    {message.role === 'user' && (
                      <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your dashboard..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors duration-200"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              <button
                onClick={() => setInputMessage("Analyze my medication adherence patterns")}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
              >
                📊 Adherence
              </button>
              <button
                onClick={() => setInputMessage("Review my medical history and diagnoses")}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
              >
                🏥 History
              </button>
              <button
                onClick={() => setInputMessage("Optimize my medication schedule")}
                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
              >
                ⏰ Schedule
              </button>
              <button
                onClick={() => setInputMessage("Analyze my health trends")}
                className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 transition-colors"
              >
                📈 Trends
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;