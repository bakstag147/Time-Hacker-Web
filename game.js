document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM fully loaded');
    console.log('🔍 Checking elements:');
    console.log('messages:', document.getElementById('messages'));
    console.log('message-input:', document.getElementById('message-input'));
    console.log('send-button:', document.getElementById('send-button'));
    console.log('reputation:', document.getElementById('reputation'));
    
    // Весь остальной код оставьте как есть, но перенесите его внутрь этой функции
    const API_URL = 'https://gg40e4wjm2.execute-api.eu-north-1.amazonaws.com/prod';
    let currentLevel = 1;
    let messages = [];
    let reputation = 0;

    // Инициализация игры
    async function initGame() {
        console.log('🎮 Starting game initialization...');
        try {
            console.log('📱 Starting to load level:', currentLevel);
            const level = await fetchLevel(currentLevel);
            console.log('✅ Level loaded successfully:', level);
            
            // Проверяем структуру данных
            if (!level.number || !level.title) {
                console.error('❌ Invalid level data:', level);
                throw new Error('Invalid level data structure');
            }
            
            // Обновляем UI
            document.getElementById('level-info').textContent = `Уровень ${level.number}`;
            
            // Добавляем сообщения
            addStatusMessage(`Уровень ${level.number}: ${level.title}`);
            addStatusMessage(level.description);
            addStatusMessage(level.sceneDescription);
            addAIMessage(level.initialMessage);
        } catch (error) {
            console.error('❌ Error initializing game:', error);
            addStatusMessage('Ошибка загрузки уровня: ' + error.message);
        }
    }

    // Получение уровня с сервера
    async function fetchLevel(levelNumber) {
        console.log('🌐 Fetching level content from API...');
        try {
            const url = `${API_URL}/levels`;
            console.log('📡 Request URL:', url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ level: levelNumber })
            });
            
            console.log('📥 Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📦 Level data:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching level:', error);
            throw error;
        }
    }

    // Отправка сообщения AI
    async function sendToAI(userMessage) {
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
            },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();
        return data.message;
    }

    // UI функции
    function addMessage(content, isUser = false, type = 'message') {
        const messagesDiv = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        
        if (type === 'status') {
            messageDiv.className = 'status-message';
        } else {
            messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        }
        
        messageDiv.textContent = content;
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function addUserMessage(content) {
        addMessage(content, true);
    }

    function addAIMessage(content) {
        addMessage(content, false);
    }

    function addStatusMessage(content) {
        addMessage(content, false, 'status');
    }

    function updateReputation(value) {
        reputation = value;
        document.getElementById('reputation').textContent = reputation;
    }

    // Обработчики событий
    document.getElementById('send-button').addEventListener('click', async () => {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        input.value = '';
        addUserMessage(message);
        
        try {
            const response = await sendToAI(message);
            
            // Проверяем наличие изменения репутации
            const reputationMatch = response.match(/\*REPUTATION:(\d+)\*/);
            if (reputationMatch) {
                updateReputation(parseInt(reputationMatch[1]));
            }
            
            // Очищаем отет от метки репутации
            const cleanResponse = response.replace(/\*REPUTATION:\d+\*/, '');
            
            // Разбиваем на действия и сообщения
            const parts = cleanResponse.split('*');
            parts.forEach((part, index) => {
                const trimmedPart = part.trim();
                if (trimmedPart) {
                    if (index % 2 === 1) {
                        addStatusMessage(trimmedPart);
                    } else {
                        addAIMessage(trimmedPart);
                    }
                }
            });
            
            // Проверяем условие победы
            const level = await fetchLevel(currentLevel);
            if (level.victoryConditions.some(condition => response.includes(condition))) {
                addStatusMessage(level.victoryMessage);
                if (currentLevel < 10) {
                    currentLevel++;
                    setTimeout(() => initGame(), 2000);
                } else {
                    addStatusMessage('🎉 Поздравляем! Вы прошли игру!');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            addStatusMessage('Произошла ошибка при отправке сообщения');
        }
    });

    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('send-button').click();
        }
    });

    // Запуск игры
    initGame();
}); 