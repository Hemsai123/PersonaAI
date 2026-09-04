import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL as API_BASE } from "../config";
/**
 * CreativeHelper.tsx (Web keywords + HeyGen-ready)
 * ------------------------------------------------------------
 * Supports providers that either:
 *  - return { jobId } (polling flow — e.g., HeyGen), or
 *  - return { status:"succeeded", url } immediately (web keywords demo).
 */
// ---------- Small helpers ----------
const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const fmtPct = (n) => (typeof n === "number" ? `${clamp(Math.round(n))}%` : "—");
// ---------- The Page Component ----------
export default function CreativeHelper() {
    const [prompt, setPrompt] = useState("");
    const [provider, setProvider] = useState("web"); // default to WEB keywords
    const [aspectRatio, setAspectRatio] = useState("16:9");
    const [durationSeconds, setDurationSeconds] = useState(8);
    const [submitting, setSubmitting] = useState(false);
    const [jobId, setJobId] = useState(null);
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const videoRef = useRef(null);
    const canSubmit = useMemo(() => prompt.trim().length > 4 && !submitting, [prompt, submitting]);
    // Polling loop for status (used when backend returns a jobId)
    useEffect(() => {
        if (!jobId)
            return;
        let active = true;
        let timer = null;
        const poll = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/generate-video/?jobId=${encodeURIComponent(jobId)}`);
                if (!res.ok)
                    throw new Error(`Status HTTP ${res.status}`);
                const body = await res.json();
                if (!active)
                    return;
                setStatus(body);
                if (body.status === "succeeded" || body.status === "failed") {
                    timer && window.clearTimeout(timer);
                    return;
                }
                timer = window.setTimeout(poll, 1600);
            }
            catch (e) {
                if (!active)
                    return;
                setError(e?.message ?? "Failed to poll status");
                timer && window.clearTimeout(timer);
            }
        };
        poll();
        return () => {
            active = false;
            if (timer)
                window.clearTimeout(timer);
        };
    }, [jobId]);
    const startGeneration = async () => {
        setSubmitting(true);
        setError(null);
        setStatus(null);
        setJobId(null);
        try {
            const payload = {
                prompt: prompt.trim(),
                provider, // ← use the selected provider (web/heygen/demo/etc.)
                aspectRatio,
                durationSeconds,
            };
            const token = localStorage.getItem("persona_token");
            console.log("[CreativeHelper] Starting gen. Provider:", provider, "Token exists:", !!token);
            const res = await fetch(`${API_BASE}/api/generate-video/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok)
                throw new Error(`Create job HTTP ${res.status}`);
            const data = await res.json();
            // Handle both immediate-success (web/demo) and job-based (heygen/…)
            if ("status" in data && data.status === "succeeded" && data.url) {
                setStatus({ status: "succeeded", url: data.url, progress: 100, message: data.message });
                setJobId(null);
            }
            else if ("jobId" in data && data.jobId) {
                setJobId(data.jobId);
            }
            else {
                throw new Error(data?.message || "Unexpected response from API");
            }
        }
        catch (e) {
            setError(e?.message ?? "Failed to start generation");
        }
        finally {
            setSubmitting(false);
        }
    };
    const cancelJob = async () => {
        if (!jobId)
            return;
        try {
                await fetch(`${API_BASE}/api/generate-video/?jobId=${encodeURIComponent(jobId)}`, { method: "DELETE" });
        }
        catch {
            // no-op
        }
        finally {
            setJobId(null);
            setStatus(null);
        }
    };
    const videoReady = status?.status === "succeeded" && !!status.url;
    const isRunning = status?.status === "queued" || status?.status === "running";
    return (React.createElement("div", { className: "min-h-screen bg-neutral-950 text-neutral-100 px-4 sm:px-6 lg:px-8 py-8" },
        React.createElement("div", { className: "mx-auto max-w-5xl" },
            React.createElement("header", { className: "mb-6 flex items-start justify-between gap-4" },
                React.createElement("div", null,
                    React.createElement("h1", { className: "text-2xl sm:text-3xl font-semibold tracking-tight" }, "Creative Helper"),
                    React.createElement("p", { className: "text-sm text-neutral-400 mt-1" }, "Type a scene (or script) and I\u2019ll fetch a free clip (Web) or generate a video (HeyGen).")),
                React.createElement("div", { className: "flex items-center gap-2 text-xs text-neutral-400" },
                    React.createElement("span", { className: "inline-flex items-center gap-1 rounded-full bg-neutral-800 px-3 py-1" }, "\uD83D\uDD11 Server-side API required (for HeyGen etc.)"))),
            React.createElement("div", { className: "rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-xl backdrop-blur p-4 sm:p-6" },
                React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6" },
                    React.createElement("div", { className: "lg:col-span-2 space-y-4" },
                        React.createElement("label", { className: "block text-sm font-medium" }, "Describe your scene or script"),
                        React.createElement("textarea", { value: prompt, onChange: (e) => setPrompt(e.target.value), placeholder: 'e.g., "ocean waves at sunset" or "city street at night with neon"', className: "w-full h-40 resize-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" }),
                        React.createElement("div", { className: "grid grid-cols-2 gap-3" },
                            React.createElement("div", { className: "space-y-1" },
                                React.createElement("label", { className: "block text-sm font-medium" }, "Provider"),
                                React.createElement("select", { value: provider, onChange: (e) => setProvider(e.target.value), className: "w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2" },
                                    React.createElement("option", { value: "web" }, "Web (free keywords)"),
                                    React.createElement("option", { value: "heygen" }, "HeyGen (Talking avatar)"),
                                    React.createElement("option", { value: "veo" }, "Google Veo (Gemini video)"),
                                    React.createElement("option", { value: "luma" }, "Luma"),
                                    React.createElement("option", { value: "pika" }, "Pika"),
                                    React.createElement("option", { value: "runway" }, "Runway"),
                                    React.createElement("option", { value: "demo" }, "Demo (server fallback)"))),
                            React.createElement("div", { className: "space-y-1" },
                                React.createElement("label", { className: "block text-sm font-medium" }, "Aspect ratio"),
                                React.createElement("select", { value: aspectRatio, onChange: (e) => setAspectRatio(e.target.value), className: "w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2" },
                                    React.createElement("option", { value: "16:9" }, "16:9 (landscape)"),
                                    React.createElement("option", { value: "9:16" }, "9:16 (vertical)"),
                                    React.createElement("option", { value: "1:1" }, "1:1 (square)"),
                                    React.createElement("option", { value: "4:3" }, "4:3")))),
                        React.createElement("button", { onClick: () => setShowAdvanced((v) => !v), className: "text-xs text-neutral-300 hover:text-white underline underline-offset-4" },
                            showAdvanced ? "Hide" : "Show",
                            " advanced"),
                        showAdvanced && (React.createElement("div", { className: "grid grid-cols-2 gap-3 pt-1" },
                            React.createElement("div", null,
                                React.createElement("label", { className: "block text-sm font-medium" }, "Duration (s)"),
                                React.createElement("input", { type: "number", min: 2, max: 20, value: durationSeconds, onChange: (e) => setDurationSeconds(parseInt(e.target.value || "8", 10)), className: "w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2" })),
                            React.createElement("div", { className: "opacity-70" },
                                React.createElement("label", { className: "block text-sm font-medium" }, "Seed (optional)"),
                                React.createElement("input", { disabled: true, placeholder: "Provider-specific", className: "w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2" })))),
                        React.createElement("div", { className: "flex items-center gap-3 pt-2" },
                            React.createElement("button", { disabled: !canSubmit, onClick: startGeneration, className: `inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium shadow-md transition ${canSubmit ? "bg-indigo-600 hover:bg-indigo-500" : "bg-neutral-700 cursor-not-allowed"}` }, submitting ? "Starting…" : "Generate video"),
                            isRunning && (React.createElement("button", { onClick: cancelJob, className: "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium bg-neutral-800 hover:bg-neutral-700" }, "Cancel"))),
                        React.createElement("div", { className: "mt-4 text-sm" },
                            error && (React.createElement("div", { className: "mb-2 rounded-lg border border-red-900/40 bg-red-950/40 p-3 text-red-200" },
                                "\u274C ",
                                error)),
                            status && (React.createElement("div", { className: "rounded-lg border border-neutral-800 bg-neutral-900 p-3" },
                                React.createElement("div", { className: "flex items-center justify-between text-neutral-300" },
                                    React.createElement("span", null,
                                        "Status: ",
                                        React.createElement("span", { className: "font-semibold text-white" }, status.status)),
                                    React.createElement("span", null,
                                        "Progress: ",
                                        React.createElement("span", { className: "font-semibold text-white" }, fmtPct(status.progress)))),
                                status.message && React.createElement("p", { className: "mt-1 text-neutral-400 text-xs" }, status.message),
                                React.createElement("div", { className: "mt-3 h-2 w-full rounded-full bg-neutral-800 overflow-hidden" },
                                    React.createElement("div", { className: "h-full bg-indigo-500 transition-all", style: { width: `${clamp(status.progress ?? 0)}%` } })))))),
                    React.createElement("div", { className: "lg:col-span-3" },
                        React.createElement("div", { className: "aspect-video w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 relative" },
                            !videoReady && (React.createElement("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-400 p-6 text-center" }, status?.thumb ? (React.createElement("img", { src: status.thumb, alt: "preview", className: "h-full w-full object-cover" })) : (React.createElement(React.Fragment, null,
                                React.createElement("span", { className: "text-6xl" }, "\uD83C\uDFAC"),
                                React.createElement("p", { className: "max-w-md" },
                                    "Your video preview appears here. Try keywords like ",
                                    React.createElement("em", null, "ocean"),
                                    ", ",
                                    React.createElement("em", null, "city"),
                                    ", ",
                                    React.createElement("em", null, "forest"),
                                    ",",
                                    React.createElement("em", null, " fire"),
                                    ", ",
                                    React.createElement("em", null, "tech"),
                                    "."))))),
                            videoReady && (React.createElement("video", { ref: videoRef, className: "h-full w-full object-contain bg-black", src: status.url, controls: true, playsInline: true }))),
                        videoReady && (React.createElement("div", { className: "mt-3 flex items-center gap-3" },
                            React.createElement("a", { href: status.url, download: true, className: "rounded-xl bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-sm" }, "Download"),
                            React.createElement("button", { className: "rounded-xl bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-sm", onClick: () => videoRef.current?.play() }, "\u25B6\uFE0E Play"),
                            React.createElement("button", { className: "rounded-xl bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-sm", onClick: () => videoRef.current?.pause() }, "\u275A\u275A Pause"))),
                        React.createElement("div", { className: "mt-6 text-xs text-neutral-400 space-y-1" },
                            React.createElement("p", null, "Tip: Try descriptive keywords for the Web provider (e.g., \u201Cocean at sunset\u201D, \u201Ccity at night\u201D, \u201Cforest rain\u201D)."),
                            React.createElement("p", null, "Switch provider to HeyGen to generate a talking avatar using your script."))))),
            React.createElement("p", { className: "mt-6 text-xs text-neutral-500" }, "Note: Providers enforce safety filters and generation limits. The exact duration, resolution, and motion fidelity depend on your chosen model and account plan."))));
}
