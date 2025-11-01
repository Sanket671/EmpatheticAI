class EmpatheticAI {
    constructor() {
        this.webcamHandler = null;
        this.isProcessing = false;
        this.backendURL = 'http://localhost:5000';
        
        console.log('🚀 EmpatheticAI initializing...');
        
        // Initialize after short delay
        setTimeout(() => {
            this.initialize();
        }, 500);
    }

    initialize() {
        console.log('🎯 Initializing EmpatheticAI components...');
        
        try {
            this.webcamHandler = new WebcamHandler();
            this.initializeEventListeners();
            this.checkBackendConnection();
            
            console.log('✅ EmpatheticAI initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize EmpatheticAI:', error);
        }
    }

    initializeEventListeners() {
        console.log('🔗 Setting up event listeners...');
        
        try {
            // Send button
            const sendButton = document.getElementById('send-btn');
            if (sendButton) {
                sendButton.addEventListener('click', () => this.handleUserInput());
            }
            
            // Enter key in input
            const userInput = document.getElementById('user-input');
            if (userInput) {
                userInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleUserInput();
                    }
                });
            }

            // Camera toggle
            const cameraButton = document.getElementById('toggle-camera');
            if (cameraButton) {
                cameraButton.addEventListener('click', () => this.toggleCamera());
            }
            
            console.log('✅ Event listeners set up');
            
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }
    }

    async checkBackendConnection() {
        try {
            console.log('🔌 Checking backend connection...');
            const response = await fetch(`${this.backendURL}/health`);
            
            if (response.ok) {
                console.log('✅ Backend connection successful');
            } else {
                console.warn('⚠️ Backend connection issues');
            }
        } catch (error) {
            console.error('❌ Cannot connect to backend:', error);
            this.addMessage("I'm having trouble connecting to my analysis engine. Please make sure the backend server is running on port 5000.", 'bot');
        }
    }

    async toggleCamera() {
        if (!this.webcamHandler) {
            console.error('❌ Webcam handler not initialized');
            return;
        }

        const button = document.getElementById('toggle-camera');
        if (!button) return;
        
        if (!this.webcamHandler.isCameraOn) {
            console.log('🎥 Starting camera...');
            await this.webcamHandler.startCamera();
        } else {
            console.log('🛑 Stopping camera...');
            this.webcamHandler.stopCamera();
        }
    }

    async handleUserInput() {
        if (!this.webcamHandler) {
            console.error('❌ Webcam handler not initialized');
            this.addMessage("I'm not ready yet. Please wait for initialization to complete.", 'bot');
            return;
        }

        const input = document.getElementById('user-input');
        if (!input) {
            console.error('❌ User input element not found');
            return;
        }

        const userText = input.value.trim();

        if (!userText) {
            console.log('ℹ️ No input text provided');
            return;
        }

        if (this.isProcessing) {
            console.log('⏳ Already processing a request');
            return;
        }

        console.log('💬 Processing user input:', userText);

        // Add user message to chat
        this.addMessage(userText, 'user');
        input.value = '';
        
        // Set processing flag and show loading
        this.isProcessing = true;
        this.showLoading(true);

        try {
            // Get current facial emotion
            const facialEmotionData = this.webcamHandler.getCurrentEmotion();
            console.log('😊 Facial emotion data:', facialEmotionData);
            
            // Send to backend for analysis
            const response = await this.analyzeEmotions(userText, facialEmotionData);
            console.log('📨 Backend response received');
            
            if (response.status === 'success') {
                // Add bot response
                this.addMessage(response.response, 'bot');
                
                // Update analysis results
                this.updateAnalysisResults(response);
                
                // Show music recommendation
                if (response.song_recommendation) {
                    this.showMusicRecommendation(response.song_recommendation);
                }
                
                console.log('✅ Analysis completed successfully');
            } else {
                throw new Error(response.error || 'Analysis failed');
            }

        } catch (error) {
            console.error('❌ Error in analysis:', error);
            this.addMessage("I apologize, but I'm having trouble processing your emotions right now. Please try again later.", 'bot');
        } finally {
            // Always hide loading and reset processing flag
            this.isProcessing = false;
            this.showLoading(false);
            console.log('🔄 Reset processing state');
        }
    }

    async analyzeEmotions(text, facialEmotionData) {
        const payload = {
            text: text,
            facial_emotion: facialEmotionData.emotion,
            face_confidence: facialEmotionData.confidence
        };

        console.log('📤 Sending to backend...');

        const response = await fetch(`${this.backendURL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    addMessage(text, sender) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    updateAnalysisResults(data) {
        console.log('📊 Updating analysis results...');
        
        try {
            // Text sentiment
            const textSentimentElement = document.getElementById('text-sentiment');
            const textConfidenceElement = document.getElementById('text-confidence')?.querySelector('.confidence-fill');
            
            if (textSentimentElement) {
                textSentimentElement.textContent = this.capitalizeFirst(data.text_sentiment);
            }
            if (textConfidenceElement) {
                textConfidenceElement.style.width = `${data.text_confidence * 100}%`;
            }

            // Facial emotion
            const facialEmotionElement = document.getElementById('facial-emotion');
            const faceConfidenceElement = document.getElementById('face-confidence')?.querySelector('.confidence-fill');
            
            if (facialEmotionElement) {
                facialEmotionElement.textContent = this.capitalizeFirst(data.facial_emotion);
            }
            if (faceConfidenceElement) {
                faceConfidenceElement.style.width = `${data.face_confidence * 100}%`;
            }

            // Final emotion
            const finalEmotionElement = document.getElementById('final-emotion');
            if (finalEmotionElement) {
                finalEmotionElement.textContent = this.capitalizeFirst(data.final_emotion);
            }
            
            // Emotion emoji
            const emoji = this.getEmotionEmoji(data.final_emotion);
            const emojiElement = document.getElementById('emotion-emoji');
            if (emojiElement) {
                emojiElement.textContent = emoji;
            }
            
        } catch (error) {
            console.error('❌ Error updating analysis:', error);
        }
    }

    getEmotionEmoji(emotion) {
        const emojiMap = {
            'happy': '😊',
            'sad': '😢',
            'angry': '😠',
            'fear': '😨',
            'disgust': '🤢',
            'surprise': '😲',
            'neutral': '😐',
            'positive': '😊',
            'negative': '😔'
        };
        return emojiMap[emotion] || '😊';
    }

    showMusicRecommendation(song) {
        const musicSection = document.getElementById('music-recommendation');
        if (!musicSection) return;

        console.log('🎵 Showing music recommendation');

        document.getElementById('song-title').textContent = song.title;
        document.getElementById('song-artist').textContent = song.artist;
        document.getElementById('song-genre').textContent = song.genre;
        document.getElementById('spotify-link').href = song.spotify_link;
        
        musicSection.classList.remove('hidden');
        
        // Scroll to recommendation
        setTimeout(() => {
            musicSection.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            console.error('❌ Loading overlay not found');
            return;
        }

        try {
            if (show) {
                overlay.classList.remove('hidden');
                console.log('🔄 Showing loading overlay');
            } else {
                overlay.classList.add('hidden');
                console.log('✅ Hiding loading overlay');
            }
        } catch (error) {
            console.error('❌ Error toggling loading overlay:', error);
        }
    }

    capitalizeFirst(string) {
        return string ? string.charAt(0).toUpperCase() + string.slice(1) : 'Unknown';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 DOM fully loaded, starting EmpatheticAI...');
    window.empatheticAI = new EmpatheticAI();
});