import React from 'react';
import { Search } from 'lucide-react';
const SearchBar = ({ value, onChange, placeholder = "Search personas..." }) => {
    return (React.createElement("div", { className: "relative max-w-2xl mx-auto" },
        React.createElement("div", { className: "absolute inset-y-0 left-3 flex items-center pointer-events-none" },
            React.createElement(Search, { className: "h-5 w-5 text-gray-400" })),
        React.createElement("input", { type: "text", value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, className: "w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200" })));
};
export default SearchBar;
