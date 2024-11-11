const API_URL = 'https://gg40e4wjm2.execute-api.eu-north-1.amazonaws.com/prod';
let currentLevel = 1;
let reputation = 50;
let cachedInstruct = null;
let chatContext;

class ChatContext {
    constructor(systemBasePrompt) {
        this.systemBasePrompt = systemBasePrompt;
        this.messages = [{
            role: 'system',
            content: this.systemBasePrompt
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
            content: this.systemBasePrompt
        }];
    }
}

async function initializeChatContext() {
    try {
        const systemBasePrompt = await getGeneralInstruct();
        chatContext = new ChatContext(systemBasePrompt);
        return chatContext;
    } catch (error) {
        console.error('Failed to initialize chat context:', error);
        throw error;
    }
}

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

async function getGeneralInstruct() {
    try {
        if (cachedInstruct) {
            console.log('Using cached instruct:', cachedInstruct);
            return cachedInstruct;
        }

        const response = await fetch(`${API_URL}/getGeneralInstruct`);
        const text = await response.text();
        console.log('Received general instruct:', text);
        
        if (!text) {
            throw new Error('Empty response from API');
        }

        cachedInstruct = text;
        return text;
    } catch (error) {
        console.error('Error fetching general instructions:', error);
        throw error;
    }
}

async function getAIResponse(message) {
    try {
        console.log('Sending messages to AI:', chatContext.getMessages());

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
        console.log('Received AI response:', content);
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
    getAIResponse,
    getGeneralInstruct,
    initializeChatContext
};
