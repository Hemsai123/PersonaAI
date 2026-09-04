import React from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { VOICE_OPTIONS } from '../types/voice';
const VoiceSettings = ({ voiceMode, isPlaying, selectedVoice, onVoiceModeToggle, onPlayPauseToggle, onVoiceChange, }) => {
    return (React.createElement("div", { className: "flex items-center gap-4" },
        React.createElement("button", { onClick: onVoiceModeToggle, className: `p-2 rounded-lg transition-colors ${voiceMode
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`, title: voiceMode ? 'Disable voice mode' : 'Enable voice mode' }, voiceMode ? React.createElement(Volume2, { className: "w-5 h-5" }) : React.createElement(VolumeX, { className: "w-5 h-5" })),
        voiceMode && (React.createElement(React.Fragment, null,
            React.createElement("button", { onClick: onPlayPauseToggle, className: "p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors", title: isPlaying ? 'Pause' : 'Play' }, isPlaying ? React.createElement(Pause, { className: "w-5 h-5" }) : React.createElement(Play, { className: "w-5 h-5" })),
            React.createElement("select", { value: selectedVoice, onChange: (e) => onVoiceChange(e.target.value), className: "px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent" }, VOICE_OPTIONS.map((voice) => (React.createElement("option", { key: voice.value, value: voice.value },
                voice.name,
                " - ",
                voice.accent))))))));
};
export default VoiceSettings;
