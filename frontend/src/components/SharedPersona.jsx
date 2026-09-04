import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Sparkles, Copy, Check } from "lucide-react";
import { useParams } from "react-router-dom";
import { generateChatResponse, ChatError } from "../services/groq";
import { API_BASE_URL as API_BASE } from "../config";
const SharedPersona = () => {
    const { slug } = useParams();
    const [persona, setPersona] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    // Fetch persona on mount
    useEffect(() => {
        if (!slug)
            return;
        fetch(`${API_BASE}/api/personas/${encodeURIComponent(slug)}`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => setPersona(data.persona))
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [slug]);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    const autoResize = () => {
        const el = textareaRef.current;
        if (!el)
            return;
        el.style.height = "0px";
        el.style.height = Math.min(el.scrollHeight, 120) + "px";
    };
    const handleSubmit = async (e) => {
        if (e)
            e.preventDefault();
        const content = inputMessage.trim();
        if (!content || isSending || !persona)
            return;
        setInputMessage("");
        setError(null);
        const userMsg = { role: "user", content };
        const nextHistory = [...messages, userMsg];
        setMessages(nextHistory);
        setIsSending(true);
        try {
            const response = await generateChatResponse(persona.prompt, nextHistory, content);
            setMessages((prev) => [...prev, { role: "assistant", content: response }]);
        }
        catch (err) {
            setError(err instanceof ChatError ? err.message : "Something went wrong. Please try again.");
        }
        finally {
            setIsSending(false);
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };
    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    // Loading state
    if (loading) {
        return (React.createElement("div", { className: "flex min-h-screen items-center justify-center bg-slate-50 dark:bg-gray-950" },
            React.createElement(Loader2, { className: "h-8 w-8 animate-spin text-indigo-500" })));
    }
    // Not found
    if (notFound || !persona) {
        return (React.createElement("div", { className: "flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-gray-950 text-center" },
            React.createElement("div", { className: "rounded-2xl border border-slate-200 bg-white p-10 shadow-lg dark:border-gray-800 dark:bg-gray-900" },
                React.createElement(Sparkles, { className: "mx-auto mb-4 h-10 w-10 text-slate-400" }),
                React.createElement("h1", { className: "text-2xl font-bold text-slate-900 dark:text-white" }, "Persona Not Found"),
                React.createElement("p", { className: "mt-2 text-slate-500 dark:text-slate-400" }, "This persona link may be invalid or has been removed."))));
    }
    return (React.createElement("div", { className: "flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900" },
        React.createElement("div", { className: "border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-gray-800/70 dark:bg-gray-900/80" },
            React.createElement("div", { className: "mx-auto flex max-w-4xl items-center justify-between px-4 py-3" },
                React.createElement("div", { className: "flex items-center gap-3" },
                    React.createElement("div", { className: "grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg" },
                        React.createElement(Sparkles, { className: "h-5 w-5" })),
                    React.createElement("div", null,
                        React.createElement("h1", { className: "text-sm font-bold text-slate-900 dark:text-white" }, persona.name),
                        React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" },
                            "by ",
                            persona.creator_name,
                            " \u00B7 Shared Persona"))),
                React.createElement("div", { className: "flex items-center gap-2" },
                    React.createElement("button", { onClick: copyLink, className: "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-300" },
                        copied ? React.createElement(Check, { className: "h-3.5 w-3.5 text-emerald-500" }) : React.createElement(Copy, { className: "h-3.5 w-3.5" }),
                        copied ? "Copied!" : "Copy Link")))),
        persona.description && (React.createElement("div", { className: "mx-auto w-full max-w-4xl px-4 pt-4" },
            React.createElement("div", { className: "rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/5 dark:text-indigo-300" }, persona.description))),
        React.createElement("div", { className: "mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-4" },
            React.createElement("div", { className: "flex-1 overflow-y-auto rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6" },
                React.createElement("div", { className: "space-y-4" },
                    messages.length === 0 && !isSending && (React.createElement("div", { className: "flex h-60 flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500" },
                        React.createElement("div", { className: "mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40" },
                            React.createElement(Sparkles, { className: "h-6 w-6 text-indigo-500" })),
                        React.createElement("p", { className: "font-medium text-slate-600 dark:text-slate-300" },
                            "Chat with ",
                            persona.name),
                        React.createElement("p", { className: "mt-1 text-sm" }, "Type a message below to start the conversation."))),
                    messages.map((msg, i) => {
                        const isUser = msg.role === "user";
                        return (React.createElement(motion.div, { key: i, initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: `flex ${isUser ? "justify-end" : "justify-start"}` },
                            React.createElement("div", { className: `flex max-w-[85%] items-end gap-2` },
                                !isUser && (React.createElement("div", { className: "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-bold text-white" }, "AI")),
                                React.createElement("div", { className: `rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser
                                        ? "bg-indigo-600 text-white"
                                        : "border border-slate-200 bg-slate-50 text-slate-800 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-200"}` }, msg.content),
                                isUser && (React.createElement("div", { className: "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 dark:bg-gray-700 dark:text-slate-300" }, "You")))));
                    }),
                    isSending && (React.createElement("div", { className: "flex justify-start" },
                        React.createElement("div", { className: "inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800" },
                            React.createElement(Loader2, { className: "h-4 w-4 animate-spin text-indigo-500" }),
                            React.createElement("span", { className: "text-slate-500" }, "Typing\u2026")))),
                    error && (React.createElement("div", { className: "rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400" }, error)),
                    React.createElement("div", { ref: messagesEndRef }))),
            React.createElement("form", { onSubmit: handleSubmit, className: "mt-3 flex items-end gap-2" },
                React.createElement("textarea", { ref: textareaRef, value: inputMessage, onChange: (e) => {
                        setInputMessage(e.target.value);
                        autoResize();
                    }, onKeyDown: handleKeyDown, rows: 1, placeholder: "Type your message\u2026", className: "flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-800" }),
                React.createElement("button", { type: "submit", disabled: isSending || !inputMessage.trim(), className: "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-50" }, isSending ? React.createElement(Loader2, { className: "h-5 w-5 animate-spin" }) : React.createElement(Send, { className: "h-5 w-5" }))),
            React.createElement("p", { className: "mt-2 text-center text-[11px] text-slate-400" },
                "Powered by ",
                React.createElement("span", { className: "font-semibold" }, "Persona Studio"),
                " \u00B7 ",
                React.createElement("a", { href: "/", className: "underline" }, "Create your own")))));
};
export default SharedPersona;
