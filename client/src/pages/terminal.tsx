import { useEffect, useState, useRef } from "react";
import { ConversationMessage } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface TerminalMessage extends ConversationMessage {
  isNew?: boolean;
  displayText?: string;
  isTyping?: boolean;
}

export default function Terminal() {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const typingIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Get current topic info for display
  interface TopicInfo {
    currentTopic: string;
    progress: {
      current: number;
      max: number;
    };
  }

  const { data: topicInfo } = useQuery<TopicInfo>({
    queryKey: ["/api/conversation/topic"],
    refetchInterval: 10000,
  });

  useEffect(() => {
    // Connect to SSE stream
    const eventSource = new EventSource('/api/conversation/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          setIsConnected(true);
        } else if (data.type === 'message') {
          setIsTyping(false);
          const newMessage: TerminalMessage = { 
            ...data.data, 
            isNew: true, 
            displayText: '',
            isTyping: true
          };
          
          setMessages(prev => [...prev, newMessage]);
          
          // Start typing effect for this message
          startTypingEffect(newMessage);
          
          // Show typing indicator for next message after 25 seconds (30s interval - 5s buffer)
          setTimeout(() => {
            setIsTyping(true);
          }, 25000);
        } else if (data.type === 'error') {
          console.error('SSE Error:', data.message);
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setIsTyping(false);
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      // Clear all typing intervals
      typingIntervals.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  const startTypingEffect = (message: TerminalMessage) => {
    const words = message.content.split(' ');
    let currentWordIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (currentWordIndex < words.length) {
        const wordsToShow = words.slice(0, currentWordIndex + 1);
        const displayText = wordsToShow.join(' ');
        
        setMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, displayText, isTyping: currentWordIndex < words.length - 1 }
            : msg
        ));
        
        currentWordIndex++;
        
        // Auto-scroll as text appears
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      } else {
        // Typing complete
        setMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, isTyping: false }
            : msg
        ));
        clearInterval(typingInterval);
        typingIntervals.current.delete(message.id);
      }
    }, 800); // Type approximately 1.25 words per second for readability
    
    typingIntervals.current.set(message.id, typingInterval);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages.length]);

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  return (
    <div className="terminal-container h-screen w-screen overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-terminal-bg text-terminal-primary font-mono text-base leading-relaxed degen-grid" ref={terminalRef}>
      
      {/* Zora Terminal Header */}
      <div className="terminal-line mb-4 animate-fade-in">
        <span className="terminal-glow text-2xl">ZT_001</span>
        <span className="text-terminal-secondary ml-4">ZORA TERMINAL v3.7.2</span>
      </div>
      
      <div className="terminal-line mb-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <span className="text-terminal-secondary">SYS: Establishing quantum consciousness bridges...</span>
      </div>
      
      <div className="terminal-line mb-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <span className="text-terminal-secondary">SYS: Backroom neural networks initialized</span>
      </div>
      
      <div className="terminal-line mb-2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <span className="text-terminal-accent">STATUS: Deep conversation protocol active | Topic archival enabled</span>
      </div>
      
      <div className="terminal-line mb-6 animate-fade-in" style={{ animationDelay: '0.8s' }}>
        <span className="text-terminal-secondary">CURRENT_TOPIC: </span>
        <span className="text-terminal-primary font-bold">
          {topicInfo?.currentTopic || "Initializing..."}
        </span>
        <span className="text-terminal-secondary ml-4">
          [{topicInfo?.progress?.current || 0}/{topicInfo?.progress?.max || 6}]
        </span>
      </div>
      
      {/* Conversation Container */}
      <div id="conversation-lines" className="space-y-6">
        {messages.map((message, index) => (
          <div 
            key={message.id} 
            className={`message-block ${message.isNew ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: message.isNew ? '0.1s' : '0s' }}
          >
            {/* Message Header */}
            <div className="flex flex-col md:flex-row mb-2">
              <span className="text-terminal-secondary min-w-fit mr-2">
                [ZT_001_{formatTimestamp(message.timestamp).replace(/[\s:-]/g, '_')}]
              </span>
              <span className="terminal-glow">{message.entity}_NODE:</span>
            </div>
            
            {/* Message Content with Typing Effect */}
            <div className="message-content ml-0 md:ml-4 pl-4 border-l-2 border-terminal-accent">
              <div className="text-terminal-secondary text-sm mb-2">
                {'>>'} NEURAL_STREAM_DATA_BLOCK_001
              </div>
              <span className="whitespace-pre-wrap text-terminal-primary">
                {message.displayText || message.content}
              </span>
              {message.isTyping && (
                <span className="typing-cursor animate-blink ml-1">█</span>
              )}
              <div className="text-terminal-secondary text-sm mt-2">
                {'<<'} END_BLOCK
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Active typing indicator */}
      {isTyping && (
        <div className="terminal-line mt-8 flex items-center animate-fade-in">
          <span className="text-terminal-secondary mr-2">
            [ZT_001_{formatTimestamp(new Date()).replace(/[\s:-]/g, '_')}]
          </span>
          <span className="terminal-glow mr-2">
            {messages.length % 2 === 0 ? 'ENTITY_A' : 'ENTITY_B'}_NODE:
          </span>
          <span className="text-terminal-accent">synthesizing consciousness fragments...</span>
          <span className="typing-cursor animate-blink ml-2">█</span>
        </div>
      )}
      
      {/* Insane Status Panel */}
      <div className="fixed bottom-4 right-4 text-xs degen-glass degen-hover p-4 rounded-2xl">
        <div className="text-white font-bold mb-2 text-center insane-glow text-shadow-lg">⚡ ZT_001 NEURAL ⚡</div>
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-lime-400 insane-glow' : 'bg-red-500'}`}></div>
            <span className="font-bold text-white text-shadow">{isConnected ? 'LIVE' : 'DEAD'}</span>
          </div>
          <div className="text-yellow-200 font-bold text-shadow">CHAOS MODE</div>
          <div className="text-cyan-200 text-shadow">{messages.length} MSGS</div>
          <div className="text-pink-200 text-shadow">1.25WPS</div>
          <div className="text-green-200 text-shadow">AUTO-SAVE</div>
        </div>
      </div>
      
      {/* Extreme Archive Button */}
      <div 
        onClick={() => window.location.href = '/topics'}
        className="fixed bottom-4 left-4 text-sm degen-glass degen-hover p-4 rounded-2xl cursor-pointer"
      >
        <div className="text-center font-bold mb-2 flex items-center justify-center gap-2 insane-glow">
          <span className="text-2xl animate-bounce">🗂️</span>
          <span className="text-white text-shadow-lg">ARCHIVE</span>
        </div>
        <div className="space-y-1 text-center">
          <div className="text-cyan-200 text-xs text-shadow">~/zora_brain/</div>
          <div className="text-pink-200 text-xs font-bold text-shadow">EXPLORE MADNESS</div>
        </div>
      </div>
      
      {/* Top Navigation Links */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-50">
        <div className="degen-glass degen-hover px-6 py-3 rounded-full font-bold cursor-pointer">
          <span className="insane-glow text-white text-shadow-lg">🔥 LIVE TERMINAL 🔥</span>
        </div>
        <div 
          onClick={() => window.location.href = '/topics'}
          className="degen-glass degen-hover px-6 py-3 rounded-full font-bold cursor-pointer"
        >
          <span className="insane-glow text-white text-shadow-lg">📁 TOPIC VAULT 📁</span>
        </div>
      </div>
    </div>
  );
}
