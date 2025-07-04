// Customer UI App - Main JavaScript File
class LoyaltyApp {
    constructor() {
        this.apiUrl = 'http://localhost:8000';
        this.currentPhoneNumber = null;
        this.chatHistory = [];
        this.sessionId = this.generateSessionId();
        this.geminiEnabled = false;
        this.availableRewards = [];
        this.selectedReward = null;
        this.init();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async init() {
        this.setupEventListeners();
        this.setupChatWidget();
        this.loadWelcomeMessage();
        
        // Check if Gemini AI is enabled
        await this.checkGeminiStatus();
    }

    async checkGeminiStatus() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            
            this.geminiEnabled = config.geminiEnabled;
            
            if (config.geminiEnabled) {
                console.log('✅ Gemini AI assistant is enabled');
                this.updateChatStatus('🤖 AI Assistant Ready', 'Connected to Gemini 2.5 Flash');
            } else {
                console.log('⚠️ Gemini AI assistant is not configured');
                this.updateChatStatus('🔧 Basic Assistant', 'Configure Gemini API key for enhanced AI');
            }
        } catch (error) {
            console.error('Error checking Gemini status:', error);
            this.updateChatStatus('⚠️ Assistant Limited', 'Network connection issues');
        }
    }

    updateChatStatus(title, subtitle) {
        // Update the chat header to show AI status
        const chatHeader = document.querySelector('#chatWidget .gradient-bg h4');
        if (chatHeader) {
            chatHeader.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-robot text-xl mr-2"></i>
                    <div>
                        <div class="font-semibold">${title}</div>
                        <div class="text-xs opacity-75">${subtitle}</div>
                    </div>
                </div>
            `;
        }
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

        // Reward modal event listeners
        document.getElementById('closeRewardModal').addEventListener('click', () => {
            this.closeRewardModal();
        });

        document.getElementById('cancelRedemption').addEventListener('click', () => {
            this.closeRewardModal();
        });

        document.getElementById('confirmRedemption').addEventListener('click', () => {
            this.confirmRewardRedemption();
        });

        // Close modal when clicking outside
        document.getElementById('rewardModal').addEventListener('click', (e) => {
            if (e.target.id === 'rewardModal') {
                this.closeRewardModal();
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
            await this.loadAvailableRewards(phoneNumber);
            
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

    // Reward functionality
    async loadAvailableRewards(phoneNumber) {
        try {
            const response = await fetch(`${this.apiUrl}/customers/available-rewards/${phoneNumber}`);
            
            if (response.ok) {
                const data = await response.json();
                this.availableRewards = data;
                this.displayAvailableRewards(data);
            }
        } catch (error) {
            console.error('Error loading available rewards:', error);
        }
    }

    displayAvailableRewards(rewards) {
        const container = document.getElementById('rewardsContainer');
        container.innerHTML = '';
        
        if (!rewards || rewards.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i class="fas fa-gift text-xl mb-2"></i>
                    <p>No rewards available at this time.</p>
                </div>
            `;
            return;
        }
        
        rewards.forEach(availableReward => {
            const div = document.createElement('div');
            const canRedeem = availableReward.customer_points >= availableReward.reward.points_required;
            
            div.className = `bg-gradient-to-r ${canRedeem ? 'from-green-50 to-blue-50 border-green-200' : 'from-gray-50 to-red-50 border-red-200'} p-3 rounded-lg border-l-4 transition-all hover:shadow-md`;
            div.innerHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center mb-1">
                            <i class="fas fa-gift ${canRedeem ? 'text-green-600' : 'text-gray-400'} text-sm mr-2"></i>
                            <h4 class="font-semibold text-gray-800 text-sm">${availableReward.reward.name}</h4>
                        </div>
                        <p class="text-xs text-gray-600 mb-2">${availableReward.reward.description}</p>
                        <div class="text-xs text-gray-500">
                            <span class="font-semibold text-blue-600">${availableReward.reward.points_required} pts</span>
                            <span class="mx-1">•</span>
                            <span class="${canRedeem ? 'text-green-600' : 'text-red-600'}">
                                You have: ${availableReward.customer_points} pts
                            </span>
                        </div>
                    </div>
                    <button 
                        onclick="loyaltyApp.openRewardModal(${JSON.stringify(availableReward).replace(/"/g, '&quot;')})"
                        class="ml-2 px-3 py-1 text-xs rounded-full transition-all ${canRedeem ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}"
                        ${!canRedeem ? 'disabled' : ''}
                    >
                        ${canRedeem ? 'Redeem' : 'Insufficient'}
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    openRewardModal(availableReward) {
        this.selectedReward = availableReward;
        const modal = document.getElementById('rewardModal');
        const rewardDetails = document.getElementById('rewardDetails');
        
        rewardDetails.innerHTML = `
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
                <h4 class="font-semibold text-gray-800 mb-2">${availableReward.reward.name}</h4>
                <p class="text-sm text-gray-600 mb-3">${availableReward.reward.description}</p>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-blue-600 font-semibold">${availableReward.reward.points_required} points required</span>
                    <span class="text-green-600 font-semibold">You have: ${availableReward.customer_points} points</span>
                </div>
                <div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <p class="text-xs text-yellow-800">
                        <i class="fas fa-exclamation-triangle mr-1"></i>
                        This will deduct ${availableReward.reward.points_required} points from your account.
                    </p>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    closeRewardModal() {
        const modal = document.getElementById('rewardModal');
        modal.classList.add('hidden');
        this.selectedReward = null;
    }

    async confirmRewardRedemption() {
        if (!this.selectedReward || !this.currentPhoneNumber) {
            return;
        }

        // Show loading state
        const confirmButton = document.getElementById('confirmRedemption');
        confirmButton.disabled = true;
        confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';

        try {
            const response = await fetch(`${this.apiUrl}/customers/redeem-reward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer_phone_number: this.currentPhoneNumber,
                    points_to_redeem: this.selectedReward.reward.points_required,
                    reward_description: this.selectedReward.reward.name,
                    loyalty_program_id: this.selectedReward.reward.loyalty_program_id
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Success - close modal and show success message
                this.closeRewardModal();
                this.showSuccessMessage(`Successfully redeemed ${this.selectedReward.reward.name}!`);
                
                // Refresh the data
                await this.checkPoints();
                
                // Add to chat
                this.addChatMessage(`🎉 Great news! You've successfully redeemed "${this.selectedReward.reward.name}" for ${this.selectedReward.reward.points_required} points!`, 'assistant');
            } else {
                throw new Error(data.detail || 'Failed to redeem reward');
            }
        } catch (error) {
            console.error('Error redeeming reward:', error);
            this.showError('Failed to redeem reward: ' + error.message);
        } finally {
            // Reset button state
            confirmButton.disabled = false;
            confirmButton.innerHTML = '<i class="fas fa-check mr-2"></i>Confirm Redemption';
        }
    }

    showSuccessMessage(message) {
        // Create a success message element
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50';
        successDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-check-circle mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 5000);
    }

    // Chat functionality
    loadWelcomeMessage() {
        // Add enhanced welcome message
        const welcomeMessage = this.geminiEnabled 
            ? '👋 Hi! I\'m your AI-powered loyalty assistant. I can help you check points, get recommendations, redeem rewards, learn about referrals, and answer questions about our loyalty program!'
            : '👋 Hi! I\'m your loyalty assistant. Ask me about your points, rewards, or referrals!';
        
        this.addChatMessage(welcomeMessage, 'assistant');
        
        // Add some example queries
        if (this.geminiEnabled) {
            setTimeout(() => {
                this.addChatMessage('💡 Try asking me:\n• "How many points do I have for +1234567890?"\n• "What rewards can I redeem?"\n• "What are my recent transactions?"\n• "Any recommendations for me?"\n• "How do referrals work?"', 'assistant');
            }, 1000);
        }
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
            // Use the new MCP API endpoint
            const response = await fetch('/api/mcp-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: this.sessionId,
                    context: {
                        phone_number: this.currentPhoneNumber || null
                    }
                })
            });
            
            const data = await response.json();
            
            // Hide typing indicator
            this.showTypingIndicator(false);
            
            if (data.success) {
                // Add assistant response
                this.addChatMessage(data.response, 'assistant');
                this.sessionId = data.sessionId || this.sessionId; // Update session ID if provided
                if (data.context && data.context.phone_number) {
                    this.currentPhoneNumber = data.context.phone_number;
                }
            } else {
                this.addChatMessage(data.error || 'Sorry, I encountered an error. Please try again later.', 'assistant');
            }
            
        } catch (error) {
            this.showTypingIndicator(false);
            this.addChatMessage('Sorry, I encountered an error connecting to the chat service. Please try again later.', 'assistant');
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.loyaltyApp = new LoyaltyApp();
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
