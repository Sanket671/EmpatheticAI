class EmpatheticAI {
    constructor() {
        this.webcamHandler = null;
        this.isProcessing = false;
        this.backendURL = 'http://localhost:5000';
        
        console.log('🚀 EmpatheticAI initializing...');
        this.initialize();
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
        
        // Send button
        const sendButton = document.getElementById('send-btn');
        if (sendButton) {
            sendButton.addEventListener('click', () => this.handleUserInput());
        } else {
            console.error('❌ Send button not found');
        }
        
        // Enter key in input
        const userInput = document.getElementById('user-input');
        if (userInput) {
            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleUserInput();
                }
            });
        } else {
            console.error('❌ User input not found');
        }

        // Camera toggle
        const cameraButton = document.getElementById('toggle-camera');
        if (cameraButton) {
            cameraButton.addEventListener('click', () => this.toggleCamera());
        } else {
            console.error('❌ Camera button not found');
        }
        
        console.log('✅ Event listeners set up');
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
        
        this.isProcessing = true;
        this.showLoading(true);

        try {
            const facialEmotionData = this.webcamHandler.getCurrentEmotion();
            console.log('😊 Facial emotion data:', facialEmotionData);
            
            const response = await this.analyzeEmotions(userText, facialEmotionData);
            console.log('📨 Backend response received:', response);
            
            if (response.status === 'success') {
                this.addMessage(response.response, 'bot');
                this.updateAnalysisResults(response);
                this.updateDecisionBreakdown(response);
                
                if (response.song_recommendation) {
                    this.showMusicRecommendation(response.song_recommendation);
                }
                
                console.log('✅ Analysis completed successfully');
            } else {
                throw new Error(response.error || 'Analysis failed');
            }

        } catch (error) {
            console.error('❌ Error in analysis:', error);
            this.addMessage("I apologize, but I'm having trouble processing your emotions right now. Please try again.", 'bot');
        } finally {
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

        console.log('📤 Sending to backend...', payload);

        const response = await fetch(`${this.backendURL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        return await response.json();
    }

    updateDecisionBreakdown(data) {
        console.log('📊 Updating decision breakdown...', data);
        
        const breakdownDiv = document.getElementById('decision-breakdown');
        if (!breakdownDiv) {
            console.error('❌ Decision breakdown element not found');
            return;
        }

        // CRITICAL FIX: Force display BEFORE removing hidden class
        breakdownDiv.style.display = 'block';
        breakdownDiv.classList.remove('hidden');

        if (!data.fusion_data) {
            console.warn('⚠️ No fusion data in response');
            return;
        }

        const fusion = data.fusion_data;
        
        // Update weight displays
        this.updateElement('text-weight', `${(fusion.text_weight * 100).toFixed(1)}%`);
        this.updateElement('face-weight', `${(fusion.face_weight * 100).toFixed(1)}%`);
        
        // Update weight bars
        this.updateElementStyle('text-weight-fill', 'width', `${fusion.text_weight * 100}%`);
        this.updateElementStyle('face-weight-fill', 'width', `${fusion.face_weight * 100}%`);
        
        // Update reliability
        this.updateElement('text-reliability', `${(fusion.text_reliability * 100).toFixed(1)}%`);
        this.updateElement('face-reliability', `${(fusion.face_reliability * 100).toFixed(1)}%`);
        
        // Update decision reason
        const reasonText = this.formatDecisionReason(data.decision_reason, fusion.decision_context);
        this.updateElement('decision-reason', `<strong>Decision Context:</strong> ${reasonText}`, true);
        
        // Handle masking alerts
        this.updateMaskingAlerts(fusion, data);
        
        console.log('✅ Decision breakdown updated successfully');
    }

    updateElement(elementId, content, isHTML = false) {
        const element = document.getElementById(elementId);
        if (element) {
            if (isHTML) {
                element.innerHTML = content;
            } else {
                element.textContent = content;
            }
        } else {
            console.error(`❌ Element with id '${elementId}' not found`);
        }
    }

    updateElementStyle(elementId, property, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style[property] = value;
        } else {
            console.error(`❌ Element with id '${elementId}' not found for style update`);
        }
    }

    updateMaskingAlerts(fusion, data) {
        const maskingAlert = document.getElementById('masking-alert');
        const maskingDetails = document.getElementById('masking-details');
        
        if (!maskingAlert || !maskingDetails) {
            console.error('❌ Masking alert elements not found');
            return;
        }

        let maskingText = '';
        
        // Original masking indicators
        if (fusion.masking_indicators && fusion.masking_indicators.length > 0) {
            maskingText = fusion.masking_indicators.map(indicator => 
                `• ${this.formatMaskingIndicator(indicator)}`
            ).join('<br>');
        }
        
        // Enhanced: Add sarcasm detection
        if (data.sarcasm_detected) {
            maskingText += (maskingText ? '<br>' : '') + `• Sarcasm detected (${(data.sarcasm_score * 100).toFixed(1)}% confidence)`;
        }
        
        // Enhanced: Add mixed emotions
        if (data.mixed_emotions) {
            const [primary, secondary] = data.mixed_emotions;
            maskingText += (maskingText ? '<br>' : '') + `• Mixed emotions detected: ${this.capitalizeFirst(primary)} and ${this.capitalizeFirst(secondary)}`;
        }
        
        if (maskingText) {
            maskingAlert.style.display = 'block';
            maskingAlert.classList.remove('hidden');
            maskingDetails.innerHTML = maskingText;
        } else {
            maskingAlert.style.display = 'none';
            maskingAlert.classList.add('hidden');
        }
    }

    formatMaskingIndicator(indicator) {
        const mapping = {
            'strong_negative_text_with_neutral_face': 'Your words show strong emotions but your expression appears neutral',
            'minimization_language_detected': 'You used minimizing language while expressing difficult emotions',
            'incongruent_emojis': 'Positive emojis used in negative context',
            'explicit_masking_statement': 'You mentioned hiding or masking your true feelings',
            'sarcasm_detected': 'Sarcastic tone detected indicating potential emotional masking',
            'mixed_emotions_detected': 'Multiple strong emotions detected simultaneously'
        };
        return mapping[indicator] || indicator;
    }

    formatDecisionReason(reason, context) {
        const mapping = {
            'both_modalities_agree': 'Text and facial analysis agree',
            'text_trusted_potential_masking': 'Text trusted more (possible emotional masking detected)',
            'weighted_combination': 'Combined analysis of both text and facial expression',
            'substantial_text_input': 'Detailed text input given priority',
            'strong_facial_expression': 'Clear facial expression detected',
            'emotional_masking_suspected': 'Possible emotional masking detected',
            'balanced_analysis': 'Balanced consideration of both inputs',
            'high_sarcasm_detected': 'High sarcasm detected - text analysis prioritized',
            'mixed_emotions_detected': 'Mixed emotions detected - complex analysis required',
            'sarcasm_overrides_face': 'Sarcasm detection overrides facial expression',
            'mixed_emotion_resolved': 'Mixed emotions resolved to dominant emotion'
        };
        
        const reasonText = mapping[reason] || reason;
        const contextText = context ? ` - ${context.replace(/_/g, ' ')}` : '';
        
        return reasonText + contextText;
    }

    updateAnalysisResults(data) {
        console.log('📊 Updating analysis results...', data);
        
        // Text emotion
        this.updateElement('text-emotion', this.capitalizeFirst(data.text_emotion));
        this.updateElementStyle('text-confidence-fill', 'width', `${data.text_confidence * 100}%`);

        // Facial emotion
        this.updateElement('facial-emotion', this.capitalizeFirst(data.facial_emotion));
        this.updateElementStyle('face-confidence-fill', 'width', `${data.face_confidence * 100}%`);

        // Final emotion
        this.updateElement('final-emotion', this.capitalizeFirst(data.final_emotion));
        
        // Emotion emoji
        const emoji = this.getEmotionEmoji(data.final_emotion);
        this.updateElement('emotion-emoji', emoji);
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
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    getEmotionEmoji(emotion) {
        const emojiMap = {
            'happy': '😊',
            'sad': '😢',
            'angry': '😠',
            'fear': '😨',
            'disgust': '🤢',
            'surprise': '😲',
            'neutral': '😐'
        };
        return emojiMap[emotion] || '😊';
    }

    showMusicRecommendation(song) {
        const musicSection = document.getElementById('music-recommendation');
        if (!musicSection) return;

        this.updateElement('song-title', song.title);
        this.updateElement('song-artist', song.artist);
        this.updateElement('song-genre', song.genre);
        
        const spotifyLink = document.getElementById('spotify-link');
        if (spotifyLink) {
            spotifyLink.href = song.spotify_link;
        }
        
        musicSection.classList.remove('hidden');
        
        setTimeout(() => {
            musicSection.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (!overlay) return;

        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    capitalizeFirst(string) {
        return string ? string.charAt(0).toUpperCase() + string.slice(1) : 'Unknown';
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
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 DOM fully loaded, starting EmpatheticAI...');
    window.empatheticAI = new EmpatheticAI();
});