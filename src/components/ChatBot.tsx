import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Image as ImageIcon, Clock } from "lucide-react";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface Message {
  role: "user" | "bot";
  text: string;
  timestamp: string;
  imageUrl?: string;
}

const SUGGESTIONS = [
  "Recommend a Sci-Fi movie",
  "What's the highest rated?",
  "Generate a space movie poster",
  "Tell me about Inception",
];

export default function ChatBot({ movies }: { movies: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "bot", 
      text: "Hey there! I'm your CineMatch AI assistant. Looking for a movie recommendation or have questions about our catalog?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  const generateImage = async (prompt: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ parts: [{ text: `A cinematic movie poster for: ${prompt}. High quality, 4k, professional design.` }] }],
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    } catch (error) {
      console.error("Image Gen Error:", error);
    }
    return null;
  };

  const handleSend = async (textOverride?: string) => {
    const userMessage = (textOverride || input).trim();
    if (!userMessage || isLoading) return;

    if (!textOverride) setInput("");
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: "user", text: userMessage, timestamp }]);
    setIsLoading(true);

    try {
      // Check if user wants an image
      const wantsImage = userMessage.toLowerCase().includes("poster") || 
                         userMessage.toLowerCase().includes("image") || 
                         userMessage.toLowerCase().includes("generate");

      let botImageUrl: string | undefined;
      if (wantsImage) {
        botImageUrl = await generateImage(userMessage) || undefined;
      }

      const movieContext = movies.map(m => `${m.title} (${m.genres})`).join(", ");
      const systemInstruction = `You are a movie expert assistant for CineMatch AI. 
      Our current catalog includes: ${movieContext}. 
      Recommend movies from our catalog if they fit the user's request. 
      If they ask for something else, suggest the closest match from our list or talk about movies in general but always try to bring it back to CineMatch. 
      Keep responses concise and cinematic. Use emojis occasionally.
      ${wantsImage ? "The user requested a poster, which has been generated. Acknowledge the poster in your response." : ""}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: userMessage }] }],
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const botText = response.text || (wantsImage ? "Here is the poster you requested!" : "I'm sorry, I couldn't process that. Try asking about a specific genre!");
      
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: botText, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        imageUrl: botImageUrl
      }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: "Oops! My cinematic brain hit a glitch. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-96 h-[600px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-red-600 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bot className="w-6 h-6 text-white" />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-red-600 rounded-full" />
                </div>
                <div>
                  <span className="font-bold text-white uppercase tracking-wider text-xs block">CineMatch AI</span>
                  <span className="text-[10px] text-white/70 uppercase font-medium">Online • Expert Assistant</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide bg-gradient-to-b from-black/20 to-transparent">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border border-white/10 ${
                      msg.role === "user" ? "bg-zinc-800" : "bg-red-600/20"
                    }`}>
                      {msg.role === "user" ? <User className="w-4 h-4 text-gray-400" /> : <Bot className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="space-y-2">
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === "user" 
                          ? "bg-red-600 text-white rounded-tr-none" 
                          : "bg-white/5 text-gray-200 border border-white/10 rounded-tl-none"
                      }`}>
                        {msg.text}
                        {msg.imageUrl && (
                          <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                            <img src={msg.imageUrl} alt="Generated Poster" className="w-full h-auto" />
                          </div>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 text-[10px] text-gray-500 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <Clock className="w-3 h-3" />
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-600/20 border border-white/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/10 flex gap-1 items-center">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions & Input */}
            <div className="p-4 border-t border-white/10 bg-black/40 space-y-4">
              {/* Suggestions */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="flex-none px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-400 hover:bg-red-600/20 hover:text-red-400 hover:border-red-600/30 transition-all whitespace-nowrap flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    {s}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask for a recommendation or poster..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-5 pr-12 text-sm focus:outline-none focus:border-red-600 transition-all placeholder:text-gray-600"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:text-red-400 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-red-600 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.6)] flex items-center justify-center text-white hover:bg-red-700 transition-all group relative"
      >
        <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20 group-hover:opacity-40" />
        {isOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
      </motion.button>
    </div>
  );
}
