'use client'

import { useState } from 'react';
import { PDFUpload } from '@/components/ui/pdf-upload';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Users, AlertCircle, CheckCircle, XCircle, FileText, Search, Scale, Upload } from 'lucide-react';
import { summarizeText, TextSummaryResponse } from '@/lib/pdf-api';
import { createBackendUrl } from '@/lib/api-config';

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
  const [summary, setSummary] = useState<TextSummaryResponse | null>(null);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string>('');

  const handleTextExtracted = (
    text: string, 
    name: string, 
    meta?: { char_count: number; word_count: number; line_count: number },
    extractedSummary?: { summary: string; key_points: string[]; word_count: number }
  ) => {
    setExtractedText(text);
    setFilename(name);
    setMetadata(meta || null);
    setDebateResult(null);
    setDebateError('');
    setSummaryError('');
    setCurrentView('extracted');
    
    // Use extracted summary if available, otherwise generate one
    if (extractedSummary) {
      setSummary({
        success: true,
        summary: extractedSummary.summary,
        key_points: extractedSummary.key_points,
        word_count: extractedSummary.word_count
      });
      setIsSummarizing(false);
    } else {
      setSummary(null);
      // Automatically generate summary when text is extracted
      generateSummary(text, name);
    }
    
    console.log('PDF text extracted successfully:', {
      filename: name,
      metadata: meta,
      textLength: text.length,
      hasSummary: !!extractedSummary
    });
  };

  const handleExtractionError = (error: string, fileName?: string) => {
    // Use fallback filename if not provided or invalid
    const safeFileName = fileName && fileName !== 'unknown_file' ? fileName : 'Unknown File';
    
    setFilename(safeFileName);
    setExtractedText('');
    setMetadata(null);
    setSummary(null);
    setSummaryError('');
    setCurrentView('upload');
    console.error('PDF extraction failed:', error, 'for file:', safeFileName);
  };

  const generateSummary = async (text: string, filename: string) => {
    if (!text || text.trim().length === 0) return;
    
    setIsSummarizing(true);
    setSummaryError('');
    
    try {
      const summaryResult = await summarizeText(text, filename);
      setSummary(summaryResult);
    } catch (error) {
      console.error('Summarization failed:', error);
      setSummaryError(error instanceof Error ? error.message : 'Failed to generate summary');
    } finally {
      setIsSummarizing(false);
    }
  };

  const startDebate = async () => {
    if (!extractedText) return;
    
    setIsDebating(true);
    setDebateError('');
    setCurrentView('debate');
    
    try {
      // Create a temporary file object for the backend
      const textBlob = new Blob([extractedText], { type: 'text/plain' });
      const textFile = new File([textBlob], filename || 'extracted_text.txt', { 
        type: 'text/plain' 
      });
      
      const formData = new FormData();
      formData.append('file', textFile);
      
      console.log('Starting AI debate analysis...');
      
      const response = await fetch(createBackendUrl('/api/debate-json'), {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
      }
      
      const debateData = await response.json();
      
      if (debateData.error) {
        throw new Error(debateData.error);
      }
      
      // Transform backend response to match our interface
      const debateResult: DebateResult = {
        winner: debateData.metadata?.winner || "pro",
        final_decision: debateData.metadata?.final_decision || "PASS",
        final_score: debateData.metadata?.score || 75,
        winning_reasoning: debateData.metadata?.winning_reasoning || "Analysis completed successfully",
        debate_duration_seconds: debateData.metadata?.debate_duration || 10,
        total_rounds: debateData.metadata?.total_rounds || 3,
        debate_messages: debateData.messages?.map((msg: { role: string; content: string; point_number?: number; timestamp?: number }) => ({
          agent_role: msg.role === 'pro' ? 'pro' : 'critical',
          message: msg.content,
          round_number: msg.point_number || 1,
          timestamp: msg.timestamp || Date.now()
        })) || []
      };
      
      setDebateResult(debateResult);
      console.log('AI debate completed successfully:', debateResult);
      
    } catch (error) {
      console.error('Debate analysis failed:', error);
      setDebateError(error instanceof Error ? error.message : 'Failed to analyze document');
      
      // Fallback to sample data if backend fails
      console.log('Using fallback sample debate data...');
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
    } finally {
      setIsDebating(false);
    }
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

  const getTabIcon = (iconType: string) => {
    switch (iconType) {
      case 'upload':
        return <Upload className="w-4 h-4" />;
      case 'review':
        return <Search className="w-4 h-4" />;
      case 'debate':
        return <Scale className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            AI Research Paper Evaluator
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Upload a research paper and watch two AI agents debate its quality
          </p>
          <p className="text-sm text-muted-foreground">
            Powered by Gemini 2.5 Flash • Interactive Debate System
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-card rounded-lg p-2 shadow-sm border">
            <div className="flex space-x-2">
              {[
                { id: 'upload', label: 'Upload', iconType: 'upload' },
                { id: 'extracted', label: 'Review', iconType: 'review', disabled: !extractedText },
                { id: 'debate', label: 'Debate', iconType: 'debate', disabled: !extractedText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as 'upload' | 'extracted' | 'debate')}
                  disabled={tab.disabled}
                  className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                    currentView === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : tab.disabled
                      ? 'text-muted-foreground cursor-not-allowed'
                      : 'text-foreground hover:bg-muted/50'
                  }`}
                >
                  <span>{getTabIcon(tab.iconType)}</span>
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
              <div className="bg-card rounded-lg shadow-sm p-6 mb-8 border">
                <PDFUpload 
                  onTextExtracted={handleTextExtracted}
                  onError={handleExtractionError}
                  navigateOnSuccess={true}
                />
              </div>

              {/* Instructions */}
              <div className="bg-card rounded-lg shadow-sm p-6 border">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  How It Works
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold mb-2 text-foreground">Upload Paper</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload your research paper as a PDF file (max 16MB)
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <Scale className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold mb-2 text-foreground">AI Debate</h4>
                    <p className="text-sm text-muted-foreground">
                      Sample AI debate demonstrates research quality assessment
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🏆</span>
                    </div>
                    <h4 className="font-semibold mb-2 text-foreground">Get Decision</h4>
                    <p className="text-sm text-muted-foreground">
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
              <div className="bg-card rounded-lg shadow-sm p-6 mb-8 border">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-foreground">
                    Document Review
                  </h2>
                  <Button
                    onClick={startDebate}
                    size="lg"
                  >
                    Start AI Debate
                  </Button>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <h3 className="font-medium text-foreground">File</h3>
                    <p className="text-muted-foreground truncate">{filename}</p>
                  </div>
                  {metadata && (
                    <>
                      <div className="bg-muted/50 p-4 rounded-lg border">
                        <h3 className="font-medium text-foreground">Words</h3>
                        <p className="text-foreground text-xl font-bold">
                          {metadata.word_count.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg border">
                        <h3 className="font-medium text-foreground">Characters</h3>
                        <p className="text-foreground text-xl font-bold">
                          {metadata.char_count.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg border">
                        <h3 className="font-medium text-foreground">Pages</h3>
                        <p className="text-foreground text-xl font-bold">
                          {metadata.line_count}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Text Preview */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Document Preview
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-4 max-h-64 overflow-y-auto border">
                    <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {extractedText.substring(0, 1000)}
                      {extractedText.length > 1000 && '\n\n... (preview truncated)'}
                    </pre>
                  </div>
                </div>

                {/* AI Summary Section */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      AI Summary
                    </h3>
                    {!isSummarizing && !summary && (
                      <Button
                        onClick={() => generateSummary(extractedText, filename)}
                        variant="outline"
                        size="sm"
                      >
                        Generate Summary
                      </Button>
                    )}
                  </div>

                  {isSummarizing && (
                    <div className="bg-muted/30 rounded-lg p-4 flex items-center gap-3 border">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-muted-foreground">Generating AI summary...</span>
                    </div>
                  )}

                  {summaryError && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <p className="text-destructive text-sm">
                        {summaryError}
                      </p>
                    </div>
                  )}

                  {summary && (
                    <div className="bg-muted/20 rounded-lg p-4 border">
                      <div className="mb-3">
                        <span className="text-xs text-muted-foreground font-medium">
                          AI SUMMARY ({summary.word_count} words)
                        </span>
                      </div>
                      <p className="text-foreground mb-4 leading-relaxed">
                        {summary.summary}
                      </p>
                      
                      {summary.key_points && summary.key_points.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">
                            Key Points:
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {summary.key_points.map((point, index) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
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
                <div className="bg-card rounded-lg shadow-sm p-8 mb-8 text-center border">
                  <div className="flex justify-center mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    AI Debate in Progress...
                  </h3>
                  <p className="text-muted-foreground">
                    Two AI agents are analyzing your research paper
                  </p>
                </div>
              )}

              {debateError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-destructive mb-2">
                    Debate Failed
                  </h3>
                  <p className="text-destructive">
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
                  <div className="bg-card rounded-lg shadow-sm p-6 border">
                    <h3 className="text-xl font-semibold text-foreground mb-6">
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
                          <div className={`max-w-3xl p-4 rounded-lg border ${
                            message.agent_role === 'pro' 
                              ? 'bg-muted/30 border-l-4 border-l-green-500' 
                              : 'bg-muted/30 border-l-4 border-l-red-500'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`font-semibold ${
                                message.agent_role === 'pro' ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {message.agent_role === 'pro' ? '🟢 Pro Researcher' : '🔴 Critical Reviewer'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Round {message.round_number}
                              </span>
                            </div>
                            <p className="text-muted-foreground">
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
                        setSummary(null);
                        setSummaryError('');
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