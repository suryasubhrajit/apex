"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, Bot, Sparkles, AlertCircle, Play } from "lucide-react";
import { ReasoningStep, RefundDecision } from "@/lib/agent/tools";

interface VoiceAssistantProps {
  onSendMessage: (query: string) => Promise<void>;
  isLoading: boolean;
  latestAgentResponse?: string;
  latestDecision?: RefundDecision;
  latestReasoningSteps?: ReasoningStep[];
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onSendMessage,
  isLoading,
  latestAgentResponse,
  latestDecision,
  latestReasoningSteps
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setVoiceSupported(false);
      }
    }
  }, []);

  // Speak agent response using Speech Synthesis when latest response updates
  useEffect(() => {
    if (latestAgentResponse && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Stop prior speech
      const utterance = new SpeechSynthesisUtterance(latestAgentResponse);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [latestAgentResponse]);

  const toggleListening = () => {
    if (!voiceSupported) {
      alert("Web Speech Recognition API is not supported in your browser. Try Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Start speech error:", err);
      }
    }
  };

  const handleSendVoiceQuery = () => {
    if (!transcript.trim()) return;
    onSendMessage(transcript.trim());
  };

  const stopAudioPlayback = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto p-4 lg:p-6 justify-between gap-6">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 bg-slate-900/80 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Realtime Speech-to-Text & Text-to-Speech Voice Pipeline
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Interactive Voice Support Agent</h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Speak your refund request into your microphone. The agent will transcribe your voice in real time, evaluate your CRM history and policy rules, and respond back via natural speech playback.
        </p>
      </div>

      {/* Center Interactive Microphone Orb & Wave Animation */}
      <div className="flex-1 glass-panel rounded-3xl border border-slate-800 p-8 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glowing Orb Background */}
        <div
          className={`absolute w-72 h-72 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
            isListening
              ? "bg-purple-600/30 scale-125"
              : isSpeaking
              ? "bg-pink-600/30 scale-110"
              : "bg-indigo-600/10"
          }`}
        ></div>

        {/* Audio Wave Visualizer Simulation */}
        {(isListening || isSpeaking || isLoading) && (
          <div className="flex items-center gap-1.5 mb-8 h-12">
            {[40, 70, 30, 90, 50, 80, 45, 100, 60, 85, 35, 75].map((height, i) => (
              <span
                key={i}
                className={`w-1.5 rounded-full transition-all duration-300 ${
                  isSpeaking
                    ? "bg-pink-500 animate-pulse"
                    : isListening
                    ? "bg-purple-500 animate-bounce"
                    : "bg-indigo-500 animate-ping"
                }`}
                style={{
                  height: `${Math.max(15, (height * (isListening || isSpeaking ? 1 : 0.4)))}px`,
                  animationDelay: `${i * 0.08}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Microphone Action Button */}
        <button
          onClick={toggleListening}
          className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center gap-2 transition-all shadow-2xl ${
            isListening
              ? "bg-purple-600 text-white shadow-purple-500/50 scale-110 animate-pulse ring-8 ring-purple-500/30"
              : "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-indigo-600/40 hover:scale-105"
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-10 h-10" />
              <span className="text-[10px] font-bold tracking-wider uppercase">Listening...</span>
            </>
          ) : (
            <>
              <Mic className="w-10 h-10" />
              <span className="text-[10px] font-bold tracking-wider uppercase">Tap to Speak</span>
            </>
          )}
        </button>

        {/* Live Speech Transcription Box */}
        <div className="mt-8 w-full max-w-lg text-center z-10 space-y-3">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            {isListening ? "Live Transcription:" : "Transcript Ready:"}
          </p>
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 text-sm min-h-[4rem] flex items-center justify-center">
            {transcript ? (
              <span className="font-medium text-purple-300">"{transcript}"</span>
            ) : (
              <span className="text-slate-500 italic">
                {isListening ? "Listening to your voice..." : "Click microphone button and speak (e.g. 'I want a refund for ORD-1001')"}
              </span>
            )}
          </div>

          {transcript && !isListening && (
            <button
              onClick={handleSendVoiceQuery}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              Process Voice Query
            </button>
          )}
        </div>
      </div>

      {/* Latest Agent Voice Response Output Card */}
      {latestAgentResponse && (
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-slate-900/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-sm text-white">Agent Voice Output</h4>
                {isSpeaking && (
                  <span className="px-2 py-0.5 text-[10px] bg-pink-500/20 text-pink-400 rounded-full font-semibold flex items-center gap-1 animate-pulse">
                    <Volume2 className="w-3 h-3" />
                    Speaking...
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300">{latestAgentResponse}</p>
            </div>
          </div>

          {isSpeaking && (
            <button
              onClick={stopAudioPlayback}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 shrink-0"
            >
              <VolumeX className="w-4 h-4 text-slate-400" />
              Stop Voice
            </button>
          )}
        </div>
      )}
    </div>
  );
};
