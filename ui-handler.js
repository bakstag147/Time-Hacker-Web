import { 
    currentLevel, 
    reputation, 
    chatContext, 
    fetchLevel, 
    getAIResponse 
} from './game-logic.js';

function updateReputation(newValue) {
    const reputationElement = document.getElementById('reputation');
    if (reputationElement) {
        reputationElement.textContent = newValue;
    }
}

function addReputationChangeMessage(change) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'reputation-change';
    
    if (change > 0) {
        messageDiv.innerHTML = `<span class="positive">+${change} к репутации</span>`;
    } else {
        messageDiv.innerHTML = `<span class="negative">${change} к репутации</span>`;
    }
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addUserMessage(text) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.textContent = text;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addAIMessage(text) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.textContent = text;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addStatusMessage(text, type = 'default') {
    const messagesDiv = document.getElementById('messages');
    if (!messagesDiv) {
        console.error('Messages container not found!');
        return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message status ${type}`;
    messageDiv.textContent = text;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addVictoryMessage(message) {
    const messagesContainer = document.getElementById('messages');
    const victoryDiv = document.createElement('div');
    victoryDiv.className = 'message victory';
    
    const messageText = document.createElement('p');
    messageText.textContent = message;
    victoryDiv.appendChild(messageText);
    
    const nextLevelButton = document.createElement('button');
    nextLevelButton.textContent = 'Следующий уровень';
    nextLevelButton.className = 'next-level-button';
    nextLevelButton.onclick = async () => {
        currentLevel++;
        await initGame();
    };
    victoryDiv.appendChild(nextLevelButton);
    
    messagesContainer.appendChild(victoryDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendToAI(message) {
    try {
        chatContext.addMessage({
            role: 'user',
            content: message
        });

        const aiResponse = await getAIResponse(message);
        
        const reputationMatch = aiResponse.match(/\*REPUTATION:(\d+)\*/);
        if (reputationMatch) {
            const newReputation = parseInt(reputationMatch[1]);
            const reputationElement = document.querySelector('#reputation');
            if (reputationElement) {
                const oldReputation = parseInt(reputationElement.textContent || 0);
                reputationElement.textContent = newReputation;
                
                const change = newReputation - oldReputation;
                if (change !== 0) {
                    addReputationChangeMessage(change);
                }
            }
        }

        const cleanResponse = aiResponse.replace(/\*REPUTATION:\d+\*/, '').trim();
        
        chatContext.addMessage({
            role: 'assistant',
            content: aiResponse
        });

        addAIMessage(cleanResponse);

        const level = await fetchLevel(currentLevel);
        if (level.victoryConditions && 
            level.victoryConditions.some(condition => 
                cleanResponse.includes(condition)
            )) {
            addVictoryMessage(level.victoryMessage || 'Уровень пройден!');
        }

        return cleanResponse;
    } catch (error) {
        console.error('Error in sendToAI:', error);
        addStatusMessage('Ошибка: ' + error.message);
        throw error;
    }
}

async function initGame() {
    try {
        const level = await fetchLevel(currentLevel);
        
        const levelInfo = document.querySelector('#level-info span:first-child');
        const reputationSpan = document.querySelector('#reputation');
        const messagesContainer = document.getElementById('messages');

        if (levelInfo) {
            levelInfo.textContent = `Уровень ${currentLevel}`;
        }
        if (reputationSpan) {
            reputationSpan.textContent = '50';
        }
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        
        chatContext.clearContext();
        
        if (level.title) {
            addStatusMessage(level.title);
        }
        if (level.description) {
            addStatusMessage(level.description);
        }
        if (level.initialMessage) {
            addAIMessage(level.initialMessage);
            chatContext.addMessage({
                role: 'assistant',
                content: level.initialMessage
            });
        }
    } catch (error) {
        console.error('Error initializing game:', error);
        addStatusMessage('Ошибка инициализации: ' + error.message);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        messages: document.getElementById('messages'),
        messageInput: document.getElementById('message-input'),
        sendButton: document.getElementById('send-button'),
        reputation: document.getElementById('reputation'),
        restartButton: document.getElementById('restart-button')
    };

    if (Object.values(elements).some(el => !el)) {
        console.error('Some elements are missing');
        return;
    }

    async function handleSendMessage() {
        const message = elements.messageInput.value.trim();
        if (message) {
            elements.messageInput.value = '';
            addUserMessage(message);
            try {
                await sendToAI(message);
            } catch (error) {
                addStatusMessage('Произошла ошибка при отправке сообщения');
            }
        }
    }

    elements.sendButton.addEventListener('click', handleSendMessage);
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    elements.restartButton.addEventListener('click', () => {
        chatContext.clearContext();
        elements.messages.innerHTML = '';
        initGame();
    });

    elements.messages.addEventListener('touchmove', (e) => {
        e.stopPropagation();
    }, { passive: true });

    initGame();
});

window.addEventListener('resize', () => {
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);
});
