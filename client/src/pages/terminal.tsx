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
          
          // Show typing indicator for next message after 4 seconds
          setTimeout(() => {
            setIsTyping(true);
          }, 4000);
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
    }, 100); // Type approximately 10 words per second
    
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
    <div className="terminal-container h-screen w-screen overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-terminal-black text-terminal-green font-mono text-base leading-relaxed" ref={terminalRef}>
      
      {/* Terminal Header */}
      <div className="terminal-line mb-4 animate-fade-in">
        <span className="text-terminal-dark-green">AI_CONVERSATION_STREAM v2.0.0</span>
      </div>
      
      <div className="terminal-line mb-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <span className="text-terminal-dark-green">Initializing neural pathways...</span>
      </div>
      
      <div className="terminal-line mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <span className="text-terminal-dark-green">Connection established. Deep conversation mode active.</span>
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
              <span className="text-terminal-dark-green min-w-fit mr-2">
                [{formatTimestamp(message.timestamp)}]
              </span>
              <span className="terminal-glow">{message.entity}:</span>
            </div>
            
            {/* Message Content with Typing Effect */}
            <div className="message-content ml-0 md:ml-4 pl-4 border-l-2 border-terminal-dark-green">
              <span className="whitespace-pre-wrap">
                {message.displayText || message.content}
              </span>
              {message.isTyping && (
                <span className="typing-cursor animate-blink ml-1">_</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Active typing indicator */}
      {isTyping && (
        <div className="terminal-line mt-8 flex items-center animate-fade-in">
          <span className="text-terminal-dark-green mr-2">
            [{formatTimestamp(new Date())}]
          </span>
          <span className="terminal-glow mr-2">
            {messages.length % 2 === 0 ? 'ENTITY_A' : 'ENTITY_B'}:
          </span>
          <span className="text-terminal-dark-green">preparing neural synthesis...</span>
          <span className="typing-cursor animate-blink ml-2">_</span>
        </div>
      )}
      
      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 text-xs text-terminal-dark-green opacity-60">
        <div>STREAM: {isConnected ? 'ACTIVE' : 'DISCONNECTED'}</div>
        <div>MODE: DEEP_CONVERSATION</div>
        <div>CONTEXT: {Math.min(messages.length, 10)}/10</div>
        <div>TYPING_SPEED: 10WPM</div>
      </div>
    </div>
  );
}
