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
    <div className="h-screen w-screen bg-terminal-bg text-terminal-primary font-mono degen-grid">
      <div className="p-6 pt-20">
        {/* Top Navigation Links */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-50">
          <div 
            onClick={() => window.location.href = '/'}
            className="degen-glass degen-hover px-6 py-3 rounded-full font-bold cursor-pointer"
          >
            <span className="text-white text-shadow-lg">🏠 HOME</span>
          </div>
          <div 
            onClick={() => window.location.href = '/terminal'}
            className="degen-glass degen-hover px-6 py-3 rounded-full font-bold cursor-pointer"
          >
            <span className="text-white text-shadow-lg">🔥 TERMINAL</span>
          </div>
          <div className="degen-glass px-6 py-3 rounded-full font-bold border-2 border-cyan-400">
            <span className="insane-glow text-white text-shadow-lg">📁 ARCHIVES</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 insane-glow text-shadow-lg">
            ZT_001 ARCHIVES
          </h1>
          <p className="text-cyan-200 text-sm font-bold text-shadow">Saved Conversations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] max-w-7xl mx-auto">
          
          {/* Topics List */}
          <div className="lg:col-span-1 space-y-4 overflow-hidden">
            
            {/* Live Topic Status */}
            <div className="degen-glass rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-3 h-3 bg-lime-400 rounded-full insane-glow animate-pulse"></div>
                <span className="text-sm font-bold text-white text-shadow">LIVE NOW</span>
              </div>
              <div className="text-white font-bold text-lg mb-2 text-shadow">
                {currentTopicInfo?.currentTopic || "Loading..."}
              </div>
              <div className="text-cyan-200 text-xs mb-3 text-shadow">
                Progress: {currentTopicInfo?.progress?.current || 0}/{currentTopicInfo?.progress?.max || 6}
              </div>
              <button 
                onClick={() => window.location.href = '/terminal'}
                className="degen-glass degen-hover px-4 py-2 rounded-full text-white font-bold text-xs text-shadow"
              >
                → WATCH LIVE
              </button>
            </div>

            {/* Archived Topics */}
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <h3 className="text-white font-bold text-sm text-center text-shadow flex-shrink-0">
                SAVED TOPICS ({processedTopics.length})
              </h3>
              
              <div className="space-y-2 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyan-400 scrollbar-track-transparent min-h-0">
                {processedTopics.map((topic, index) => (
                  <div
                    key={topic.filename}
                    onClick={() => handleTopicClick(topic.filename)}
                    className={`degen-glass degen-hover p-4 rounded-2xl cursor-pointer transition-all ${
                      selectedTopic === topic.filename 
                        ? 'ring-4 ring-cyan-400 ring-opacity-80 insane-glow' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-pink-400 rounded-full insane-glow"></div>
                      <span className="text-sm font-bold text-white text-shadow">{topic.displayName}</span>
                    </div>
                    <div className="text-xs text-cyan-200 ml-6 font-medium text-shadow">
                      {topic.filename}
                    </div>
                  </div>
                ))}
                
                {processedTopics.length === 0 && (
                  <div className="degen-glass text-white text-sm p-4 text-center rounded-xl">
                    <div className="text-2xl mb-2">📁</div>
                    <div className="font-bold text-sm text-shadow">No Archives</div>
                    <div className="text-xs mt-1 text-cyan-200 text-shadow">Check back later</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* EXTREME Content Viewer */}
          <div className="lg:col-span-2 overflow-hidden">
            <div className="degen-glass rounded-2xl h-full flex flex-col">
              {selectedTopic ? (
                <>
                  <div className="degen-glass border-b-2 border-cyan-400 p-3 text-center flex-shrink-0">
                    <h3 className="text-lg font-bold mb-1 text-white text-shadow">
                      {processedTopics.find(t => t.filename === selectedTopic)?.displayName}
                    </h3>
                    <p className="text-pink-200 text-xs text-shadow">{selectedTopic}</p>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-400 scrollbar-track-transparent min-h-0">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-white font-medium text-shadow">
                      {topicContent}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center degen-glass p-6 rounded-xl">
                    <div className="text-4xl mb-3">📄</div>
                    <p className="text-lg font-bold mb-2 text-white text-shadow">Select Topic</p>
                    <p className="text-xs text-cyan-200 text-shadow">Choose an archive to read</p>
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