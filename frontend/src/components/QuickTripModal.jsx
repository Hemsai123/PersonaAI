import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { MapPin, Crosshair, X, CalendarDays } from 'lucide-react';
const QuickTripModal = ({ open, onClose, onConfirm }) => {
    const [useCurrentLocation, setUseCurrentLocation] = useState(true);
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [nights, setNights] = useState(4);
    const geoSupported = typeof window !== "undefined" && "geolocation" in navigator;
    if (!open)
        return null;
    return createPortal(React.createElement("div", { className: "fixed inset-0 z-[2000] flex items-center justify-center" },
        React.createElement(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "absolute inset-0 bg-black/50", onClick: onClose }),
        React.createElement(motion.div, { initial: { opacity: 0, scale: 0.94 }, animate: { opacity: 1, scale: 1 }, transition: { type: "spring", stiffness: 200, damping: 18 }, className: "relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-6 mx-3" },
            React.createElement("div", { className: "flex items-center justify-between mb-4" },
                React.createElement("h2", { className: "flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white" },
                    React.createElement(MapPin, { className: "w-5 h-5 text-indigo-600" }),
                    "Plan a Trip"),
                React.createElement("button", { onClick: onClose, className: "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" },
                    React.createElement(X, { className: "w-5 h-5 text-gray-600 dark:text-gray-300" }))),
            React.createElement("div", { className: "space-y-4" },
                React.createElement("label", { className: "flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200" },
                    React.createElement("input", { type: "checkbox", checked: useCurrentLocation, onChange: () => setUseCurrentLocation(!useCurrentLocation), className: "mt-1" }),
                    "Use my current location",
                    !geoSupported && React.createElement("span", { className: "text-xs text-red-500" }, " (Not supported)")),
                React.createElement("div", null,
                    React.createElement("label", { className: "block text-sm text-gray-500 mb-1" }, "Source"),
                    React.createElement("input", { disabled: useCurrentLocation, value: origin, onChange: (e) => setOrigin(e.target.value), placeholder: "e.g., Mumbai, India", className: "w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700" }),
                    useCurrentLocation && (React.createElement("p", { className: "text-xs flex items-center gap-1 mt-1 text-gray-500" },
                        React.createElement(Crosshair, { className: "w-3 h-3" }),
                        " Using current location"))),
                React.createElement("div", null,
                    React.createElement("label", { className: "block text-sm text-gray-500 mb-1" }, "Destination"),
                    React.createElement("input", { value: destination, onChange: (e) => setDestination(e.target.value), placeholder: "e.g., Paris, France", className: "w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700" })),
                React.createElement("div", null,
                    React.createElement("label", { className: "block text-sm text-gray-500 mb-1" }, "How many days?"),
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(CalendarDays, { className: "w-4 h-4 text-indigo-600" }),
                        React.createElement("input", { type: "number", min: 1, max: 30, value: nights, onChange: (e) => setNights(Math.max(1, Number(e.target.value))), className: "w-20 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700" })))),
            React.createElement("div", { className: "flex justify-end gap-3 mt-6" },
                React.createElement("button", { onClick: onClose, className: "px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white" }, "Cancel"),
                React.createElement("button", { onClick: () => {
                        if (!destination.trim())
                            return;
                        if (!useCurrentLocation && !origin.trim())
                            return;
                        onConfirm({
                            useCurrentLocation,
                            origin: useCurrentLocation ? undefined : origin.trim(),
                            destination: destination.trim(),
                            nights,
                        });
                        onClose();
                    }, className: "px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700" }, "Plan Trip")))), document.body);
};
export default QuickTripModal;
