import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight } from 'lucide-react';
const PersonaCard = ({ name, description, interactions, imageUrl, creator, icon }) => {
    return (React.createElement(motion.div, { whileHover: { scale: 1.02 }, className: "group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300" },
        React.createElement("div", { className: "absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" }),
        React.createElement("div", { className: "relative p-6" },
            React.createElement("div", { className: "flex items-center gap-4 mb-4" },
                imageUrl ? (React.createElement("img", { src: imageUrl, alt: name, className: "w-12 h-12 rounded-full object-cover" })) : (React.createElement("div", { className: "w-12 h-12" }, icon)),
                React.createElement("div", null,
                    React.createElement("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" }, name),
                    creator && (React.createElement("p", { className: "text-sm text-gray-500 dark:text-gray-400" },
                        "By ",
                        creator)))),
            React.createElement("p", { className: "text-gray-600 dark:text-gray-300 mb-4" }, description),
            React.createElement("div", { className: "flex items-center justify-between" },
                React.createElement("div", { className: "flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400" },
                    React.createElement(MessageCircle, { className: "w-4 h-4" }),
                    React.createElement("span", null,
                        interactions,
                        " chats")),
                React.createElement(ArrowRight, { className: "w-5 h-5 text-indigo-500 group-hover:translate-x-1 transition-transform" })))));
};
export default PersonaCard;
