import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface TopicFile {
  filename: string;
  displayName: string;
  timestamp: string;
}

interface TopicContent {
  content: string;
}

interface TopicInfo {
  currentTopic: string;
  progress: {
    current: number;
    max: number;
  };
}

export default function Topics() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicContent, setTopicContent] = useState<string>("");

  const { data: topicFiles = [], refetch } = useQuery<string[]>({
    queryKey: ["/api/topics"],
  });

  const { data: currentTopicInfo } = useQuery<TopicInfo>({
    queryKey: ["/api/conversation/topic"],
    refetchInterval: 10000,
  });

  const processedTopics: TopicFile[] = topicFiles.map(filename => {
    const parts = filename.replace('zt_001_', '').replace('.txt', '');
    const lastUnderscoreIndex = parts.lastIndexOf('_');
    const displayName = parts.substring(0, lastUnderscoreIndex).replace(/_/g, ' ');
    const timestamp = parts.substring(lastUnderscoreIndex + 1);
    
    return {
      filename,
      displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      timestamp
    };
  });

  const handleTopicClick = async (filename: string) => {
    try {
      const response = await fetch(`/api/topics/${filename}`);
      const data: TopicContent = await response.json();
      setTopicContent(data.content);
      setSelectedTopic(filename);
    } catch (error) {
      console.error('Failed to load topic:', error);
    }
  };

  return (
    <div className="h-screen w-screen bg-terminal-bg text-terminal-primary font-mono animated-grid">
      <div className="p-6">
        {/* Header with Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl terminal-glow">ZT_001 TOPIC ARCHIVE</h1>
            <p className="text-terminal-secondary mt-2">Quantum consciousness conversation archives</p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="glassmorphism glassmorphism-hover px-4 py-2 rounded-xl text-sm font-medium text-terminal-primary"
          >
            ← Back to Terminal
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          
          {/* Topics List */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Current Live Topic */}
            <div className="glassmorphism glassmorphism-hover rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-terminal-accent rounded-full pulse-glow"></div>
                <span className="text-sm terminal-glow font-semibold">LIVE CONVERSATION</span>
              </div>
              <div className="text-terminal-primary font-bold text-lg mb-2">
                {currentTopicInfo?.currentTopic || "Digital Consciousness"}
              </div>
              <div className="text-terminal-secondary text-sm mb-4">
                Progress: {currentTopicInfo?.progress?.current || 0}/{currentTopicInfo?.progress?.max || 6} messages
              </div>
              <button 
                onClick={() => window.location.href = '/'}
                className="glassmorphism glassmorphism-hover px-4 py-2 rounded-lg text-sm font-medium text-terminal-primary border-0"
              >
                🔗 View Live Stream
              </button>
            </div>

            {/* Archived Topics */}
            <div className="space-y-2">
              <h3 className="text-terminal-accent font-bold text-sm uppercase tracking-wider">
                Archived Topics ({processedTopics.length})
              </h3>
              
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {processedTopics.map((topic, index) => (
                  <div
                    key={topic.filename}
                    onClick={() => handleTopicClick(topic.filename)}
                    className={`glassmorphism glassmorphism-hover p-4 rounded-xl cursor-pointer transition-all ${
                      selectedTopic === topic.filename 
                        ? 'border-terminal-accent ring-2 ring-terminal-accent ring-opacity-50' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-terminal-accent rounded-full opacity-70"></div>
                      <span className="text-sm font-semibold text-terminal-primary">{topic.displayName}</span>
                    </div>
                    <div className="text-xs text-terminal-secondary ml-6 opacity-80">
                      {topic.filename}
                    </div>
                  </div>
                ))}
                
                {processedTopics.length === 0 && (
                  <div className="glassmorphism text-terminal-secondary text-sm p-6 text-center rounded-xl">
                    <div className="text-2xl mb-2">📂</div>
                    <div>No archived topics yet</div>
                    <div className="text-xs mt-1 opacity-70">Topics appear here after completion</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Viewer */}
          <div className="lg:col-span-2">
            <div className="glassmorphism rounded-xl h-full overflow-hidden">
              {selectedTopic ? (
                <div className="h-full flex flex-col">
                  <div className="glassmorphism border-b border-white border-opacity-20 p-6">
                    <h3 className="terminal-glow text-lg font-bold mb-2">
                      {processedTopics.find(t => t.filename === selectedTopic)?.displayName}
                    </h3>
                    <p className="text-terminal-secondary text-sm opacity-80">{selectedTopic}</p>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-terminal-primary">
                      {topicContent}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-terminal-secondary">
                  <div className="text-center glassmorphism p-8 rounded-xl">
                    <div className="text-6xl mb-4 opacity-50">📁</div>
                    <p className="text-lg font-medium mb-2">Select a Topic</p>
                    <p className="text-sm opacity-70">Choose a conversation archive to view</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}