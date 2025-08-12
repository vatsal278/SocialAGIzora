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
    <div className="h-screen w-screen bg-terminal-bg text-terminal-primary font-mono">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl terminal-glow">ZT_001 TOPIC ARCHIVE</h1>
          <p className="text-terminal-secondary mt-2">Quantum consciousness conversation archives</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          
          {/* Topics List */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Current Live Topic */}
            <div className="border border-terminal-accent rounded-lg p-4 bg-gradient-to-br from-purple-50 to-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-terminal-accent rounded-full animate-pulse"></div>
                <span className="text-sm terminal-glow">LIVE CONVERSATION</span>
              </div>
              <div className="text-terminal-primary font-bold">
                {currentTopicInfo?.currentTopic || "Digital Consciousness"}
              </div>
              <div className="text-terminal-secondary text-sm mt-1">
                Progress: {currentTopicInfo?.progress?.current || 0}/{currentTopicInfo?.progress?.max || 6} messages
              </div>
              <button 
                onClick={() => window.location.href = '/'}
                className="mt-3 px-3 py-1 bg-terminal-accent text-white rounded text-sm hover:bg-terminal-primary transition-colors"
              >
                View Live Stream
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
                    className={`p-3 rounded border cursor-pointer transition-all hover:border-terminal-accent hover:bg-purple-50 ${
                      selectedTopic === topic.filename 
                        ? 'border-terminal-accent bg-purple-50' 
                        : 'border-terminal-secondary bg-white bg-opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-terminal-secondary rounded-full"></div>
                      <span className="text-sm font-medium">{topic.displayName}</span>
                    </div>
                    <div className="text-xs text-terminal-secondary mt-1 ml-4">
                      {topic.filename}
                    </div>
                  </div>
                ))}
                
                {processedTopics.length === 0 && (
                  <div className="text-terminal-secondary text-sm p-4 text-center border border-dashed border-terminal-secondary rounded">
                    No archived topics yet. Topics will appear here after 6 messages.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Viewer */}
          <div className="lg:col-span-2">
            <div className="border border-terminal-secondary rounded-lg h-full">
              {selectedTopic ? (
                <div className="h-full flex flex-col">
                  <div className="border-b border-terminal-secondary p-4 bg-purple-50">
                    <h3 className="terminal-glow">
                      {processedTopics.find(t => t.filename === selectedTopic)?.displayName}
                    </h3>
                    <p className="text-terminal-secondary text-sm">{selectedTopic}</p>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-terminal-primary">
                      {topicContent}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-terminal-secondary">
                  <div className="text-center">
                    <div className="w-16 h-16 border-2 border-terminal-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📁</span>
                    </div>
                    <p>Select a topic to view its conversation archive</p>
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