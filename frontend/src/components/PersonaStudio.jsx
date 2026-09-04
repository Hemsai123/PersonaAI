import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Users, Mic, PenLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DebateRoom from './studio/DebateRoom';
import LiveCall from './studio/LiveCall';
import SmartWriter from './studio/SmartWriter';
const PersonaStudio = () => {
    const navigate = useNavigate();
    const [currentMode, setCurrentMode] = useState('menu');
    const modes = [
        {
            id: 'debate',
            title: 'AI Debate Room',
            description: 'Watch two Personas autonomously argue or discuss any topic you give them.',
            icon: Users,
            color: 'from-indigo-500 to-purple-500',
            emoji: '🗣️',
        },
        {
            id: 'voice',
            title: 'Live Phone Call',
            description: 'Have a hands-free, real-time voice conversation with your favorite Persona.',
            icon: Mic,
            color: 'from-emerald-500 to-teal-500',
            emoji: '📞',
        },
        {
            id: 'writer',
            title: 'AI Smart Writer',
            description: 'Generate polished emails, tweets, blogs & more in any Persona\'s unique voice.',
            icon: PenLine,
            color: 'from-amber-500 to-orange-500',
            emoji: '✍️',
        },
    ];
    const renderMode = () => {
        switch (currentMode) {
            case 'debate':
                return React.createElement(DebateRoom, { onBack: () => setCurrentMode('menu') });
            case 'voice':
                return React.createElement(LiveCall, { onBack: () => setCurrentMode('menu') });
            case 'writer':
                return React.createElement(SmartWriter, { onBack: () => setCurrentMode('menu') });
            default:
                return null;
        }
    };
    if (currentMode !== 'menu') {
        return renderMode();
    }
    return (React.createElement("div", { className: "min-h-screen bg-slate-950 text-white py-12 px-4" },
        React.createElement("div", { className: "max-w-6xl mx-auto mb-12" },
            React.createElement("button", { onClick: () => navigate('/'), className: "flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors" },
                React.createElement(ArrowLeft, { className: "h-5 w-5" }),
                "Back Home"),
            React.createElement(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } },
                React.createElement("div", { className: "flex items-center gap-3 mb-4" },
                    React.createElement("div", { className: "p-3 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl" },
                        React.createElement(Sparkles, { className: "h-8 w-8 text-white" })),
                    React.createElement("h1", { className: "text-4xl lg:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400" }, "Persona Studio")),
                React.createElement("p", { className: "text-lg text-slate-400 max-w-2xl" }, "Welcome to the AI capabilities lab. Choose a cutting-edge experiment below to push your custom Personas to their limits."))),
        React.createElement("div", { className: "max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" },
            React.createElement(AnimatePresence, null, modes.map((mode, index) => {
                const IconComponent = mode.icon;
                return (React.createElement(motion.div, { key: mode.id, initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: index * 0.1 }, whileHover: { y: -8, scale: 1.02 }, onClick: () => setCurrentMode(mode.id), className: "group cursor-pointer" },
                    React.createElement("div", { className: `relative overflow-hidden rounded-3xl bg-gradient-to-br ${mode.color} p-[1px] shadow-2xl transition-all h-full` },
                        React.createElement("div", { className: "bg-slate-900 rounded-[23px] p-8 h-full relative overflow-hidden flex flex-col" },
                            React.createElement("div", { className: `absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${mode.color} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity` }),
                            React.createElement("div", { className: "flex items-start justify-between mb-8 relative z-10" },
                                React.createElement("div", { className: `p-4 bg-gradient-to-br ${mode.color} rounded-2xl shadow-lg` },
                                    React.createElement(IconComponent, { className: "h-7 w-7 text-white" })),
                                React.createElement("div", { className: "text-4xl bg-white/5 w-14 h-14 flex items-center justify-center rounded-2xl border border-white/10 backdrop-blur-sm shadow-xl" }, mode.emoji)),
                            React.createElement("h3", { className: "text-2xl font-bold text-white mb-3 relative z-10 tracking-tight" }, mode.title),
                            React.createElement("p", { className: "text-slate-400 mb-8 relative z-10 leading-relaxed font-medium" }, mode.description),
                            React.createElement(motion.button, { className: `mt-auto inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${mode.color} text-white font-bold text-sm shadow-lg shadow-black/20 w-full justify-center` },
                                "Launch Experiment",
                                React.createElement(Sparkles, { className: "w-4 h-4 ml-1" }))))));
            })))));
};
export default PersonaStudio;
