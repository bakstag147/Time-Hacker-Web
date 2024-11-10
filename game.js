const API_URL = 'https://gg40e4wjm2.execute-api.eu-north-1.amazonaws.com/prod';
let currentLevel = 1;
let messages = [];
let reputation = 0;

// Инициализация игры
async function initGame() {
    console.log('Initializing game...');
    try {
        const level = await fetchLevel(currentLevel);
        console.log('Level loaded:', level);
        addStatusMessage(`Уровень ${level.number}: ${level.title}`);
        addStatusMessage(level.description);
        addStatusMessage(level.sceneDescription);
        addAIMessage(level.initialMessage);
    } catch (error) {
        console.error('Error initializing game:', error);
        addStatusMessage('Ошибка загрузки уровня: ' + error.message);
    }
}

// Получение уровня с сервера
async function fetchLevel(levelNumber) {
    console.log('Fetching level:', levelNumber);
    try {
        const response = await fetch(`${API_URL}/levels`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://bakstag147.github.io'
            },
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ level: levelNumber })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Level data:', data);
        
        // Проверяем, является ли data.body строкой
        if (typeof data.body === 'string') {
            return JSON.parse(data.body);
        }
        return data.body;
    } catch (error) {
        console.error('Error in fetchLevel:', error);
        throw error;
    }
}

// Отправка сообщения AI
async function sendToAI(userMessage) {
    try {
        const level = await fetchLevel(currentLevel);
        
        const messages = [
            {
                role: 'system',
                content: level.systemPrompt
            },
            {
                role: 'user',
                content: userMessage
            }
        ];

        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://bakstag147.github.io'
            },
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ messages })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.message;
    } catch (error) {
        console.error('Error in sendToAI:', error);
        throw error;
    }
}