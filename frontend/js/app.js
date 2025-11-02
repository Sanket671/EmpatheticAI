// 🎯 EmpatheticAI v4.0 - WITH SPECIFIC FACTOR EXPLANATIONS
console.log('🎯 EmpatheticAI v4.0 - Specific Factor Explanations');

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
        console.log('🔄 ======= START: handleUserInput v4.0 =======');
        
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
                console.log('✅ Backend response status: SUCCESS');
                
                // CRITICAL: CALL ALL FUNCTIONS IN ORDER
                this.addMessage(response.response, 'bot');
                console.log('✅ Bot message added');
                
                this.updateAnalysisResults(response);
                console.log('✅ Analysis results updated');
                
                // Enhanced decision breakdown with specific factor explanations
                console.log('🔍 CALLING updateDecisionBreakdown NOW...');
                this.updateDecisionBreakdown(response);
                console.log('✅ Decision breakdown updated');
                
                if (response.song_recommendation) {
                    this.showMusicRecommendation(response.song_recommendation);
                    console.log('✅ Music recommendation shown');
                }
                
                console.log('✅ Analysis completed successfully');
            } else {
                console.error('❌ Backend response status: ERROR', response.error);
                throw new Error(response.error || 'Analysis failed');
            }

        } catch (error) {
            console.error('❌ Error in analysis:', error);
            this.addMessage("I apologize, but I'm having trouble processing your emotions right now. Please try again.", 'bot');
        } finally {
            this.isProcessing = false;
            this.showLoading(false);
            console.log('🔄 Reset processing state');
            console.log('✅ ======= END: handleUserInput =======');
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
        console.log('📊 ======= START: updateDecisionBreakdown v4.0 =======');
        console.log('📊 Full response data received:', data);
        
        try {
            // Step 1: Find the breakdown div
            console.log('🔍 Step 1: Finding decision-breakdown element');
            const breakdownDiv = document.getElementById('decision-breakdown');
            if (!breakdownDiv) {
                console.error('❌ CRITICAL: Decision breakdown element not found');
                return;
            }
            console.log('✅ Step 1: Breakdown div found');

            // Step 2: Make it visible
            console.log('🔍 Step 2: Making breakdown visible');
            breakdownDiv.style.display = 'block';
            breakdownDiv.style.opacity = '1';
            breakdownDiv.style.visibility = 'visible';
            console.log('✅ Step 2: Breakdown made visible');

            // Step 3: Check if we have fusion data and factor details
            console.log('🔍 Step 3: Checking fusion_data and factor_details in response');
            if (!data.fusion_data || !data.factor_details) {
                console.error('❌ No fusion_data or factor_details in response');
                console.log('📊 Available keys in response:', Object.keys(data));
                return;
            }

            const fusion = data.fusion_data;
            const factors = data.factor_details;
            console.log('✅ Step 3: Fusion data and factors found:', { fusion, factors });

            // Step 4: Calculate percentages
            console.log('🔍 Step 4: Calculating percentages from fusion data');
            const textWeightPercent = (fusion.text_weight * 100).toFixed(1);
            const faceWeightPercent = (fusion.face_weight * 100).toFixed(1);
            const textReliabilityPercent = (fusion.text_reliability * 100).toFixed(1);
            const faceReliabilityPercent = (fusion.face_reliability * 100).toFixed(1);

            console.log('📈 Step 4: Calculated percentages:', {
                textWeightPercent,
                faceWeightPercent,
                textReliabilityPercent,
                faceReliabilityPercent
            });

            // Step 5: Update ALL elements with detailed logging
            console.log('🔍 Step 5: Starting element updates...');
            
            console.log('   → Updating text-weight');
            this.updateElement('text-weight', `${textWeightPercent}%`);
            
            console.log('   → Updating face-weight');
            this.updateElement('face-weight', `${faceWeightPercent}%`);
            
            console.log('   → Updating text-weight-fill width');
            this.updateElementStyle('text-weight-fill', 'width', `${textWeightPercent}%`);
            
            console.log('   → Updating face-weight-fill width');
            this.updateElementStyle('face-weight-fill', 'width', `${faceWeightPercent}%`);
            
            console.log('   → Updating text-reliability');
            this.updateElement('text-reliability', `${textReliabilityPercent}%`);
            
            console.log('   → Updating face-reliability');
            this.updateElement('face-reliability', `${faceReliabilityPercent}%`);

            // Step 6: Update decision reason with SPECIFIC FACTOR EXPLANATIONS
            console.log('🔍 Step 6: Updating decision reason with specific factors');
            const detailedExplanation = this.generateSpecificFactorExplanation(data, fusion, factors);
            
            this.updateElement('decision-reason', detailedExplanation, true);

            // Step 7: Update masking alerts
            console.log('🔍 Step 7: Updating masking alerts');
            this.updateMaskingAlerts(fusion, data);

            console.log('✅ ======= updateDecisionBreakdown COMPLETED SUCCESSFULLY =======');

        } catch (error) {
            console.error('❌ ======= CRITICAL ERROR in updateDecisionBreakdown =======');
            console.error('Error:', error);
            console.error('Stack:', error.stack);
        }
    }

    generateSpecificFactorExplanation(data, fusion, factors) {
        const textWeight = (fusion.text_weight * 100).toFixed(1);
        const faceWeight = (fusion.face_weight * 100).toFixed(1);
        const textReliability = (fusion.text_reliability * 100).toFixed(1);
        const faceReliability = (fusion.face_reliability * 100).toFixed(1);
        
        let explanation = `<strong>🧠 Detailed Analysis Breakdown</strong><br><br>`;
        
        // WEIGHT CALCULATION EXPLANATION
        explanation += `<strong>⚖️ Weight Calculation:</strong><br>`;
        
        const weightCalc = factors.weight_calculation;
        explanation += `• <strong>Base Text Weight:</strong> ${(weightCalc.base_text_weight * 100).toFixed(1)}%<br>`;
        explanation += `• <strong>Base Face Weight:</strong> ${(weightCalc.base_face_weight * 100).toFixed(1)}%<br>`;
        explanation += `• <strong>Reason:</strong> ${this.formatWeightReason(weightCalc.weight_adjustment_reason)}<br>`;
        explanation += `• <strong>Text Reliability Applied:</strong> ${(weightCalc.text_reliability_used * 100).toFixed(1)}%<br>`;
        explanation += `• <strong>Face Reliability Applied:</strong> ${(weightCalc.face_reliability_used * 100).toFixed(1)}%<br>`;
        explanation += `• <strong>Final Text Weight:</strong> ${textWeight}%<br>`;
        explanation += `• <strong>Final Face Weight:</strong> ${faceWeight}%<br><br>`;
        
        // TEXT RELIABILITY FACTORS
        explanation += `<strong>📝 Text Reliability Factors (${textReliability}%):</strong><br>`;
        const textFactors = factors.text_reliability_factors;
        
        if (textFactors.base_confidence > 0) {
            explanation += `• Base confidence: ${(textFactors.base_confidence * 100).toFixed(1)}%<br>`;
        }
        if (textFactors.length_boost > 0) {
            explanation += `• Text length boost: +${(textFactors.length_boost * 100).toFixed(1)}%<br>`;
        }
        if (textFactors.emotional_words_boost > 0) {
            explanation += `• Emotional words: +${(textFactors.emotional_words_boost * 100).toFixed(1)}%<br>`;
        }
        if (textFactors.contradiction_penalty < 0) {
            explanation += `• Contradiction penalty: ${(textFactors.contradiction_penalty * 100).toFixed(1)}%<br>`;
        }
        if (textFactors.masking_boost > 0) {
            explanation += `• Masking detection: +${(textFactors.masking_boost * 100).toFixed(1)}%<br>`;
        }
        if (textFactors.sarcasm_boost > 0) {
            explanation += `• Sarcasm adjustment: +${(textFactors.sarcasm_boost * 100).toFixed(1)}%<br>`;
        }
        if (textFactors.mixed_emotion_penalty < 0) {
            explanation += `• Mixed emotions: ${(textFactors.mixed_emotion_penalty * 100).toFixed(1)}%<br>`;
        }
        
        explanation += `<br>`;
        
        // FACE RELIABILITY FACTORS
        explanation += `<strong>😊 Face Reliability Factors (${faceReliability}%):</strong><br>`;
        const faceFactors = factors.face_reliability_factors;
        
        explanation += `• Base confidence: ${(faceFactors.base_confidence * 100).toFixed(1)}%<br>`;
        explanation += `• Authenticity factor: ${(faceFactors.authenticity_factor * 100).toFixed(1)}%<br>`;
        explanation += `• <em>${this.getAuthenticityExplanation(data.facial_emotion)}</em><br><br>`;
        
        // CONTEXT FACTORS
        explanation += `<strong>🔍 Context Analysis:</strong><br>`;
        const context = factors.context_factors;
        
        explanation += `• Text length: ${context.text_length} characters<br>`;
        explanation += `• Sarcasm score: ${(context.sarcasm_score * 100).toFixed(1)}%<br>`;
        explanation += `• Mixed emotions: ${context.mixed_emotions_detected ? 'Yes' : 'No'}<br>`;
        explanation += `• Original face confidence: ${(context.face_confidence_original * 100).toFixed(1)}%<br>`;
        explanation += `• Original text confidence: ${(context.text_confidence_original * 100).toFixed(1)}%<br>`;
        
        // FINAL FORMULA
        explanation += `<br><strong>🎯 Final Emotion Calculation:</strong><br>`;
        explanation += `Final = (Text: ${data.text_emotion} × ${textWeight}%) + (Face: ${data.facial_emotion} × ${faceWeight}%)<br>`;
        explanation += `Result: <strong>${data.final_emotion}</strong>`;
        
        return explanation;
    }

    formatWeightReason(reason) {
        const reasonMap = {
            'High sarcasm detected - text prioritized': 'High sarcasm detected in your text, so we prioritized text analysis',
            'Substantial text input - text weighted more': 'Your text was detailed, so it carried more weight',
            'Strong facial expression with minimal text - face weighted more': 'Clear facial expression with minimal text, so face carried more weight',
            'Emotional masking suspected - text trusted more': 'Possible emotional masking detected, so we trusted your words more',
            'Mixed emotions detected - complex analysis': 'Mixed emotions detected, requiring balanced analysis',
            'Balanced base weights': 'Balanced consideration of both inputs'
        };
        return reasonMap[reason] || reason;
    }

    getAuthenticityExplanation(emotion) {
        const explanations = {
            'happy': 'Smiles can be easily faked, so we apply a moderate authenticity factor',
            'neutral': 'Neutral expressions often mask true feelings, so we apply a low authenticity factor',
            'sad': 'Genuine sadness is harder to fake, so we apply a high authenticity factor',
            'angry': 'Subtle anger is difficult to fake convincingly, so we apply a high authenticity factor',
            'fear': 'Complex emotion with specific markers, moderate authenticity factor applied',
            'surprise': 'Genuine surprise has specific physiological markers, high authenticity factor',
            'disgust': 'Subtle disgust is hard to fake, high authenticity factor applied'
        };
        return explanations[emotion] || 'Standard authenticity factor applied';
    }

    updateElement(elementId, content, isHTML = false) {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                console.error(`❌ Element ${elementId} not found`);
                return;
            }

            if (isHTML) {
                element.innerHTML = content;
            } else {
                element.textContent = content;
            }
            console.log(`✅ Updated ${elementId}: ${content}`);
        } catch (error) {
            console.error(`❌ Error updating ${elementId}:`, error);
        }
    }

    updateElementStyle(elementId, property, value) {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                console.error(`❌ Element ${elementId} not found for style update`);
                return;
            }

            element.style[property] = value;
            console.log(`✅ Updated ${elementId} style: ${property} = ${value}`);
        } catch (error) {
            console.error(`❌ Error updating ${elementId} style:`, error);
        }
    }

    updateMaskingAlerts(fusion, data) {
        try {
            const maskingAlert = document.getElementById('masking-alert');
            const maskingDetails = document.getElementById('masking-details');
            
            if (!maskingAlert || !maskingDetails) {
                console.error('❌ Masking alert elements not found');
                return;
            }

            let maskingText = '';
            
            if (fusion.masking_indicators && fusion.masking_indicators.length > 0) {
                maskingText = fusion.masking_indicators.map(indicator => 
                    `• ${this.formatMaskingIndicator(indicator)}`
                ).join('<br>');
            }
            
            if (data.sarcasm_detected) {
                maskingText += (maskingText ? '<br>' : '') + `• Sarcasm detected (${(data.sarcasm_score * 100).toFixed(1)}% confidence)`;
            }
            
            if (data.mixed_emotions) {
                const [primary, secondary] = data.mixed_emotions;
                maskingText += (maskingText ? '<br>' : '') + `• Mixed emotions detected: ${this.capitalizeFirst(primary)} and ${this.capitalizeFirst(secondary)}`;
            }
            
            if (maskingText) {
                maskingAlert.style.display = 'block';
                maskingAlert.style.opacity = '1';
                maskingAlert.style.visibility = 'visible';
                maskingDetails.innerHTML = maskingText;
                console.log('✅ Masking alerts shown');
            } else {
                maskingAlert.style.display = 'none';
                maskingAlert.style.opacity = '0';
                maskingAlert.style.visibility = 'hidden';
                console.log('✅ No masking alerts');
            }
        } catch (error) {
            console.error('❌ Error updating masking alerts:', error);
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

    updateAnalysisResults(data) {
        console.log('📊 Updating analysis results...', data);
        
        try {
            // Text emotion
            this.updateElement('text-emotion', this.capitalizeFirst(data.text_emotion || 'neutral'));
            this.updateElementStyle('text-confidence-fill', 'width', `${(data.text_confidence || 0.5) * 100}%`);

            // Facial emotion
            this.updateElement('facial-emotion', this.capitalizeFirst(data.facial_emotion || 'neutral'));
            this.updateElementStyle('face-confidence-fill', 'width', `${(data.face_confidence || 0.3) * 100}%`);

            // Final emotion
            this.updateElement('final-emotion', this.capitalizeFirst(data.final_emotion || data.text_emotion || 'neutral'));
            
            // Emotion emoji
            const finalEmotion = data.final_emotion || data.text_emotion || 'neutral';
            const emoji = this.getEmotionEmoji(finalEmotion);
            this.updateElement('emotion-emoji', emoji);
            
            console.log('✅ Analysis results updated successfully');
        } catch (error) {
            console.error('❌ Error updating analysis results:', error);
        }
    }

    addMessage(text, sender) {
        try {
            const chatMessages = document.getElementById('chat-messages');
            if (!chatMessages) {
                console.error('❌ Chat messages container not found');
                return;
            }

            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = text;
            
            messageDiv.appendChild(contentDiv);
            chatMessages.appendChild(messageDiv);
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            console.log(`💬 Added ${sender} message: ${text.substring(0, 50)}...`);
        } catch (error) {
            console.error('❌ Error adding message:', error);
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
            'sarcastic': '😏',
            'excited': '😃',
            'tired': '😴'
        };
        return emojiMap[emotion] || '😊';
    }

    showMusicRecommendation(song) {
        try {
            const musicSection = document.getElementById('music-recommendation');
            if (!musicSection) {
                console.error('❌ Music recommendation section not found');
                return;
            }

            console.log('🎵 Showing music recommendation:', song);

            this.updateElement('song-title', song.title || 'Unknown Song');
            this.updateElement('song-artist', song.artist || 'Unknown Artist');
            this.updateElement('song-genre', song.genre || 'Various');
            
            const spotifyLink = document.getElementById('spotify-link');
            if (spotifyLink && song.spotify_link) {
                spotifyLink.href = song.spotify_link;
            } else if (spotifyLink) {
                spotifyLink.href = 'https://open.spotify.com';
            }
            
            musicSection.style.display = 'block';
            musicSection.style.opacity = '1';
            musicSection.style.visibility = 'visible';
            
            setTimeout(() => {
                musicSection.scrollIntoView({ behavior: 'smooth' });
            }, 500);
            
            console.log('✅ Music recommendation displayed');
        } catch (error) {
            console.error('❌ Error showing music recommendation:', error);
        }
    }

    showLoading(show) {
        try {
            const overlay = document.getElementById('loading-overlay');
            if (!overlay) {
                console.error('❌ Loading overlay not found');
                return;
            }

            if (show) {
                overlay.style.display = 'flex';
                overlay.style.opacity = '1';
                overlay.style.visibility = 'visible';
                console.log('🔄 Showing loading overlay');
            } else {
                overlay.style.display = 'none';
                overlay.style.opacity = '0';
                overlay.style.visibility = 'hidden';
                console.log('✅ Hiding loading overlay');
            }
        } catch (error) {
            console.error('❌ Error showing/hiding loading:', error);
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
        if (!button) {
            console.error('❌ Camera button not found');
            return;
        }
        
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
    console.log('🌐 DOM fully loaded, starting EmpatheticAI v4.0...');
    window.empatheticAI = new EmpatheticAI();
});