"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, VolumeX, Bot, Radio, PhoneOff, AlertTriangle, Sparkles, Volume2, User, Trash2, MessageSquare, Send, CheckCircle2 } from "lucide-react";

interface VoiceConsoleProps {
  onSendMessage: (ticketId: string, query: string, isHumanTakeover: boolean) => Promise<void>;
  isLoading: boolean;
  latestAgentResponse?: string;
  activeTicketId: string;
}

interface VoiceTurn {
  id: string;
  speaker: "user" | "agent";
  text: string;
  timestamp: string;
}

export const VoiceConsole: React.FC<VoiceConsoleProps> = ({
  onSendMessage, isLoading: globalLoading, latestAgentResponse, activeTicketId
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [ttsProvider, setTtsProvider] = useState<string>("Natural Voice Engine");
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [voiceHistory, setVoiceHistory] = useState<VoiceTurn[]>([]);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const isListeningRef = useRef(false);
  const transcriptRef = useRef("");

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Auto-scroll transcript stream
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [voiceHistory, transcript]);

  // Unlock Web Audio API Context on User Interaction
  const unlockAudioContext = async () => {
    try {
      if (typeof window === "undefined") return;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }

      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }

      if ("speechSynthesis" in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (err: any) {
      console.warn("AudioContext unlock warning:", err);
    }
  };

  // Call timer
  useEffect(() => {
    if (sessionActive) {
      timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setCallSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [sessionActive]);

  // Web Speech Recognition (STT) setup - Continuous & High-Accuracy en-US
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setPermissionError("Web Speech Recognition API is not supported in this browser. You can use the Voice Input Presets below.");
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    
    r.onresult = (e: any) => {
      let fullTranscript = "";
      for (let i = 0; i < e.results.length; i++) {
        fullTranscript += e.results[i][0].transcript + " ";
      }
      const cleaned = fullTranscript.trim();
      setTranscript(cleaned);
    };

    r.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setIsListening(false);
        setPermissionError("Microphone access was denied by browser settings. Please allow mic permissions in your address bar.");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        console.warn(`Speech recognition non-fatal event: ${e.error}`);
      }
    };

    r.onend = () => {
      if (isListeningRef.current) {
        try {
          r.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = r;
  }, []);

  const playNaturalTTS = async (textToSpeak: string) => {
    stopAllAudio();

    // 1. Try Cloud Audio API Endpoint
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak, voice: "alloy" })
      });

      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("audio/mpeg")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioElemRef.current = audio;

        audio.onplay = () => {
          setIsSpeaking(true);
          setTtsProvider("OpenAI Neural Stream");
        };
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => fallbackNaturalBrowserSpeech(textToSpeak);

        await audio.play();
        return;
      }
    } catch (cloudErr) {
      console.warn("Cloud TTS endpoint skipped, using natural browser voice:", cloudErr);
    }

    // 2. Fallback Natural SpeechSynthesis
    fallbackNaturalBrowserSpeech(textToSpeak);
  };

  const fallbackNaturalBrowserSpeech = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.startsWith("en") && 
        (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Jenny") || v.name.includes("Zira"))
      ) || voices.find(v => v.lang.startsWith("en")) || voices[0];

      if (preferredVoice) {
        u.voice = preferredVoice;
        setTtsProvider(`Natural Voice (${preferredVoice.name})`);
      } else {
        setTtsProvider("Browser SpeechSynthesis");
      }

      u.rate = speechRate;
      u.pitch = 1.0;

      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = (err) => {
        console.error("SpeechSynthesis error:", err);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(u);
    } catch (err) {
      console.error("TTS exception:", err);
      setIsSpeaking(false);
    }
  };

  const stopAllAudio = () => {
    if (audioElemRef.current) {
      audioElemRef.current.pause();
      audioElemRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const startSession = async () => {
    await unlockAudioContext();
    setSessionActive(true);
    setPermissionError(null);
  };

  const endSession = () => {
    setSessionActive(false);
    setIsListening(false);
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setTranscript("");
    stopAllAudio();
  };

  const toggleMic = async () => {
    await unlockAudioContext();
    setPermissionError(null);

    if (isSpeaking) {
      stopAllAudio();
    }

    if (isListening) {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
    } else {
      setTranscript("");
      transcriptRef.current = "";
      if (recognitionRef.current) {
        try {
          isListeningRef.current = true;
          recognitionRef.current.start();
          setIsListening(true);
        } catch (err: any) {
          setPermissionError("Could not access microphone: " + err.message);
        }
      } else {
        setPermissionError("Speech recognition engine unavailable in this browser.");
      }
    }
  };

  const handleSendUserSpeech = async (textToSend: string) => {
    if (!textToSend.trim() || isProcessing) return;

    const userText = textToSend.trim();
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 1. Add User STT Turn to Dual Transcription Log
    setVoiceHistory(prev => [...prev, {
      id: "user-" + Date.now(),
      speaker: "user",
      text: userText,
      timestamp: nowStr
    }]);

    setTranscript("");
    transcriptRef.current = "";
    setIsProcessing(true);

    // Stop mic listening while agent analyzes
    if (recognitionRef.current) {
      isListeningRef.current = false;
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }

    // Also trigger global parent handler
    onSendMessage(activeTicketId, userText, false);

    // 2. Direct API call to guarantee instant Voice Console processing & TTS audio
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();

      if (res.ok && data && data.message) {
        const agentMsg = data.message;
        const agentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        setVoiceHistory(prev => [...prev, {
          id: "agent-" + Date.now(),
          speaker: "agent",
          text: agentMsg,
          timestamp: agentTime
        }]);

        // Play Natural TTS Audio Response
        playNaturalTTS(agentMsg);
      }
    } catch (err) {
      console.error("Voice Console API processing error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateSpeech = async (sampleQuery: string) => {
    await unlockAudioContext();
    handleSendUserSpeech(sampleQuery);
  };

  const clearHistory = () => {
    setVoiceHistory([]);
  };

  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const waveBars = Array.from({ length: 32 }, (_, i) => i);
  const activeLoading = globalLoading || isProcessing;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[color:var(--bg-base)]">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-[color:var(--border-main)] bg-[color:var(--bg-surface)] flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="badge badge-danger flex items-center gap-1">
              <Radio size={9} className="animate-pulse" /> LIVE VOICE COMMAND CENTER
            </span>
            <span className="text-[11px] text-[color:var(--text-muted)] font-mono">#DISPATCH-01</span>
          </div>
          <h2 className="text-base font-bold text-[color:var(--text-primary)]">Voice Console Command Center</h2>
          <p className="text-[11px] text-[color:var(--text-muted)] font-medium font-sans">Continuous Speech Recognition (STT), Spoken Order ID Normalization, & Neural TTS</p>
        </div>

        <div className="flex items-center gap-3">
          {sessionActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md card">
              <span className="status-dot live" />
              <span className="text-[11px] text-[color:var(--text-secondary)]">Session</span>
              <span className="font-mono text-xs font-bold text-[color:var(--text-primary)]">{fmt(callSeconds)}</span>
            </div>
          )}
          {!sessionActive ? (
            <button onClick={startSession} className="btn btn-primary">Start Voice Session</button>
          ) : (
            <button onClick={endSession} className="btn btn-danger">
              <PhoneOff size={13} /> End Call Session
            </button>
          )}
        </div>
      </div>

      {/* Single 1-Column Centered Layout */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start max-w-3xl mx-auto w-full gap-6">
        {permissionError && (
          <div className="w-full card p-3 border border-[color:var(--danger-muted)] bg-[color:var(--danger-muted)] flex items-center gap-2 text-xs text-[color:var(--danger)] animate-slide-up">
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span>{permissionError}</span>
          </div>
        )}

        {!sessionActive ? (
          /* Idle state */
          <div className="text-center space-y-3 my-auto py-12 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-[color:var(--bg-elevated)] border border-[color:var(--border-main)] flex items-center justify-center mx-auto shadow-lg">
              <Mic size={24} className="text-[color:var(--text-muted)]" />
            </div>
            <p className="text-sm font-semibold text-[color:var(--text-secondary)]">Voice Dispatch Console Idle</p>
            <p className="text-xs text-[color:var(--text-muted)] leading-relaxed">Click "Start Voice Session" to speak into the microphone and receive real-time AI audio responses</p>
          </div>
        ) : (
          <>
            {/* 1. Waveform Visualizer & Microphone Panel */}
            <div className="panel w-full p-6 flex flex-col items-center gap-5 shadow-lg">
              {/* Waveform Bars */}
              <div className="flex items-center gap-1.5 h-14">
                {waveBars.map(i => {
                  const isActive = isListening || isSpeaking || activeLoading;
                  return (
                    <span
                      key={i}
                      className={`wave-bar ${
                        isListening ? "bg-[color:var(--purple)]"
                        : isSpeaking ? "bg-[color:var(--success)]"
                        : activeLoading ? "bg-[color:var(--accent)]"
                        : "bg-[color:var(--text-caption)]"
                      }`}
                      style={{
                        height: isActive ? `${16 + Math.sin(i * 0.8) * 18 + Math.random() * 8}px` : "5px",
                        animationDelay: `${i * 0.04}s`,
                        animationDuration: `${0.8 + (i % 4) * 0.15}s`,
                        animationPlayState: isActive ? "running" : "paused",
                      }}
                    />
                  );
                })}
              </div>

              {/* Live Status Indicators */}
              <div className="flex items-center gap-2">
                {isListening && <><span className="status-dot live" style={{ background: "var(--purple)" }} /><span className="text-xs text-[color:var(--purple)] font-semibold">Listening to Microphone…</span></>}
                {isSpeaking  && <><span className="status-dot live" style={{ background: "var(--success)" }} /><span className="text-xs text-[color:var(--success)] font-semibold">Agent Speaking Audio Output ({ttsProvider})…</span></>}
                {activeLoading && <><span className="status-dot warn" /><span className="text-xs text-[color:var(--warning)] font-semibold font-mono">Analyzing Refund Policy & Order History…</span></>}
                {!isListening && !isSpeaking && !activeLoading && (
                  <span className="text-xs text-[color:var(--text-muted)]">Tap Mic to Speak or Select Sample Preset</span>
                )}
              </div>

              {/* Central Mic Button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={toggleMic}
                  disabled={activeLoading}
                  className={`w-16 h-16 rounded-full flex flex-col items-center justify-center gap-1 transition-all font-semibold text-white ${
                    isListening
                      ? "bg-[color:var(--purple)] ring-4 ring-purple-400/20 scale-110 shadow-purple-500/20"
                      : isSpeaking
                      ? "bg-[color:var(--success)] ring-4 ring-emerald-400/20 shadow-emerald-500/20"
                      : "bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] hover:scale-105 shadow-indigo-500/20"
                  }`}
                >
                  {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                </button>
                <span className="text-[10px] text-[color:var(--text-caption)] font-mono">
                  {isListening ? "Click Mic to Stop Listening" : "Click Mic to Start Speaking"}
                </span>
              </div>

              {/* TTS Speech Rate Speed Control */}
              <div className="w-full max-w-md pt-2 border-t border-[color:var(--border-sub)] flex items-center justify-between gap-4">
                <span className="text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider">Voice Speed</span>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="flex-1 cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-[color:var(--accent)]">{speechRate.toFixed(2)}x</span>
              </div>

              {/* Quick Sample Presets - Single Horizontal Row */}
              <div className="w-full max-w-2xl space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-[color:var(--text-caption)] uppercase tracking-wider block text-center">Quick Voice Input Presets</span>
                <div className="flex flex-row items-center justify-center gap-2 overflow-x-auto w-full py-1">
                  {[
                    "I want a refund for Order #ORD-1003 (damaged)",
                    "I want to return Order #ORD-1005 (Final Sale)",
                    "I want to return Order #ORD-1004 (delivered 53d ago)"
                  ].map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => simulateSpeech(preset)}
                      disabled={activeLoading}
                      className="btn btn-ghost btn-sm text-[10px] py-1 px-3 whitespace-nowrap flex-shrink-0"
                    >
                      <Sparkles size={10} className="text-[color:var(--purple)]" />
                      <span>"{preset}"</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Active Speech Input Buffer with Prominent Done/Send Button */}
            {transcript && (
              <div className="card w-full p-4 border-2 border-[color:var(--accent)] bg-[color:var(--accent-muted)] flex items-center justify-between gap-4 animate-slide-up shadow-lg">
                <div className="flex items-center gap-2.5 text-xs text-[color:var(--text-primary)] min-w-0 flex-1">
                  <Mic size={16} className="text-[color:var(--accent)] flex-shrink-0 animate-pulse" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--accent)] block">Recorded Speech Input</span>
                    <p className="font-semibold text-sm truncate">"{transcript}"</p>
                  </div>
                </div>
                <button onClick={() => handleSendUserSpeech(transcript)} disabled={activeLoading} className="btn btn-primary px-4 py-2 flex items-center gap-1.5 flex-shrink-0">
                  <CheckCircle2 size={14} /> Send & Analyze Speech
                </button>
              </div>
            )}

            {/* 3. Line-by-Line Dual Transcription Stream Box */}
            <div className="panel w-full flex flex-col overflow-hidden shadow-md">
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-[color:var(--border-main)] bg-[color:var(--bg-elevated)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={13} className="text-[color:var(--accent)]" />
                  <span className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">Live Line-by-Line Transcription Log</span>
                  <span className="badge badge-accent font-mono text-[9px]">{voiceHistory.length} Lines</span>
                </div>
                {voiceHistory.length > 0 && (
                  <button onClick={clearHistory} className="btn btn-ghost btn-sm text-[10px] py-0.5 px-2">
                    <Trash2 size={10} /> Clear
                  </button>
                )}
              </div>

              {/* Scrollable Compact Transcript Stream */}
              <div className="p-4 max-h-[240px] overflow-y-auto space-y-2.5 font-mono text-xs">
                {voiceHistory.length === 0 ? (
                  <div className="py-6 text-center text-[color:var(--text-caption)] space-y-1">
                    <p className="italic text-[11px]">No speech transcript lines recorded yet.</p>
                    <p className="text-[10px]">Speak into the mic, then click "Send & Analyze Speech" to hear the AI agent reply.</p>
                  </div>
                ) : (
                  voiceHistory.map((turn) => {
                    const isUser = turn.speaker === "user";
                    return (
                      <div
                        key={turn.id}
                        className={`p-2.5 rounded-md border flex items-start gap-2.5 animate-slide-up ${
                          isUser
                            ? "bg-[color:var(--purple-muted)] border-purple-500/20 text-[color:var(--text-primary)]"
                            : "bg-[color:var(--bg-base)] border-[color:var(--border-main)] text-[color:var(--text-primary)]"
                        }`}
                      >
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 uppercase ${
                          isUser ? "bg-purple-500/20 text-purple-300" : "bg-indigo-500/20 text-indigo-300"
                        }`}>
                          {isUser ? "CUSTOMER STT" : "AI AGENT TTS"}
                        </span>
                        <div className="flex-1 min-w-0 font-sans">
                          <p className="text-xs leading-relaxed">{turn.text}</p>
                          <span className="text-[9px] text-[color:var(--text-caption)] font-mono block mt-1">{turn.timestamp}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                {activeLoading && (
                  <div className="p-2.5 rounded-md border bg-[color:var(--bg-base)] border-[color:var(--border-main)] flex items-center gap-2 text-xs text-[color:var(--warning)] animate-pulse">
                    <Bot size={14} />
                    <span>AI Agent analyzing policy rules and preparing audio response…</span>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>

              {/* Footer */}
              {isSpeaking && (
                <div className="px-4 py-1.5 border-t border-[color:var(--border-sub)] bg-[color:var(--bg-elevated)] flex items-center justify-between text-[10px] text-[color:var(--success)] font-medium">
                  <span className="flex items-center gap-1.5">
                    <Volume2 size={11} className="animate-pulse" /> Playing Audio ({ttsProvider})
                  </span>
                  <button onClick={stopAllAudio} className="text-[color:var(--danger)] hover:underline flex items-center gap-1">
                    <VolumeX size={10} /> Stop Audio
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
