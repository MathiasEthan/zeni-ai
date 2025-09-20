'use client'

import { useState } from 'react';
import { PDFUpload } from '@/components/ui/pdf-upload';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Users, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface DebateMessage {
  agent_role: string;
  message: string;
  round_number: number;
  timestamp: number;
}

interface DebateResult {
  winner: string;
  final_decision: string;
  final_score: number;
  winning_reasoning: string;
  debate_duration_seconds: number;
  total_rounds: number;
  debate_messages: DebateMessage[];
}

export default function ResearchDebateEvaluator() {
  const [extractedText, setExtractedText] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [metadata, setMetadata] = useState<{
    char_count: number;
    word_count: number;
    line_count: number;
  } | null>(null);
  const [isDebating, setIsDebating] = useState<boolean>(false);
  const [debateResult, setDebateResult] = useState<DebateResult | null>(null);
  const [debateError, setDebateError] = useState<string>('');
  const [currentView, setCurrentView] = useState<'upload' | 'extracted' | 'debate'>('upload');

  const handleTextExtracted = (
    text: string, 
    name: string, 
    meta?: { char_count: number; word_count: number; line_count: number }
  ) => {
    setExtractedText(text);
    setFilename(name);
    setMetadata(meta || null);
    setDebateResult(null);
    setDebateError('');
    setCurrentView('extracted');
    
    console.log('PDF text extracted successfully:', {
      filename: name,
      metadata: meta,
      textLength: text.length
    });
  };

  const handleExtractionError = (error: string, fileName: string) => {
    setFilename(fileName);
    setExtractedText('');
    setMetadata(null);
    setCurrentView('upload');
    console.error('PDF extraction failed:', error);
  };

  const startDebate = async () => {
    if (!extractedText) return;
    
    setIsDebating(true);
    setDebateError('');
    setCurrentView('debate');
    
    // Simulate debate processing with hardcoded sample response
    setTimeout(() => {
      const sampleDebateResult: DebateResult = {
        winner: "critical",
        final_decision: "FAIL",
        final_score: 42.5,
        winning_reasoning: "While the document contains some research elements, it lacks the methodological rigor, comprehensive literature review, and statistical analysis required for a peer-reviewed research paper.",
        debate_duration_seconds: 15.8,
        total_rounds: 3,
        debate_messages: [
          {
            agent_role: "pro",
            message: "This document demonstrates clear research methodology with systematic data collection and analysis. The structure follows academic conventions with proper sections for introduction, methodology, results, and conclusions.",
            round_number: 1,
            timestamp: Date.now() - 15000
          },
          {
            agent_role: "critical",
            message: "While the document has academic structure, the methodology section lacks detail about sample size, data validation, and control measures. The literature review is insufficient for establishing proper context.",
            round_number: 1,
            timestamp: Date.now() - 12000
          },
          {
            agent_role: "pro",
            message: "The results section presents quantitative findings with appropriate data visualization. The discussion clearly links findings to the research questions posed in the introduction.",
            round_number: 2,
            timestamp: Date.now() - 9000
          },
          {
            agent_role: "critical",
            message: "The statistical analysis is superficial and lacks significance testing. Key limitations are not adequately addressed, and the sample appears too small for meaningful generalization.",
            round_number: 2,
            timestamp: Date.now() - 6000
          },
          {
            agent_role: "pro",
            message: "The paper cites relevant literature and positions findings within the existing knowledge base. The conclusions are appropriately cautious and suggest future research directions.",
            round_number: 3,
            timestamp: Date.now() - 3000
          },
          {
            agent_role: "critical",
            message: "The citation quality is inconsistent, missing key recent publications in the field. The research design does not meet standards for reproducibility and lacks proper controls.",
            round_number: 3,
            timestamp: Date.now()
          }
        ]
      };
      
      setDebateResult(sampleDebateResult);
      setIsDebating(false);
    }, 3000); // 3 second delay to simulate processing
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'PASS':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'FAIL':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'PASS':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'FAIL':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Research Paper Evaluator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            Upload a research paper and watch two AI agents debate its quality
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by Gemini 2.5 Flash • Interactive Debate System
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg">
            <div className="flex space-x-2">
              {[
                { id: 'upload', label: 'Upload', icon: '📄' },
                { id: 'extracted', label: 'Review', icon: '🔍', disabled: !extractedText },
                { id: 'debate', label: 'Debate', icon: '⚖️', disabled: !extractedText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as 'upload' | 'extracted' | 'debate')}
                  disabled={tab.disabled}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    currentView === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : tab.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Upload View */}
          {currentView === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <PDFUpload 
                  onTextExtracted={handleTextExtracted}
                  onError={handleExtractionError}
                />
              </div>

              {/* Instructions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  How It Works
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📄</span>
                    </div>
                    <h4 className="font-semibold mb-2">Upload Paper</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Upload your research paper as a PDF file (max 16MB)
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">⚖️</span>
                    </div>
                    <h4 className="font-semibold mb-2">AI Debate</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Sample AI debate demonstrates research quality assessment
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🏆</span>
                    </div>
                    <h4 className="font-semibold mb-2">Get Decision</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Receive a sample pass/fail decision with detailed reasoning
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Extracted Text Review */}
          {currentView === 'extracted' && extractedText && (
            <motion.div
              key="extracted"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Document Review
                  </h2>
                  <Button
                    onClick={startDebate}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Start AI Debate
                  </Button>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100">File</h3>
                    <p className="text-blue-700 dark:text-blue-300 truncate">{filename}</p>
                  </div>
                  {metadata && (
                    <>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h3 className="font-medium text-green-900 dark:text-green-100">Words</h3>
                        <p className="text-green-700 dark:text-green-300 text-xl font-bold">
                          {metadata.word_count.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <h3 className="font-medium text-purple-900 dark:text-purple-100">Characters</h3>
                        <p className="text-purple-700 dark:text-purple-300 text-xl font-bold">
                          {metadata.char_count.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                        <h3 className="font-medium text-orange-900 dark:text-orange-100">Pages</h3>
                        <p className="text-orange-700 dark:text-orange-300 text-xl font-bold">
                          {metadata.line_count}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Text Preview */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Document Preview
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                      {extractedText.substring(0, 1000)}
                      {extractedText.length > 1000 && '\n\n... (preview truncated)'}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Debate View */}
          {currentView === 'debate' && (
            <motion.div
              key="debate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {isDebating && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    AI Debate in Progress...
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Two AI agents are analyzing your research paper
                  </p>
                </div>
              )}

              {debateError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                    Debate Failed
                  </h3>
                  <p className="text-red-700 dark:text-red-300">
                    {debateError}
                  </p>
                </div>
              )}

              {debateResult && (
                <div className="space-y-6">
                  {/* Final Result */}
                  <div className={`rounded-lg border-2 p-6 ${getDecisionColor(debateResult.final_decision)}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getDecisionIcon(debateResult.final_decision)}
                        <h2 className="text-2xl font-bold">
                          Research Paper: {debateResult.final_decision}
                        </h2>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {debateResult.final_score.toFixed(1)}/100
                        </div>
                        <div className="text-sm opacity-75">
                          Winner: {debateResult.winner.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm mb-4">
                      {debateResult.winning_reasoning}
                    </p>
                    <div className="flex items-center gap-4 text-sm opacity-75">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {debateResult.debate_duration_seconds.toFixed(1)}s
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {debateResult.total_rounds} rounds
                      </span>
                    </div>
                  </div>

                  {/* Debate Messages */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Debate Transcript
                    </h3>
                    <div className="space-y-4">
                      {debateResult.debate_messages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: message.agent_role === 'pro' ? -20 : 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex ${message.agent_role === 'pro' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div className={`max-w-3xl p-4 rounded-lg ${
                            message.agent_role === 'pro' 
                              ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500' 
                              : 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`font-semibold ${
                                message.agent_role === 'pro' ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {message.agent_role === 'pro' ? '🟢 Pro Researcher' : '🔴 Critical Reviewer'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Round {message.round_number}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">
                              {message.message}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => setCurrentView('extracted')}
                      variant="outline"
                    >
                      Review Document
                    </Button>
                    <Button
                      onClick={() => {
                        setCurrentView('upload');
                        setExtractedText('');
                        setDebateResult(null);
                      }}
                      variant="outline"
                    >
                      Evaluate New Paper
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}