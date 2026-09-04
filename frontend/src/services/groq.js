import { API_BASE_URL } from '../config';
export class ChatError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'ChatError';
    }
}
const MAX_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_PROMPT_LENGTH = 8000;
const truncateMessage = (message, maxLength) => {
    if (message.length <= maxLength)
        return message;
    return message.slice(0, maxLength - 3) + '...';
};
const prepareMessages = (personaPrompt, conversationHistory, userMessage) => {
    const truncatedPrompt = truncateMessage(personaPrompt, MAX_PROMPT_LENGTH);
    const recentMessages = conversationHistory
        .slice(-MAX_MESSAGES)
        .map(msg => ({
        ...msg,
        content: truncateMessage(msg.content, MAX_MESSAGE_LENGTH)
    }));
    return [
        { role: 'system', content: truncatedPrompt },
        ...recentMessages,
        { role: 'user', content: truncateMessage(userMessage, MAX_MESSAGE_LENGTH) }
    ];
};
export const generateChatResponse = async (personaPrompt, conversationHistory, userMessage) => {
    try {
        const messages = prepareMessages(personaPrompt, conversationHistory, userMessage);
        // Call our backend proxy instead of using the Groq SDK directly in the browser
        const res = await fetch(`${API_BASE_URL}/api2/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages })
        });
        let data;
        try {
            data = await res.json();
        } catch {
            throw new ChatError('AI service returned an unexpected response. Please try again.');
        }
        if (!res.ok) {
            throw new ChatError(data.error || 'Failed to generate response from server');
        }
        const response = data.answer;
        if (!response) {
            throw new ChatError('Invalid response format from API');
        }
        return response;
    }
    catch (error) {
        if (error instanceof ChatError)
            throw error;
        let userFriendlyMessage = 'Failed to generate response. ';
        userFriendlyMessage += error.message || 'An unexpected error occurred';
        throw new ChatError(userFriendlyMessage, error);
    }
};
