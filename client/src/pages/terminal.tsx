import { useEffect, useState, useRef } from "react";
import { ConversationMessage } from "@shared/schema";

interface TerminalMessage extends ConversationMessage {
  isNew?: boolean;
}

export default function Terminal() {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

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
          setMessages(prev => [...prev, { ...data.data, isNew: true }]);
          
          // Show typing indicator for next message
          setTimeout(() => {
            setIsTyping(true);
          }, 7000); // Show typing 1 second before next message
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
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  return (
    <div className="terminal-container h-screen w-screen overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-terminal-black text-terminal-green font-mono text-base leading-relaxed" ref={terminalRef}>
      
      {/* Terminal Header */}
      <div className="terminal-line mb-4 animate-fade-in">
        <span className="text-terminal-dark-green">AI_CONVERSATION_STREAM v1.0.0</span>
      </div>
      
      <div className="terminal-line mb-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <span className="text-terminal-dark-green">Initializing neural pathways...</span>
      </div>
      
      <div className="terminal-line mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <span className="text-terminal-dark-green">Connection established. Stream active.</span>
      </div>
      
      {/* Conversation Container */}
      <div id="conversation-lines" className="space-y-3">
        {messages.map((message, index) => (
          <div 
            key={message.id} 
            className={`terminal-line flex flex-col md:flex-row ${message.isNew ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: message.isNew ? '0.1s' : '0s' }}
          >
            <span className="text-terminal-dark-green min-w-fit mr-2">
              [{formatTimestamp(message.timestamp)}]
            </span>
            <span className="terminal-glow">{message.entity}:</span>
            <span className="ml-2">{message.content}</span>
          </div>
        ))}
      </div>
      
      {/* Active typing indicator */}
      {isTyping && (
        <div className="terminal-line mt-6 flex items-center animate-fade-in">
          <span className="text-terminal-dark-green mr-2">
            [{formatTimestamp(new Date())}]
          </span>
          <span className="terminal-glow mr-2">
            {messages.length % 2 === 0 ? 'ENTITY_A' : 'ENTITY_B'}:
          </span>
          <span className="typing-cursor animate-blink">_</span>
        </div>
      )}
      
      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 text-xs text-terminal-dark-green opacity-60">
        <div>STREAM: {isConnected ? 'ACTIVE' : 'DISCONNECTED'}</div>
        <div>LATENCY: 0.23ms</div>
        <div>CONTEXT: {Math.min(messages.length, 10)}/10</div>
      </div>
    </div>
  );
}
