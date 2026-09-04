import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Gamepad2, Brain, Zap, Dice5, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PersonaQuizGame from './games/PersonaQuizGame';
import WordAssociationGame from './games/WordAssociationGame';
import TriviaGame from './games/TriviaGame';
import DecisionMazeGame from './games/DecisionMazeGame';
const GameZone = () => {
    const navigate = useNavigate();
    const [currentGame, setCurrentGame] = useState('menu');
    const games = [
        {
            id: 'persona-quiz',
            title: 'Persona Quiz',
            description: 'Match AI personas to their descriptions. Can you guess them all?',
            icon: Brain,
            color: 'from-blue-500 to-cyan-500',
        },
        {
            id: 'word-association',
            title: 'Word Association',
            description: 'Challenge the AI to word associations. Beat it with quick thinking!',
            icon: Zap,
            color: 'from-yellow-500 to-orange-500',
        },
        {
            id: 'trivia',
            title: 'AI Trivia',
            description: 'Answer trivia questions powered by AI. Test your knowledge!',
            icon: Dice5,
            color: 'from-pink-500 to-red-500',
        },
        {
            id: 'decision-maze',
            title: 'Decision Maze',
            description: 'Navigate through choices and stories. Where will your decisions lead?',
            icon: Compass,
            color: 'from-purple-500 to-pink-500',
        },
    ];
    const renderGame = () => {
        switch (currentGame) {
            case 'persona-quiz':
                return React.createElement(PersonaQuizGame, { onBack: () => setCurrentGame('menu') });
            case 'word-association':
                return React.createElement(WordAssociationGame, { onBack: () => setCurrentGame('menu') });
            case 'trivia':
                return React.createElement(TriviaGame, { onBack: () => setCurrentGame('menu') });
            case 'decision-maze':
                return React.createElement(DecisionMazeGame, { onBack: () => setCurrentGame('menu') });
            default:
                return null;
        }
    };
    if (currentGame !== 'menu') {
        return renderGame();
    }
    return (React.createElement("div", { className: "min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4" },
        React.createElement("div", { className: "max-w-6xl mx-auto mb-12" },
            React.createElement("button", { onClick: () => navigate('/'), className: "flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors" },
                React.createElement(ArrowLeft, { className: "h-5 w-5" }),
                "Back"),
            React.createElement(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } },
                React.createElement("div", { className: "flex items-center gap-3 mb-4" },
                    React.createElement("div", { className: "p-3 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl" },
                        React.createElement(Gamepad2, { className: "h-8 w-8 text-white" })),
                    React.createElement("h1", { className: "text-4xl font-bold text-slate-900 dark:text-white" }, "Game Zone")),
                React.createElement("p", { className: "text-lg text-slate-600 dark:text-slate-300" }, "Play AI-powered games and challenge yourself!"))),
        React.createElement("div", { className: "max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6" }, games.map((game, index) => {
            const IconComponent = game.icon;
            return (React.createElement(motion.div, { key: game.id, initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: index * 0.1 }, whileHover: { y: -4 }, onClick: () => setCurrentGame(game.id), className: "group cursor-pointer" },
                React.createElement("div", { className: `relative overflow-hidden rounded-2xl bg-gradient-to-br ${game.color} p-1 shadow-lg hover:shadow-2xl transition-all` },
                    React.createElement("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-8 h-full" },
                        React.createElement("div", { className: "flex items-start justify-between mb-4" },
                            React.createElement("div", { className: `p-3 bg-gradient-to-br ${game.color} rounded-lg group-hover:scale-110 transition-transform` },
                                React.createElement(IconComponent, { className: "h-6 w-6 text-white" })),
                            React.createElement("div", { className: "text-3xl" }, "\uD83C\uDFAE")),
                        React.createElement("h3", { className: "text-2xl font-bold text-slate-900 dark:text-white mb-2" }, game.title),
                        React.createElement("p", { className: "text-slate-600 dark:text-slate-300 mb-6" }, game.description),
                        React.createElement(motion.button, { whileHover: { x: 4 }, className: `inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${game.color} text-white font-semibold` },
                            "Play Now",
                            React.createElement("span", null, "\u2192"))))));
        })),
        React.createElement(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: 0.4 }, className: "max-w-6xl mx-auto mt-16 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg" },
            React.createElement("h3", { className: "text-xl font-bold text-slate-900 dark:text-white mb-4" }, "\uD83C\uDFC6 Leaderboard"),
            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4" }, [
                { label: 'Games Played', value: '0' },
                { label: 'Total Score', value: '0' },
                { label: 'Games Won', value: '0' },
                { label: 'Best Streak', value: '0' },
            ].map((stat) => (React.createElement("div", { key: stat.label, className: "text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg" },
                React.createElement("div", { className: "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500" }, stat.value),
                React.createElement("div", { className: "text-sm text-slate-600 dark:text-slate-300" }, stat.label))))))));
};
export default GameZone;
