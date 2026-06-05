import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  Bot, 
  User, 
  Sparkles,
  Zap,
  ShieldCheck,
  BrainCircuit,
  Loader2,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAICoaching, getAIReflection, getAIWellnessSupport } from '../lib/ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'coaching' | 'reflection' | 'wellness' | 'general';
}

export const AIAssistantChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'assistant', 
      content: "Hello! I'm your Peer Support Coach. How can I help you prepare for a meeting or reflect on a recent interaction?",
      type: 'general'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (customConfig?: { action: string }) => {
    if (!input.trim() && !customConfig) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      let result;
      if (customConfig?.action === 'coach') {
        result = await getAICoaching(currentInput || "General support meeting");
      } else if (customConfig?.action === 'reflection') {
        result = await getAIReflection(currentInput);
      } else if (customConfig?.action === 'wellness') {
        result = await getAIWellnessSupport({ mood: 5, energy: 5, stress: 5, notes: currentInput });
      } else {
        // Default to coaching if not specified for MVP
        result = await getAICoaching(currentInput);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.text,
        type: (customConfig?.action as any) || 'coaching'
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden relative">
      {/* Absolute background element */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-indigo-500 to-teal-500" />
      
      {/* Chat Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center">
           <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mr-4 shadow-sm shadow-indigo-100">
             <Bot className="w-6 h-6" />
           </div>
           <div>
             <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Conversation Coach</h2>
             <div className="flex items-center mt-0.5">
               <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Assistance</span>
             </div>
           </div>
        </div>
        <div className="hidden md:flex space-x-2">
           <div className="px-3 py-1.5 bg-slate-50 rounded-xl flex items-center">
              <Zap className="w-3.5 h-3.5 text-amber-500 mr-2" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Motivational Interviewing</span>
           </div>
           <div className="px-3 py-1.5 bg-slate-50 rounded-xl flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mr-2" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trauma-Informed</span>
           </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-slate-50/30">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-2xl ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
               <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                 msg.role === 'user' ? 'bg-teal-600 text-white ml-3' : 'bg-white border border-slate-100 text-indigo-600 mr-3'
               }`}>
                 {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
               </div>
               <div className={`p-6 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                 msg.role === 'user' 
                   ? 'bg-teal-600 text-white shadow-teal-100' 
                   : 'bg-white text-slate-800 border border-slate-100'
               }`}>
                 {msg.content}
               </div>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
             <div className="flex items-center space-x-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm ml-12">
               <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gemini is reflecting...</span>
             </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-8 border-t border-slate-100 bg-white shadow-inner">
        <div className="flex flex-wrap gap-2 mb-4">
           <button 
            onClick={() => handleSend({ action: 'coach' })}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center border border-indigo-100"
           >
             <BrainCircuit className="w-3.5 h-3.5 mr-2" />
             Meeting Prep
           </button>
           <button 
            onClick={() => handleSend({ action: 'reflection' })}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center border border-emerald-100"
           >
             <Sparkles className="w-3.5 h-3.5 mr-2" />
             Reflect on Interaction
           </button>
           <button 
            onClick={() => handleSend({ action: 'wellness' })}
            className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center border border-rose-100"
           >
             <Heart className="w-3.5 h-3.5 mr-2" />
             Self-Care Support
           </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
             <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your scenario or question..." 
              className="w-full pl-6 pr-4 py-4 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all placeholder:text-slate-400 text-slate-800"
             />
          </div>
          <button 
             onClick={() => handleSend()}
             disabled={!input.trim()}
             className="w-14 h-14 bg-teal-600 text-white rounded-3xl flex items-center justify-center hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 disabled:opacity-50 group shrink-0"
          >
            <Send className="w-6 h-6 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-4 font-medium uppercase tracking-widest">
          AI generated content should be reviewed for accuracy and recovery-oriented alignment.
        </p>
      </div>
    </div>
  );
};
