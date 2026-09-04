import React from 'react';
import { Loader2 } from 'lucide-react';
const TweetList = ({ tweets, isLoading, error }) => {
    if (isLoading) {
        return (React.createElement("div", { className: "flex items-center justify-center py-8" },
            React.createElement(Loader2, { className: "w-8 h-8 animate-spin text-indigo-500" })));
    }
    if (error) {
        return (React.createElement("div", { className: "text-red-500 dark:text-red-400 text-sm" }, error));
    }
    return (React.createElement("div", { className: "space-y-3" }, tweets.map((tweet, index) => (React.createElement("div", { key: index, className: "p-4 bg-gray-50 dark:bg-gray-700 rounded-lg" },
        React.createElement("span", { className: "font-medium text-indigo-600 dark:text-indigo-400" },
            index + 1,
            "."),
        ' ',
        React.createElement("span", { className: "text-gray-800 dark:text-gray-200" }, tweet))))));
};
export default TweetList;
