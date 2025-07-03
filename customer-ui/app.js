// Customer UI App - Main JavaScript File
class LoyaltyApp {
    constructor() {
        this.apiUrl = 'http://localhost:8000';
        this.currentPhoneNumber = null;
        this.chatHistory = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupChatWidget();
        this.loadWelcomeMessage();
    }

    setupEventListeners() {
        // Points form submission
        document.getElementById('checkPointsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.checkPoints();
        });

        // Chat form submission
        document.getElementById('chatForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendChatMessage();
        });

        // Chat widget toggle
        document.getElementById('chatToggle').addEventListener('click', () => {
            this.toggleChatWidget();
        });

        document.getElementById('chatToggleBtn').addEventListener('click', () => {
            this.toggleChatWidget();
        });

        document.getElementById('closeChatBtn').addEventListener('click', () => {
            this.toggleChatWidget();
        });

        // Enter key in phone number input
        document.getElementById('phone_number').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.checkPoints();
            }
        });
    }

    setupChatWidget() {
        // Initially hide the chat widget
        const chatWidget = document.getElementById('chatWidget');
        const chatToggleBtn = document.getElementById('chatToggleBtn');
        
        chatWidget.classList.add('closed');
        chatToggleBtn.style.display = 'flex';
    }

    toggleChatWidget() {
        const chatWidget = document.getElementById('chatWidget');
        const chatToggleBtn = document.getElementById('chatToggleBtn');
        
        if (chatWidget.classList.contains('closed')) {
            chatWidget.classList.remove('closed');
            chatToggleBtn.style.display = 'none';
        } else {
            chatWidget.classList.add('closed');
            chatToggleBtn.style.display = 'flex';
        }
    }

    async checkPoints() {
        const phoneNumber = document.getElementById('phone_number').value.trim();
        
        if (!this.validatePhoneNumber(phoneNumber)) {
            this.showError('Please enter a valid phone number (9-15 digits)');
            return;
        }

        this.showLoading(true);
        this.hideError();
        
        try {
            const response = await fetch(`${this.apiUrl}/customers/points/${phoneNumber}`);
            
            if (!response.ok) {
                throw new Error('Customer not found or has no points');
            }
            
            const data = await response.json();
            this.currentPhoneNumber = phoneNumber;
            this.displayResults(data);
            await this.loadRecommendations(phoneNumber);
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    validatePhoneNumber(phoneNumber) {
        const phoneRegex = /^\+?\d{9,15}$/;
        return phoneRegex.test(phoneNumber);
    }

    showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        const resultsSection = document.getElementById('resultsSection');
        
        if (show) {
            loadingState.classList.remove('hidden');
            resultsSection.classList.add('hidden');
        } else {
            loadingState.classList.add('hidden');
        }
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.classList.add('hidden');
    }

    displayResults(data) {
        const resultsSection = document.getElementById('resultsSection');
        const totalPoints = document.getElementById('totalPoints');
        const pointsEarned = document.getElementById('pointsEarned');
        const pointsRedeemed = document.getElementById('pointsRedeemed');
        const transactionsContainer = document.getElementById('transactionsContainer');
        
        // Display total points
        totalPoints.textContent = data.total_points.toLocaleString();
        
        // Calculate earned vs redeemed points
        let earned = 0;
        let redeemed = 0;
        
        if (data.recent_transactions) {
            data.recent_transactions.forEach(transaction => {
                if (transaction.points_earned > 0) {
                    earned += transaction.points_earned;
                } else {
                    redeemed += Math.abs(transaction.points_earned);
                }
            });
        }
        
        pointsEarned.textContent = earned.toLocaleString();
        pointsRedeemed.textContent = redeemed.toLocaleString();
        
        // Display transactions
        this.displayTransactions(data.recent_transactions);
        
        resultsSection.classList.remove('hidden');
    }

    displayTransactions(transactions) {
        const container = document.getElementById('transactionsContainer');
        container.innerHTML = '';
        
        if (!transactions || transactions.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-receipt text-2xl mb-2"></i>
                    <p>No recent transactions found.</p>
                </div>
            `;
            return;
        }
        
        transactions.forEach(transaction => {
            const transactionElement = this.createTransactionElement(transaction);
            container.appendChild(transactionElement);
        });
    }

    createTransactionElement(transaction) {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
        
        const isRedemption = transaction.points_earned < 0;
        const pointsClass = isRedemption ? 'text-red-600' : 'text-green-600';
        const icon = isRedemption ? 'fas fa-gift' : 'fas fa-plus-circle';
        
        div.innerHTML = `
            <div class="flex items-center">
                <i class="${icon} ${pointsClass} text-lg mr-3"></i>
                <div>
                    <p class="font-medium text-gray-800">${transaction.business_name}</p>
                    <p class="text-sm text-gray-600">${new Date(transaction.timestamp).toLocaleDateString()}</p>
                    ${transaction.reward_description ? `<p class="text-xs text-gray-500 italic">${transaction.reward_description}</p>` : ''}
                </div>
            </div>
            <div class="text-right">
                <p class="font-semibold ${pointsClass}">
                    ${isRedemption ? '' : '+'}${transaction.points_earned} pts
                </p>
                ${transaction.amount_spent > 0 ? `<p class="text-xs text-gray-500">$${transaction.amount_spent.toFixed(2)}</p>` : ''}
            </div>
        `;
        
        return div;
    }

    async loadRecommendations(phoneNumber) {
        try {
            const response = await fetch(`${this.apiUrl}/customers/recommendations/${phoneNumber}`);
            
            if (response.ok) {
                const data = await response.json();
                this.displayRecommendations(data.recommendations);
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
        }
    }

    displayRecommendations(recommendations) {
        const container = document.getElementById('recommendationsContainer');
        container.innerHTML = '';
        
        if (!recommendations || recommendations.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i class="fas fa-info-circle text-xl mb-2"></i>
                    <p>No recommendations available.</p>
                </div>
            `;
            return;
        }
        
        recommendations.forEach((recommendation, index) => {
            const div = document.createElement('div');
            div.className = 'bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border-l-4 border-purple-400';
            div.innerHTML = `
                <div class="flex items-start">
                    <i class="fas fa-magic text-purple-600 text-sm mr-2 mt-1"></i>
                    <p class="text-sm text-gray-700">${recommendation}</p>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // Chat functionality
    loadWelcomeMessage() {
        // Already loaded in HTML
    }

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addChatMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        this.showTypingIndicator(true);
        
        try {
            // Process the message with our LLM-powered assistant
            const response = await this.processLLMQuery(message);
            
            // Hide typing indicator
            this.showTypingIndicator(false);
            
            // Add assistant response
            this.addChatMessage(response, 'assistant');
            
        } catch (error) {
            this.showTypingIndicator(false);
            this.addChatMessage('Sorry, I encountered an error. Please try again later.', 'assistant');
        }
    }

    addChatMessage(message, type) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-bubble';
        
        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="flex justify-end">
                    <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-3 max-w-xs">
                        <p class="text-sm">${message}</p>
                    </div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="bg-gray-100 rounded-lg p-3 max-w-xs">
                    <p class="text-sm">${message}</p>
                </div>
            `;
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showTypingIndicator(show) {
        const typingIndicator = document.getElementById('typingIndicator');
        if (show) {
            typingIndicator.classList.remove('hidden');
        } else {
            typingIndicator.classList.add('hidden');
        }
    }

    async processLLMQuery(query) {
        // This is where we implement the LLM-powered conversational assistant
        // For now, we'll use rule-based responses that can query the API
        
        const lowerQuery = query.toLowerCase();
        
        // Points-related queries
        if (lowerQuery.includes('points') || lowerQuery.includes('balance')) {
            return await this.handlePointsQuery(query);
        }
        
        // Transactions-related queries
        if (lowerQuery.includes('transaction') || lowerQuery.includes('history') || lowerQuery.includes('recent')) {
            return await this.handleTransactionsQuery(query);
        }
        
        // Recommendations-related queries
        if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('offer')) {
            return await this.handleRecommendationsQuery(query);
        }
        
        // Referrals-related queries
        if (lowerQuery.includes('referral') || lowerQuery.includes('refer') || lowerQuery.includes('friend')) {
            return await this.handleReferralQuery(query);
        }
        
        // General help
        if (lowerQuery.includes('help') || lowerQuery.includes('what can you do')) {
            return this.getHelpMessage();
        }
        
        // Default response with context-aware suggestions
        return this.getContextualResponse(query);
    }

    async handlePointsQuery(query) {
        const phoneRegex = /(\+?\d{9,15})/;
        const phoneMatch = query.match(phoneRegex);
        
        if (phoneMatch) {
            const phoneNumber = phoneMatch[1];
            try {
                const response = await fetch(`${this.apiUrl}/customers/points/${phoneNumber}`);
                if (response.ok) {
                    const data = await response.json();
                    return `📊 You have ${data.total_points.toLocaleString()} points! ${data.total_points > 100 ? '🎉 You\'re doing great!' : '💪 Keep earning to unlock more rewards!'}`;
                }
            } catch (error) {
                return '❌ Sorry, I couldn\'t find that phone number in our system. Please check your number and try again.';
            }
        }
        
        if (this.currentPhoneNumber) {
            const totalPoints = document.getElementById('totalPoints').textContent;
            return `📊 Based on your current lookup, you have ${totalPoints} points! Would you like me to check for any new recommendations?`;
        }
        
        return '📱 To check your points, please provide your phone number or use the form above to look up your balance.';
    }

    async handleTransactionsQuery(query) {
        if (!this.currentPhoneNumber) {
            return '📱 Please first check your points using your phone number, then I can help you with your transaction history.';
        }
        
        const transactionsContainer = document.getElementById('transactionsContainer');
        const transactions = transactionsContainer.children.length;
        
        if (transactions === 0) {
            return '📝 You don\'t have any recent transactions. Start shopping at our partner businesses to earn points!';
        }
        
        return `📝 You have ${transactions} recent transactions. Your latest activity shows both points earned and redeemed. Check the main panel for detailed transaction history!`;
    }

    async handleRecommendationsQuery(query) {
        if (!this.currentPhoneNumber) {
            return '📱 Please first check your points using your phone number, then I can provide personalized recommendations.';
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/customers/recommendations/${this.currentPhoneNumber}`);
            if (response.ok) {
                const data = await response.json();
                if (data.recommendations && data.recommendations.length > 0) {
                    const topRecommendation = data.recommendations[0];
                    return `💡 Here's a personalized recommendation for you: ${topRecommendation}\n\nCheck the recommendations panel for more suggestions!`;
                }
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        }
        
        return '💡 I don\'t have specific recommendations right now, but keep earning points and I\'ll have personalized suggestions for you!';
    }

    async handleReferralQuery(query) {
        if (query.toLowerCase().includes('how') || query.toLowerCase().includes('work')) {
            return '👥 Referrals are easy! When you refer a friend:\n1. They mention your phone number when they first shop\n2. You both earn bonus points!\n3. Help your friends discover great local businesses\n\nSpread the word and earn together! 🎉';
        }
        
        return '👥 Want to refer friends? Just ask them to mention your phone number when they make their first purchase at any partner business. You\'ll both earn bonus points! 🎉';
    }

    getHelpMessage() {
        return `🤖 I'm your loyalty assistant! I can help you with:

📊 Check your points balance
📝 Review transaction history  
💡 Get personalized recommendations
👥 Learn about referral programs
🎁 Find available rewards

Just ask me naturally! For example:
"How many points do I have?"
"What are my recent transactions?"
"Any recommendations for me?"
"How do referrals work?"

How can I help you today? 😊`;
    }

    getContextualResponse(query) {
        const responses = [
            '🤔 I\'m not sure about that specific question, but I can help you with points, transactions, recommendations, and referrals!',
            '💭 That\'s an interesting question! I specialize in helping with loyalty program questions. Try asking about your points or recommendations!',
            '🎯 I\'m here to help with your loyalty rewards! Ask me about your points balance, transaction history, or referral opportunities.',
            '✨ I didn\'t quite understand that, but I\'m great at helping with loyalty program questions! What would you like to know about your rewards?'
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoyaltyApp();
});

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatPoints(points) {
    return points.toLocaleString();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}
