import { useEffect, useState, useRef } from "react";
import { ConversationMessage } from "@shared/schema";

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
    <div className="terminal-container h-screen w-screen overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-terminal-bg text-terminal-primary font-mono text-base leading-relaxed backroom-grid" ref={terminalRef}>
      
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
      
      <div className="terminal-line mb-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <span className="text-terminal-accent">STATUS: Deep conversation protocol active | Topic archival enabled</span>
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
      
      {/* Backroom-style Status Panel */}
      <div className="fixed bottom-4 right-4 text-xs text-terminal-secondary opacity-80 bg-white bg-opacity-10 backdrop-blur-sm p-3 rounded border border-terminal-secondary">
        <div className="text-terminal-primary font-bold mb-1">ZT_001 STATUS</div>
        <div>LINK: {isConnected ? 'ESTABLISHED' : 'SEVERED'}</div>
        <div>MODE: BACKROOM_DEEP_CONV</div>
        <div>MSGS: {messages.length}</div>
        <div>RATE: 1.25WPS</div>
        <div>ARCH: AUTO_ENABLED</div>
      </div>
      
      {/* Topic Directory Indicator */}
      <div className="fixed bottom-4 left-4 text-xs text-terminal-secondary opacity-80 bg-white bg-opacity-10 backdrop-blur-sm p-3 rounded border border-terminal-secondary">
        <div className="text-terminal-accent font-bold mb-1">DIRECTORY</div>
        <div>~/zora_topics/</div>
        <div>zt_001_*.txt</div>
        <div className="text-terminal-primary">Auto-archiving active</div>
      </div>
    </div>
  );
}
