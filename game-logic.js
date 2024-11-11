import { systemBasePrompt } from './gpt-instructions.js';

const API_URL = 'https://gg40e4wjm2.execute-api.eu-north-1.amazonaws.com/prod';
let currentLevel = 1;
let reputation = 50;

class ChatContext {
    constructor() {
        this.messages = [{
            role: 'system',
            content: systemBasePrompt
        }];
    }

    addMessage(message) {
        this.messages.push(message);
    }

    getMessages() {
        return this.messages;
    }

    clearContext() {
        this.messages = [{
            role: 'system',
            content: systemBasePrompt
        }];
    }
}

const chatContext = new ChatContext();

async function fetchLevel(levelNumber) {
    try {
        const response = await fetch(`${API_URL}/levels`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://bakstag147.github.io'
            },
            body: JSON.stringify({ level: levelNumber }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        const levelData = JSON.parse(responseData.body);
        return levelData;
        
    } catch (error) {
        console.error('Error fetching level:', error);
        throw error;
    }
}

async function getAIResponse(message) {
    try {
        const response = await fetch(`${API_URL}/game/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: chatContext.getMessages()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        const content = JSON.parse(responseData.body).content;
        return content;

    } catch (error) {
        console.error('Error getting AI response:', error);
        throw error;
    }
}

export { 
    currentLevel, 
    reputation, 
    chatContext, 
    fetchLevel, 
    getAIResponse 
};
