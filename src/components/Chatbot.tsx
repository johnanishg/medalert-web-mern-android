import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Settings, AlertCircle, BarChart3, Heart, Volume2, VolumeX, Mic, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import geminiService, { ChatMessage, DashboardContext } from '../services/geminiService';
import logger from '../services/logger';
import { useTranslation } from '../contexts/TranslationContext';
import { translate as translateApi, SupportedLanguage } from '../services/translationService';

interface ChatbotProps {
  dashboardContext: DashboardContext;
}

const Chatbot: React.FC<ChatbotProps> = ({ dashboardContext }) => {
  const { language: appLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('chatbot_tts_enabled');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [selectedLang, setSelectedLang] = useState<string>(() => {
    try {
      return localStorage.getItem('chatbot_tts_lang') || 'auto';
    } catch {
      return 'auto';
    }
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  // Load available voices (may load asynchronously)
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    function updateVoices() {
      try {
        const voices = synth.getVoices();
        if (voices && voices.length) setAvailableVoices(voices);
      } catch {}
    }
    updateVoices();
    synth.addEventListener?.('voiceschanged', updateVoices);
    return () => {
      try { synth.removeEventListener?.('voiceschanged', updateVoices); } catch {}
    };
  }, []);

  // Speak latest assistant message when TTS is enabled
  useEffect(() => {
    if (!ttsEnabled) {
      try {
        window.speechSynthesis?.cancel();
      } catch {}
      return;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant' || !last.content) return;

    const speak = async () => {
      let text = stripMarkdown(last.content).trim();
      if (!text) return;

      // Determine target speech language
      const bcp47 = selectedLang === 'auto' ? mapSupportedToBcp47(appLanguage) : selectedLang;
      const targetSupported = selectedLang === 'auto' ? appLanguage : bcp47ToSupported(selectedLang);

      try {
        // If target language is not English, translate text before speaking
        if (targetSupported !== 'en') {
          try {
            const translated = await translateApi(text, targetSupported as SupportedLanguage, 'en');
            if (translated && typeof translated === 'string') text = translated;
          } catch {}
        }

        window.speechSynthesis.cancel();
        const chunks = splitIntoUtteranceChunks(text, 180);
        const voice = pickVoiceForLang(bcp47, availableVoices);
        chunks.forEach((chunk) => {
          const utter = new SpeechSynthesisUtterance(chunk);
          utter.rate = 1.0;
          utter.pitch = 1.0;
          utter.volume = 1.0;
          if (voice) {
            utter.voice = voice;
            utter.lang = voice.lang;
          } else if (bcp47) {
            utter.lang = bcp47;
          }
          window.speechSynthesis.speak(utter);
        });
      } catch (e) {
        // Best-effort speaking; ignore errors
      }
    };

    speak();
  }, [messages, ttsEnabled, selectedLang, availableVoices, appLanguage]);

  // Persist TTS setting
  useEffect(() => {
    try {
      localStorage.setItem('chatbot_tts_enabled', JSON.stringify(ttsEnabled));
    } catch {}
  }, [ttsEnabled]);

  // Persist selected language
  useEffect(() => {
    try {
      localStorage.setItem('chatbot_tts_lang', selectedLang);
    } catch {}
  }, [selectedLang]);

  function stripMarkdown(input: string): string {
    // Remove markdown formatting for better TTS
    return input
      .replace(/```[\s\S]*?```/g, '') // code blocks
      .replace(/`([^`]+)`/g, '$1') // inline code
      .replace(/^\s{0,3}(#+)\s+/gm, '') // headings
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
      .replace(/\*([^*]+)\*/g, '$1') // italics
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // links
      .replace(/>\s?/g, '') // blockquotes
      .replace(/[-*+]\s+/g, '') // list bullets
      .replace(/\s{2,}/g, ' ') // extra spaces
      .trim();
  }

  function splitIntoUtteranceChunks(text: string, maxLen: number): string[] {
    if (text.length <= maxLen) return [text];
    const sentences = text.match(/[^.!?\n]+[.!?\n]?/g) || [text];
    const chunks: string[] = [];
    let current = '';
    for (const s of sentences) {
      if ((current + s).trim().length > maxLen) {
        if (current) chunks.push(current.trim());
        if (s.length > maxLen) {
          // Fallback: hard split long sentence
          for (let i = 0; i < s.length; i += maxLen) {
            chunks.push(s.slice(i, i + maxLen).trim());
          }
          current = '';
        } else {
          current = s;
        }
      } else {
        current += s;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  function pickVoiceForLang(lang: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (lang === 'auto') return null;
    const lower = lang.toLowerCase();
    // Exact match
    let v = voices.find(v => v.lang && v.lang.toLowerCase() === lower);
    if (v) return v;
    // Prefix match e.g., kn vs kn-IN
    const prefix = lower.split('-')[0];
    v = voices.find(v2 => v2.lang && v2.lang.toLowerCase().startsWith(prefix));
    if (v) return v;
    // Name-based hint
    if (prefix === 'kn') {
      v = voices.find(v3 => /kannada/i.test(v3.name));
    } else if (prefix === 'hi') {
      v = voices.find(v3 => /hindi|india/i.test(v3.name));
    }
    return v || null;
  }

  function mapSupportedToBcp47(lang: SupportedLanguage): string {
    switch (lang) {
      case 'hi': return 'hi-IN';
      case 'kn': return 'kn-IN';
      default: return 'en-US';
    }
  }

  function bcp47ToSupported(code: string): SupportedLanguage {
    const lower = code.toLowerCase();
    if (lower.startsWith('hi')) return 'hi';
    if (lower.startsWith('kn')) return 'kn';
    return 'en';
  }

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
      // Local medicine information quick-answer
      const quickAnswer = getMedicineQuickAnswer(inputMessage.trim(), dashboardContext);
      if (quickAnswer) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: quickAnswer,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

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

  function getMedicineQuickAnswer(query: string, context: DashboardContext): string | null {
    try {
      const meds = (context?.currentData?.medicines || []) as any[];
      if (!meds?.length) return null;
      const q = query.toLowerCase();
      // Basic intent detection
      const intent = /(medicine|medication|drug|tablet|capsule|dose|dosage|when|how|what|info|information|details|schedule|timing)/i.test(query);
      if (!intent) return null;

      // Try exact and fuzzy name match
      const byScore = meds
        .map(m => ({ m, name: String(m?.name || '').trim(),
          score: similarity(q, String(m?.name || '').toLowerCase()) }))
        .sort((a,b) => b.score - a.score);
      const best = byScore[0];
      if (!best || !best.name || best.score < 0.3) return null;

      const med = best.m;
      const timing: string[] = Array.isArray(med?.timing) ? med.timing : [];
      const scheduled: any[] = Array.isArray(med?.scheduledDoses) ? med.scheduledDoses : [];

      const lines: string[] = [];
      lines.push(`### Medicine information: ${med.name}`);
      if (med.dosage) lines.push(`- Dosage: ${med.dosage}`);
      if (med.frequency) lines.push(`- Frequency: ${med.frequency}`);
      if (timing.length) lines.push(`- Timing: ${timing.join(', ')}`);
      if (med.foodTiming) lines.push(`- With food: ${med.foodTiming}`);
      if (med.instructions) lines.push(`- Instructions: ${med.instructions}`);
      if (med.startDate) lines.push(`- Start date: ${med.startDate}`);
      if (med.endDate) lines.push(`- End date: ${med.endDate}`);
      if (med.prescribedBy) lines.push(`- Prescribed by: ${med.prescribedBy}`);
      if (scheduled.length) {
        const items = scheduled
          .filter(s => s?.isActive)
          .map(s => `  - ${s.label || 'Dose'} at ${s.time}${s.dosage ? ` (${s.dosage})` : ''}`);
        if (items.length) {
          lines.push(`- Active scheduled doses:\n${items.join('\n')}`);
        }
      }
      return lines.join('\n');
    } catch {
      return null;
    }
  }

  function similarity(a: string, b: string): number {
    if (!a || !b) return 0;
    // Simple token overlap similarity
    const ta = new Set(a.split(/[^a-z0-9]+/i).filter(Boolean));
    const tb = new Set(b.split(/[^a-z0-9]+/i).filter(Boolean));
    if (!ta.size || !tb.size) return 0;
    let inter = 0;
    ta.forEach(t => { if (tb.has(t)) inter++; });
    return inter / Math.max(ta.size, tb.size);
  }

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

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const form = new FormData();
          form.append('audio', blob, 'audio.webm');
          form.append('languageCode', mapSupportedToBcp47(appLanguage));
          
          console.log('Sending audio to STT endpoint...', { 
            blobSize: blob.size, 
            languageCode: mapSupportedToBcp47(appLanguage) 
          });
          
          const res = await fetch('http://localhost:5000/api/speech/transcribe', {
            method: 'POST',
            body: form
          });
          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          
          const json = await res.json();
          console.log('STT response:', json);
          
          if (json && json.success && json.transcription) {
            setInputMessage((prev) => (prev ? prev + ' ' : '') + json.transcription);
            logger.apiResponse('STT', 'Transcription successful', { transcription: json.transcription }, 'medium');
          } else {
            logger.error('STT', 'Transcription failed', json, 'medium');
          }
        } catch (e) {
          console.error('STT error:', e);
          logger.error('STT', 'Error posting audio', e, 'medium');
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      logger.error('STT', 'Microphone access denied or unavailable', e, 'medium');
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    try {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    } catch {}
    setIsRecording(false);
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
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-blue-600 text-blue-100 text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none hover:text-white"
                title="TTS language"
              >
                <option value="auto">Auto</option>
                <option value="en-US">English</option>
                <option value="kn-IN">ಕನ್ನಡ</option>
                <option value="hi-IN">हिंदी</option>
              </select>
              <button
                onClick={() => setTtsEnabled((v) => !v)}
                className="text-blue-200 hover:text-white transition-colors"
                title={ttsEnabled ? 'Mute voice' : 'Enable voice'}
              >
                {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
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
                      <div className="text-sm prose prose-sm max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            code: ({ children, className }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                              ) : (
                                <code className={`block bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto ${className}`}>{children}</code>
                              );
                            },
                            pre: ({ children }) => <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">{children}</pre>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-3 italic mb-2">{children}</blockquote>,
                            table: ({ children }) => <table className="border-collapse border border-gray-300 text-xs mb-2">{children}</table>,
                            th: ({ children }) => <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold">{children}</th>,
                            td: ({ children }) => <td className="border border-gray-300 px-2 py-1">{children}</td>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
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
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-lg transition-colors duration-200 ${isRecording ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                title={isRecording ? 'Stop recording' : 'Speak'}
                disabled={isLoading}
              >
                {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
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