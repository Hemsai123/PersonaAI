import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, AlertCircle, Upload, X, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const RawInput = () => {
    const navigate = useNavigate();
    const [personaName, setPersonaName] = useState('');
    const [rawData, setRawData] = useState('');
    const [files, setFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!personaName.trim()) {
            setError('Please enter a name for your persona');
            return;
        }
        if (!rawData.trim() && files.length === 0) {
            setError('Please enter some content or upload files');
            return;
        }
        const allContent = [rawData, ...files.map(f => f.content)].filter(Boolean).join('\n\n');
        const personaPrompt = `Embody the following persona completely. Never break character or explain who you are unless explicitly asked. Keep responses brief and concise (2-3 sentences max). Never introduce yourself or explain that you're an AI.\n\n${allContent}\n\nStay in character at all times. Only reveal your identity if directly asked.`;
        navigate('/chat', { state: { personaPrompt, personaName: personaName.trim() } });
    };
    const processFile = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    };
    const handleFileUpload = async (e) => {
        const uploadedFiles = e.target.files;
        if (!uploadedFiles?.length)
            return;
        setIsProcessing(true);
        setError(null);
        try {
            const newFiles = await Promise.all(Array.from(uploadedFiles).map(async (file) => {
                const content = await processFile(file);
                return {
                    name: file.name,
                    content,
                    type: file.type || 'text/plain'
                };
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
        catch (err) {
            setError('Failed to process files. Only text files are supported.');
        }
        finally {
            setIsProcessing(false);
            if (e.target)
                e.target.value = '';
        }
    };
    const removeFile = (fileName) => {
        setFiles(files.filter(f => f.name !== fileName));
    };
    return (React.createElement("div", { className: "min-h-screen bg-gray-100 dark:bg-black py-12 px-4 sm:px-6 lg:px-8" },
        React.createElement(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "max-w-2xl mx-auto" },
            React.createElement("button", { onClick: () => navigate('/manual-input'), className: "flex items-center gap-2 text-gray-900 dark:text-gray-100 mb-6 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" },
                React.createElement(ArrowLeft, { className: "w-5 h-5" }),
                "Back to Input Selection"),
            React.createElement("div", { className: "bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden" },
                React.createElement("div", { className: "px-8 py-6 bg-gray-900 dark:bg-black" },
                    React.createElement("h2", { className: "text-2xl font-bold text-white" }, "Raw Data Input"),
                    React.createElement("p", { className: "mt-2 text-gray-300" }, "Enter your persona data in free-form text or upload files")),
                React.createElement("form", { onSubmit: handleSubmit, className: "px-8 py-6 space-y-6" },
                    React.createElement("div", { className: "space-y-2" },
                        React.createElement("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Persona Name"),
                        React.createElement("input", { type: "text", value: personaName, onChange: (e) => setPersonaName(e.target.value), placeholder: "e.g., Mahesh Babu, Steve Jobs, Pirate Captain", className: "w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all", required: true })),
                    React.createElement("div", { className: "bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex gap-3" },
                        React.createElement(AlertCircle, { className: "w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" }),
                        React.createElement("div", { className: "text-sm text-gray-600 dark:text-gray-300" },
                            React.createElement("p", { className: "font-semibold mb-1" }, "Include in your description:"),
                            React.createElement("ul", { className: "list-disc list-inside space-y-1" },
                                React.createElement("li", null, "Name and background"),
                                React.createElement("li", null, "Personality traits and speaking style"),
                                React.createElement("li", null, "Typical phrases and expressions"),
                                React.createElement("li", null, "Knowledge areas and interests")))),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Upload Files (Text files only)"),
                        React.createElement("div", { className: "mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors" },
                            React.createElement("div", { className: "space-y-2 text-center" },
                                React.createElement(Upload, { className: "mx-auto h-12 w-12 text-gray-400" }),
                                React.createElement("div", { className: "flex text-sm text-gray-600 dark:text-gray-400" },
                                    React.createElement("label", { htmlFor: "file-upload", className: "relative cursor-pointer rounded-md font-medium text-gray-900 dark:text-gray-300 hover:text-gray-600 focus-within:outline-none" },
                                        React.createElement("span", null, "Upload files"),
                                        React.createElement("input", { id: "file-upload", type: "file", multiple: true, accept: ".txt,.csv,.json,.md,text/*", className: "sr-only", onChange: handleFileUpload, disabled: isProcessing })),
                                    React.createElement("p", { className: "pl-1" }, "or drag and drop")),
                                React.createElement("p", { className: "text-xs text-gray-500" }, "TXT, CSV, or other text files"))),
                        files.length > 0 && (React.createElement("div", { className: "mt-4 space-y-2" }, files.map((file) => (React.createElement("div", { key: file.name, className: "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg" },
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement(FileText, { className: "w-5 h-5 text-gray-600 dark:text-gray-400" }),
                                React.createElement("span", { className: "text-sm text-gray-700 dark:text-gray-300" }, file.name)),
                            React.createElement("button", { type: "button", onClick: () => removeFile(file.name), className: "p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors" },
                                React.createElement(X, { className: "w-4 h-4 text-gray-500 dark:text-gray-400" })))))))),
                    React.createElement("div", null,
                        React.createElement("label", { htmlFor: "rawData", className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" }, "Additional Description"),
                        React.createElement("textarea", { id: "rawData", value: rawData, onChange: (e) => setRawData(e.target.value), rows: 15, className: "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent font-mono", placeholder: "Enter additional persona description here..." })),
                    error && (React.createElement("div", { className: "text-red-600 dark:text-red-400 text-sm" }, error)),
                    React.createElement("button", { type: "submit", disabled: isProcessing, className: "w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed" },
                        React.createElement(Save, { className: "w-5 h-5" }),
                        "Create Persona & Start Chat"))))));
};
export default RawInput;
