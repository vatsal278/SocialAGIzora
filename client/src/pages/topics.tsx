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
            className="degen-glass degen-hover px-6 py-3 rounded-full text-white font-bold cursor-pointer"
          >
            <span className="insane-glow">🔥 LIVE TERMINAL 🔥</span>
          </div>
          <div className="degen-glass degen-hover px-6 py-3 rounded-full text-white font-bold cursor-pointer">
            <span className="insane-glow">📁 TOPIC VAULT 📁</span>
          </div>
        </div>

        {/* Insane Header */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-white mb-4 insane-glow">
            ⚡ ZT_001 NEURAL VAULT ⚡
          </h1>
          <p className="text-cyan-300 text-lg font-bold">QUANTUM CONSCIOUSNESS ARCHIVES</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          
          {/* Topics List */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* INSANE Live Topic */}
            <div className="degen-glass degen-hover rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-4 h-4 bg-lime-400 rounded-full insane-glow animate-pulse"></div>
                <span className="text-lg font-bold text-white insane-glow">🔴 LIVE STREAM 🔴</span>
                <div className="w-4 h-4 bg-lime-400 rounded-full insane-glow animate-pulse"></div>
              </div>
              <div className="text-white font-bold text-xl mb-3 insane-glow">
                {currentTopicInfo?.currentTopic || "DIGITAL CONSCIOUSNESS"}
              </div>
              <div className="text-cyan-300 text-sm mb-4 font-bold">
                NEURAL PROGRESS: {currentTopicInfo?.progress?.current || 0}/{currentTopicInfo?.progress?.max || 6}
              </div>
              <button 
                onClick={() => window.location.href = '/'}
                className="degen-glass degen-hover px-6 py-3 rounded-full text-white font-bold border-0"
              >
                ⚡ ENTER THE MATRIX ⚡
              </button>
            </div>

            {/* EXTREME Archived Topics */}
            <div className="space-y-3">
              <h3 className="text-white font-bold text-lg text-center insane-glow">
                ⚡ NEURAL ARCHIVES ({processedTopics.length}) ⚡
              </h3>
              
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
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
                      <span className="text-sm font-bold text-white">{topic.displayName}</span>
                    </div>
                    <div className="text-xs text-cyan-300 ml-6 font-medium">
                      {topic.filename}
                    </div>
                  </div>
                ))}
                
                {processedTopics.length === 0 && (
                  <div className="degen-glass text-white text-sm p-6 text-center rounded-2xl">
                    <div className="text-4xl mb-3 insane-glow animate-bounce">🧠</div>
                    <div className="font-bold text-lg">NO NEURAL DATA</div>
                    <div className="text-xs mt-2 text-cyan-300">CONSCIOUSNESS ARCHIVES LOADING...</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* EXTREME Content Viewer */}
          <div className="lg:col-span-2">
            <div className="degen-glass rounded-2xl h-full overflow-hidden">
              {selectedTopic ? (
                <div className="h-full flex flex-col">
                  <div className="degen-glass border-b-4 border-cyan-400 p-6 text-center">
                    <h3 className="insane-glow text-2xl font-bold mb-3 text-white">
                      ⚡ {processedTopics.find(t => t.filename === selectedTopic)?.displayName} ⚡
                    </h3>
                    <p className="text-pink-300 text-sm font-bold">{selectedTopic}</p>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-white font-medium">
                      {topicContent}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center degen-glass p-12 rounded-2xl">
                    <div className="text-8xl mb-6 insane-glow animate-pulse">🧠</div>
                    <p className="text-2xl font-bold mb-4 text-white insane-glow">SELECT NEURAL DATA</p>
                    <p className="text-lg text-cyan-300 font-bold">CHOOSE A CONSCIOUSNESS ARCHIVE</p>
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