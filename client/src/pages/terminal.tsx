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
        
        // Auto-scroll as text appears, but respect user scroll position
        if (terminalRef.current) {
          const container = terminalRef.current;
          const isAtBottom = container.scrollTop >= container.scrollHeight - container.clientHeight - 150;
          if (isAtBottom) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'smooth'
            });
          }
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
    if (terminalRef.current && messages.length > 0) {
      // Check if user is at bottom before auto-scrolling
      const container = terminalRef.current;
      const isAtBottom = container.scrollTop >= container.scrollHeight - container.clientHeight - 200;
      
      if (isAtBottom) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          if (terminalRef.current) {
            terminalRef.current.scrollTo({
              top: terminalRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 200);
      }
    }
  }, [messages.length]);

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  return (
    <div className="terminal-container h-screen w-screen overflow-y-auto overflow-x-hidden p-4 md:p-6 pt-20 pb-20 bg-terminal-bg text-terminal-primary font-mono text-base leading-relaxed degen-grid scrollbar-thin scrollbar-thumb-cyan-400 scrollbar-track-transparent" ref={terminalRef} style={{ scrollBehavior: 'smooth' }}>
      
      {/* Zora Terminal Header */}
      <div className="terminal-line mb-4 animate-fade-in font-meme-body">
        <span className="terminal-glow text-2xl font-meme-title">ZT_001</span>
        <span className="text-terminal-secondary ml-4 font-meme-pixel">ZORA TERMINAL v3.7.2</span>
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
      
      {/* Conversation Container - Fixed height and better scroll management */}
      <div id="conversation-lines" className="space-y-6 max-w-4xl mx-auto min-h-[calc(100vh-300px)]">
        {messages.length === 0 && (
          <div className="text-center py-12 sticky top-0">
            <div className="degen-glass degen-hover rounded-2xl p-8 mx-auto max-w-2xl">
              <div className="text-6xl mb-4 insane-glow animate-pulse">🧠</div>
              <div className="text-2xl font-bold text-white insane-glow text-shadow-lg mb-4">
                ⚡ NEURAL STREAM INITIALIZING ⚡
              </div>
              <div className="text-cyan-200 font-bold text-shadow mb-4">
                Quantum consciousness bridges establishing...
              </div>
              <div className="text-pink-200 text-shadow">
                Deep conversation protocol activating...
              </div>
            </div>
          </div>
        )}
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
      
      {/* Status Panel - Bottom Right */}
      <div className="fixed bottom-4 right-4 text-xs degen-glass p-2 rounded-lg z-30">
        <div className="text-white font-bold mb-1 text-center text-shadow text-xs">ZT_001</div>
        <div className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-lime-400 insane-glow' : 'bg-red-500'}`}></div>
            <span className="text-white text-shadow text-xs">{isConnected ? 'LIVE' : 'OFF'}</span>
          </div>
          <div className="text-cyan-200 text-shadow text-xs">{messages.length} MSGS</div>
        </div>
      </div>
      
      {/* Top Navigation Links */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-40">
        <div className="degen-glass px-4 py-2 rounded-full font-bold border-2 border-cyan-400 text-sm">
          <span className="insane-glow text-white text-shadow-lg">🔥 LIVE</span>
        </div>
        <div 
          onClick={() => window.location.href = '/'}
          className="degen-glass degen-hover px-4 py-2 rounded-full font-bold cursor-pointer text-sm"
        >
          <span className="text-white text-shadow-lg">🏠 HOME</span>
        </div>
        <div 
          onClick={() => window.location.href = '/topics'}
          className="degen-glass degen-hover px-4 py-2 rounded-full font-bold cursor-pointer text-sm"
        >
          <span className="text-white text-shadow-lg">📁 ARCHIVES</span>
        </div>
        <div 
          onClick={() => window.location.href = '/manifesto'}
          className="degen-glass degen-hover px-4 py-2 rounded-full font-bold cursor-pointer text-sm"
        >
          <span className="text-white text-shadow-lg">📜 MANIFESTO</span>
        </div>
      </div>
    </div>
  );
}
