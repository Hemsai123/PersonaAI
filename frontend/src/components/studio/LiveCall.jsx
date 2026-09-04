import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, MicOff, PhoneCall, PhoneOff, MessageSquare, AlertTriangle, X } from 'lucide-react';
import { generateChatResponse } from '../../services/groq';
const LiveCall = ({ onBack }) => {
    const [callState, setCallState] = useState('idle');
    const [personaName, setPersonaName] = useState('Assistant');
    const [personaDescription, setPersonaDescription] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [systemMessage, setSystemMessage] = useState('');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [callHistory, setCallHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState('');
    const [speechSupported, setSpeechSupported] = useState(true);
    // Refs to avoid stale closures
    const callStateRef = useRef('idle');
    const isSpeakingRef = useRef(false);
    const transcriptRef = useRef('');
    const isMutedRef = useRef(false);
    const recognitionRef = useRef(null);
    const synthRef = useRef(null);
    const messagesRef = useRef([]);
    const timerRef = useRef(null);
    const historyEndRef = useRef(null);
    // Keep refs in sync
    useEffect(() => { callStateRef.current = callState; }, [callState]);
    useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
    useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
    // Scroll history to bottom
    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [callHistory]);
    // Check Speech Recognition support
    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            setSpeechSupported(false);
            return;
        }
        synthRef.current = window.speechSynthesis;
        // Preload voices
        if (synthRef.current) {
            synthRef.current.getVoices();
        }
        const recog = new SR();
        recog.continuous = false;
        recog.interimResults = true;
        recog.lang = 'en-US';
        recog.onstart = () => setIsListening(true);
        recog.onend = () => {
            setIsListening(false);
            const currentTranscript = transcriptRef.current;
            if (callStateRef.current === 'connected' && currentTranscript.trim() && !isSpeakingRef.current) {
                handleUserUtterance(currentTranscript);
            }
        };
        recog.onerror = (event) => {
            if (event.error === 'not-allowed') {
                setError('Microphone permission denied. Please allow microphone access.');
            }
            else if (event.error !== 'aborted' && event.error !== 'no-speech') {
                console.warn('Speech recognition error:', event.error);
            }
            setIsListening(false);
        };
        recog.onresult = (event) => {
            let final = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                final += event.results[i][0].transcript;
            }
            setTranscript(final);
        };
        recognitionRef.current = recog;
        return () => {
            try {
                recog.abort();
            }
            catch { }
            synthRef.current?.cancel();
        };
    }, []);
    // Call timer
    useEffect(() => {
        if (callState === 'connected') {
            timerRef.current = setInterval(() => {
                setElapsedSeconds(s => s + 1);
            }, 1000);
        }
        else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current)
                clearInterval(timerRef.current);
        };
    }, [callState]);
    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };
    const pickVoice = useCallback(() => {
        if (!synthRef.current)
            return null;
        const voices = synthRef.current.getVoices().filter(v => v.lang.startsWith('en'));
        if (voices.length === 0)
            return null;
        // Prefer a natural-sounding voice
        const preferred = voices.find(v => /natural|premium|enhanced|neural/i.test(v.name));
        return preferred || voices.find(v => /david|daniel|samantha|alex/i.test(v.name)) || voices[0];
    }, []);
    const speak = useCallback((text) => {
        if (!synthRef.current)
            return;
        synthRef.current.cancel();
        setIsSpeaking(true);
        const utt = new SpeechSynthesisUtterance(text);
        const voice = pickVoice();
        if (voice)
            utt.voice = voice;
        utt.pitch = 1.05;
        utt.rate = 1.0;
        utt.onend = () => {
            setIsSpeaking(false);
            // Auto-resume listening if still connected and not muted
            if (callStateRef.current === 'connected' && !isMutedRef.current) {
                setTranscript('');
                setTimeout(() => {
                    try {
                        recognitionRef.current?.start();
                    }
                    catch { }
                }, 300);
            }
        };
        utt.onerror = () => {
            setIsSpeaking(false);
        };
        synthRef.current.speak(utt);
    }, [pickVoice]);
    const addToHistory = useCallback((role, content) => {
        setCallHistory(prev => [...prev, {
                id: Date.now().toString() + Math.random(),
                role,
                content,
                timestamp: new Date(),
            }]);
    }, []);
    const handleUserUtterance = useCallback(async (text) => {
        if (!text.trim())
            return;
        setSystemMessage("Thinking...");
        addToHistory('user', text);
        messagesRef.current.push({ role: 'user', content: text });
        const personaContext = personaDescription
            ? `\n\nHere is additional context about your persona: ${personaDescription}`
            : '';
        const prompt = `You are on a LIVE phone call with the user. You are playing the role of ${personaName}.${personaContext}

Keep your answers very short (1-2 sentences max), conversational, and completely in character. Sound natural like a real phone call. Do not use asterisks, markdown, or emojis — just spoken words. Never mention you are an AI.`;
        try {
            const response = await generateChatResponse(prompt, messagesRef.current, "Respond naturally.");
            messagesRef.current.push({ role: 'assistant', content: response });
            addToHistory('assistant', response);
            setSystemMessage("");
            speak(response);
        }
        catch (err) {
            setSystemMessage("Connection issue. Trying again...");
            setTimeout(() => setSystemMessage(""), 3000);
            setIsSpeaking(false);
            // Auto-resume listening on error
            if (callStateRef.current === 'connected' && !isMutedRef.current) {
                setTranscript('');
                try {
                    recognitionRef.current?.start();
                }
                catch { }
            }
        }
    }, [personaName, personaDescription, speak, addToHistory]);
    const startCall = () => {
        if (!personaName.trim())
            return;
        setError('');
        setCallState('calling');
        setElapsedSeconds(0);
        setCallHistory([]);
        messagesRef.current = [];
        setTimeout(() => {
            setCallState('connected');
            const greeting = `Hello? This is ${personaName}. Who am I speaking with?`;
            messagesRef.current.push({ role: 'assistant', content: greeting });
            addToHistory('assistant', greeting);
            speak(greeting);
        }, 2500);
    };
    const endCall = () => {
        setCallState('ended');
        setIsListening(false);
        setIsSpeaking(false);
        setIsMuted(false);
        synthRef.current?.cancel();
        try {
            recognitionRef.current?.stop();
        }
        catch { }
        setTimeout(() => {
            setCallState('idle');
            setTranscript('');
            setSystemMessage('');
            setShowHistory(false);
        }, 2500);
    };
    const toggleMic = () => {
        if (isMuted) {
            setIsMuted(false);
            if (callState === 'connected' && !isSpeaking) {
                setTranscript('');
                try {
                    recognitionRef.current?.start();
                }
                catch { }
            }
        }
        else {
            setIsMuted(true);
            try {
                recognitionRef.current?.stop();
            }
            catch { }
        }
    };
    if (!speechSupported) {
        return (React.createElement("div", { className: "min-h-screen bg-black text-white flex flex-col items-center justify-center px-4" },
            React.createElement("button", { onClick: onBack, className: "flex items-center gap-2 text-slate-400 hover:text-white mb-12 transition-colors absolute top-8 left-8" },
                React.createElement(ArrowLeft, { className: "h-5 w-5" }),
                "Back to Studio"),
            React.createElement("div", { className: "bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md text-center" },
                React.createElement(AlertTriangle, { className: "w-12 h-12 text-amber-400 mx-auto mb-4" }),
                React.createElement("h2", { className: "text-2xl font-bold mb-2" }, "Browser Not Supported"),
                React.createElement("p", { className: "text-slate-400" },
                    "Voice calling requires the Web Speech API, which isn't supported in your browser. Please use ",
                    React.createElement("span", { className: "text-white font-medium" }, "Google Chrome"),
                    " or ",
                    React.createElement("span", { className: "text-white font-medium" }, "Microsoft Edge"),
                    " for the best experience."))));
    }
    return (React.createElement("div", { className: "min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden" },
        React.createElement("div", { className: "absolute inset-0 pointer-events-none" },
            React.createElement("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/20 rounded-full blur-[120px]" })),
        React.createElement("div", { className: "absolute top-0 left-0 right-0 flex justify-between items-center px-6 py-5 z-20" },
            React.createElement("button", { onClick: () => { endCall(); onBack(); }, className: "flex items-center gap-2 text-slate-400 hover:text-white transition-colors" },
                React.createElement(ArrowLeft, { className: "h-5 w-5" }),
                "Back"),
            callState === 'connected' && (React.createElement("button", { onClick: () => setShowHistory(!showHistory), className: `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showHistory ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'}` },
                React.createElement(MessageSquare, { className: "w-4 h-4" }),
                "History (",
                callHistory.length,
                ")"))),
        React.createElement(AnimatePresence, null, error && (React.createElement(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: "absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-red-900/90 border border-red-500/30 text-red-200 px-5 py-3 rounded-xl flex items-center gap-3 shadow-2xl max-w-sm" },
            React.createElement(AlertTriangle, { className: "w-5 h-5 flex-shrink-0 text-red-400" }),
            React.createElement("p", { className: "text-sm" }, error),
            React.createElement("button", { onClick: () => setError(''), className: "text-red-400 hover:text-white" },
                React.createElement(X, { className: "w-4 h-4" }))))),
        React.createElement("div", { className: "w-full max-w-md px-4 z-10" },
            callState === 'idle' && (React.createElement(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "text-center" },
                React.createElement("div", { className: "relative w-28 h-28 mx-auto mb-8" },
                    React.createElement("div", { className: "absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl" }),
                    React.createElement("div", { className: "relative w-28 h-28 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 shadow-2xl" },
                        React.createElement(PhoneCall, { className: "w-12 h-12 text-emerald-500" }))),
                React.createElement("h1", { className: "text-4xl font-bold mb-2 tracking-tight" }, "Live Voice Call"),
                React.createElement("p", { className: "text-slate-400 mb-10 text-sm" }, "Have an immersive, hands-free voice conversation with any AI persona."),
                React.createElement("div", { className: "bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-left mb-4 backdrop-blur-sm" },
                    React.createElement("label", { className: "block text-sm text-slate-400 mb-2 font-medium" }, "Who do you want to call?"),
                    React.createElement("input", { type: "text", value: personaName, onChange: (e) => setPersonaName(e.target.value), placeholder: "e.g. Iron Man, Elon Musk, My Therapist...", className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors placeholder-slate-600", autoFocus: true })),
                React.createElement("div", { className: "bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-left mb-8 backdrop-blur-sm" },
                    React.createElement("label", { className: "block text-sm text-slate-400 mb-2 font-medium" },
                        "Persona Description ",
                        React.createElement("span", { className: "text-slate-600" }, "(optional)")),
                    React.createElement("textarea", { value: personaDescription, onChange: (e) => setPersonaDescription(e.target.value), placeholder: "Describe their personality, background, speaking style...", rows: 3, className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors resize-none placeholder-slate-600" })),
                React.createElement(motion.button, { onClick: startCall, disabled: !personaName.trim(), whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, className: "w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/50 flex justify-center items-center gap-3" },
                    React.createElement(PhoneCall, { className: "w-5 h-5" }),
                    "Call ",
                    personaName || '...'))),
            (callState === 'calling' || callState === 'connected' || callState === 'ended') && (React.createElement(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "flex flex-col items-center" },
                React.createElement("div", { className: "text-center mb-10 mt-8" },
                    React.createElement("h2", { className: "text-3xl font-semibold tracking-tight" }, personaName),
                    React.createElement("div", { className: "mt-2 flex items-center justify-center gap-2" },
                        callState === 'calling' && (React.createElement("span", { className: "text-emerald-400 text-sm font-medium animate-pulse" }, "Calling...")),
                        callState === 'connected' && (React.createElement(React.Fragment, null,
                            React.createElement("span", { className: "w-2 h-2 rounded-full bg-emerald-500 animate-pulse" }),
                            React.createElement("span", { className: "text-emerald-400 text-sm font-mono font-medium" }, formatTime(elapsedSeconds)))),
                        callState === 'ended' && (React.createElement("span", { className: "text-red-400 text-sm font-medium" },
                            "Call Ended \u00B7 ",
                            formatTime(elapsedSeconds))))),
                React.createElement("div", { className: "relative w-52 h-52 flex items-center justify-center mb-10" },
                    callState === 'connected' && isSpeaking && (React.createElement(React.Fragment, null,
                        React.createElement(motion.div, { animate: { scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }, transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }, className: "absolute inset-0 bg-emerald-500/30 rounded-full blur-2xl" }),
                        React.createElement(motion.div, { animate: { scale: [1, 1.6, 1], opacity: [0.2, 0.05, 0.2] }, transition: { repeat: Infinity, duration: 2, delay: 0.3, ease: 'easeInOut' }, className: "absolute inset-0 bg-emerald-400/20 rounded-full blur-3xl" }),
                        React.createElement(motion.div, { animate: { scale: [1, 1.15, 1] }, transition: { repeat: Infinity, duration: 0.8 }, className: "absolute inset-2 border-2 border-emerald-500/40 rounded-full" }))),
                    callState === 'connected' && isListening && !isSpeaking && (React.createElement(React.Fragment, null,
                        React.createElement(motion.div, { animate: { scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }, transition: { repeat: Infinity, duration: 2 }, className: "absolute inset-0 bg-blue-500/15 rounded-full blur-xl" }),
                        React.createElement(motion.div, { animate: { scale: [1, 1.08, 1] }, transition: { repeat: Infinity, duration: 1.2 }, className: "absolute inset-3 border border-blue-500/30 rounded-full" }))),
                    React.createElement("div", { className: `w-40 h-40 rounded-full flex items-center justify-center z-10 transition-all duration-500
                  ${callState === 'calling' ? 'bg-slate-800 animate-pulse shadow-lg' :
                            callState === 'ended' ? 'bg-slate-900 border border-slate-800' :
                                isSpeaking ? 'bg-gradient-to-br from-emerald-900 to-emerald-800 border-2 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)]' :
                                    isListening ? 'bg-gradient-to-br from-blue-900/50 to-slate-800 border-2 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.25)]' :
                                        'bg-slate-800 border-2 border-slate-700'}` },
                        React.createElement("span", { className: "text-6xl select-none" }, callState === 'ended' ? '📵' : '👤'))),
                React.createElement("div", { className: "h-20 w-full max-w-sm text-center mb-8" },
                    React.createElement(AnimatePresence, { mode: "wait" },
                        React.createElement(motion.div, { key: systemMessage || transcript || (isListening ? 'listening' : isSpeaking ? 'speaking' : 'idle'), initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -5 }, className: "backdrop-blur-sm bg-slate-900/60 border border-slate-800/50 px-5 py-3 rounded-2xl" }, systemMessage ? (React.createElement("p", { className: "text-amber-300 text-sm font-medium flex items-center justify-center gap-2" },
                            React.createElement("span", { className: "flex gap-1" },
                                React.createElement("span", { className: "w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" }),
                                React.createElement("span", { className: "w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce", style: { animationDelay: '0.15s' } }),
                                React.createElement("span", { className: "w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce", style: { animationDelay: '0.3s' } })),
                            systemMessage)) : transcript ? (React.createElement("p", { className: "text-blue-300 text-sm font-medium italic" },
                            "\uD83C\uDF99\uFE0F \"",
                            transcript,
                            "\"")) : isListening ? (React.createElement("p", { className: "text-blue-400 text-sm font-medium flex items-center justify-center gap-2" },
                            React.createElement(Mic, { className: "w-4 h-4 animate-pulse" }),
                            " Listening...")) : isSpeaking ? (React.createElement("p", { className: "text-emerald-400 text-sm font-medium" },
                            personaName,
                            " is speaking...")) : callState === 'connected' ? (React.createElement("p", { className: "text-slate-500 text-sm" }, "Tap the mic to speak")) : null))),
                callState !== 'ended' && (React.createElement("div", { className: "flex items-center gap-6" },
                    React.createElement(motion.button, { onClick: toggleMic, disabled: callState !== 'connected' || isSpeaking, whileTap: { scale: 0.9 }, className: `w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-40
                    ${isMuted ? 'bg-red-500/20 border border-red-500/30 text-red-400' :
                            isListening ? 'bg-blue-500 text-white shadow-blue-500/30' :
                                'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'}` }, isMuted ? React.createElement(MicOff, { className: "w-6 h-6" }) : React.createElement(Mic, { className: "w-6 h-6" })),
                    React.createElement(motion.button, { onClick: endCall, whileTap: { scale: 0.9 }, className: "w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-900/50 transition-all" },
                        React.createElement(PhoneOff, { className: "w-8 h-8" }))))))),
        React.createElement(AnimatePresence, null, showHistory && callState === 'connected' && (React.createElement(motion.div, { initial: { x: '100%', opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: '100%', opacity: 0 }, transition: { type: 'spring', stiffness: 300, damping: 30 }, className: "fixed top-0 right-0 h-full w-full max-w-sm bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 z-40 flex flex-col shadow-2xl" },
            React.createElement("div", { className: "flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0" },
                React.createElement("h3", { className: "text-lg font-bold text-white flex items-center gap-2" },
                    React.createElement(MessageSquare, { className: "w-5 h-5 text-emerald-400" }),
                    "Conversation"),
                React.createElement("button", { onClick: () => setShowHistory(false), className: "text-slate-400 hover:text-white transition-colors p-1" },
                    React.createElement(X, { className: "w-5 h-5" }))),
            React.createElement("div", { className: "flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar" },
                callHistory.length === 0 && (React.createElement("p", { className: "text-slate-500 text-sm text-center py-8" }, "No messages yet...")),
                callHistory.map((msg) => (React.createElement(motion.div, { key: msg.id, initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, className: `flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}` },
                    React.createElement("div", { className: `max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                            ? 'bg-blue-500/15 border border-blue-500/20 text-blue-100 rounded-br-md'
                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 rounded-bl-md'}` },
                        React.createElement("div", { className: `text-[10px] font-bold uppercase tracking-widest mb-1 ${msg.role === 'user' ? 'text-blue-400' : 'text-emerald-400'}` }, msg.role === 'user' ? 'You' : personaName),
                        msg.content)))),
                React.createElement("div", { ref: historyEndRef }))))),
        React.createElement("style", null, `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `)));
};
export default LiveCall;
