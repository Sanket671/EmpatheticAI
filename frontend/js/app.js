// 🎯 EmpatheticAI v6.1 - Voice Feedback, Export & Dark Mode
console.log('🎯 EmpatheticAI v6.1 - Full Edition');

class EmpatheticAI {
    constructor() {
        this.webcamHandler = null;
        this.isProcessing = false;
        this.backendURL = 'http://localhost:5000';
        this.emotionHistory = [];
        this.emotionChart = null;
        this.recognition = null; // speech recognition instance

        console.log('🚀 EmpatheticAI initializing...');
        this.initialize();
        this.initChart();
        this.initVoiceRecognition();
        this.loadTheme();
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

    initChart() {
        const ctx = document.getElementById('emotion-chart')?.getContext('2d');
        if (!ctx) return;
        this.emotionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['angry','disgust','fear','happy','neutral','sad','surprise'],
                datasets: [{
                    label: 'Count',
                    data: [0,0,0,0,0,0,0],
                    backgroundColor: '#42a5f5'
                }]
            },
            options: {
                scales: { y: { beginAtZero: true, max: 10 } }
            }
        });
    }

    updateChart(emotion) {
        if (!this.emotionChart) return;
        this.emotionHistory.push(emotion);
        const counts = { angry:0, disgust:0, fear:0, happy:0, neutral:0, sad:0, surprise:0 };
        this.emotionHistory.forEach(e => { if (counts[e] !== undefined) counts[e]++; });
        this.emotionChart.data.datasets[0].data = Object.values(counts);
        this.emotionChart.update();
    }

    clearChart() {
        this.emotionHistory = [];
        if (this.emotionChart) {
            this.emotionChart.data.datasets[0].data = [0,0,0,0,0,0,0];
            this.emotionChart.update();
        }
    }

    // ─── VOICE INPUT WITH FEEDBACK ─────────────────
    initVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            const voiceBtn = document.getElementById('voice-btn');
            if (voiceBtn) voiceBtn.style.display = 'none';
            return;
        }
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        const voiceBtn = document.getElementById('voice-btn');
        if (!voiceBtn) return;

        // 🔴 Show listening state
        this.recognition.onstart = () => {
            voiceBtn.classList.add('listening');
            voiceBtn.innerHTML = '🎤'; // keep icon, but class handles visual
            // Also show a small "listening" tooltip as text on the button (optional)
            voiceBtn.setAttribute('title', 'Listening...');
        };

        this.recognition.onend = () => {
            voiceBtn.classList.remove('listening');
            voiceBtn.innerHTML = '🎤';
            voiceBtn.setAttribute('title', 'Speak your feelings');
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            voiceBtn.classList.remove('listening');
            voiceBtn.innerHTML = '🎤';
            voiceBtn.setAttribute('title', 'Speak your feelings');
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('user-input').value = transcript;
            // The recognition will automatically stop after a result (continuous=false)
            // so onend will fire and remove the listening class.
        };

        voiceBtn.addEventListener('click', () => {
            if (this.recognition) {
                try {
                    this.recognition.start();
                } catch (e) {
                    console.warn('Recognition already started');
                }
            }
        });
    }

    // ─── CSV EXPORT ────────────────────────────────
    exportHistory() {
        if (this.emotionHistory.length === 0) {
            alert('No emotion history to export.');
            return;
        }
        let csv = 'Index,Emotion\n';
        this.emotionHistory.forEach((emotion, idx) => {
            csv += `${idx + 1},${emotion}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'emotion_history.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ─── DARK MODE TOGGLE ─────────────────────────
    toggleTheme() {
        const body = document.body;
        body.classList.toggle('dark-theme');
        const isDark = body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
    }

    loadTheme() {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            document.body.classList.add('dark-theme');
            const btn = document.getElementById('theme-toggle');
            if (btn) btn.textContent = '☀️ Light Mode';
        }
    }

    // ─── EVENT LISTENERS ─────────────────────────
    initializeEventListeners() {
        console.log('🔗 Setting up event listeners...');

        const sendButton = document.getElementById('send-btn');
        if (sendButton) sendButton.addEventListener('click', () => this.handleUserInput());

        const playlistBtn = document.getElementById('playlist-btn');
        if (playlistBtn) playlistBtn.addEventListener('click', () => this.handlePlaylistRequest());

        const userInput = document.getElementById('user-input');
        if (userInput) {
            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleUserInput();
            });
        }

        const cameraButton = document.getElementById('toggle-camera');
        if (cameraButton) cameraButton.addEventListener('click', () => this.toggleCamera());

        const clearBtn = document.getElementById('clear-history');
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearChart());

        const exportBtn = document.getElementById('export-history');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportHistory());

        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) themeBtn.addEventListener('click', () => this.toggleTheme());

        console.log('✅ Event listeners set up');
    }

    // ─── REST OF THE METHODS (unchanged from previous version) ─
    async handleUserInput() {
        console.log('🔄 ======= START: handleUserInput =======');
        if (!this.webcamHandler) return;
        const input = document.getElementById('user-input');
        if (!input) return;
        const userText = input.value.trim();
        if (!userText) return;
        if (this.isProcessing) return;

        console.log('💬 Processing user input:', userText);
        this.addMessage(userText, 'user');
        input.value = '';
        this.isProcessing = true;
        this.showLoading(true);

        try {
            const facialEmotionData = this.webcamHandler.getCurrentEmotion();
            const response = await this.analyzeEmotions(userText, facialEmotionData);
            if (response.status === 'success') {
                this.addMessage(response.response, 'bot');
                this.updateAnalysisResults(response);
                this.updateDecisionBreakdown(response);
                this.showMusicRecommendation(response.song_recommendation);
                this.updateChart(response.final_emotion);
            } else {
                throw new Error(response.error || 'Analysis failed');
            }
        } catch (error) {
            console.error('❌ Error in analysis:', error);
            this.addMessage("I'm having trouble processing your emotions right now. Please try again.", 'bot');
        } finally {
            this.isProcessing = false;
            this.showLoading(false);
            console.log('✅ ======= END: handleUserInput =======');
        }
    }

    async handlePlaylistRequest() {
        const input = document.getElementById('user-input');
        const userText = input.value.trim();
        if (!userText) {
            this.addMessage("Please type a message first so I can understand your mood.", 'bot');
            return;
        }
        try {
            this.showLoading(true);
            const facialEmotionData = this.webcamHandler.getCurrentEmotion();
            const analysis = await this.analyzeEmotions(userText, facialEmotionData);
            if (analysis.status !== 'success') throw new Error('Analysis failed');
            const finalEmotion = analysis.final_emotion;

            const res = await fetch(`${this.backendURL}/playlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emotion: finalEmotion, length: 5 })
            });
            const playlistData = await res.json();

            let html = `<p>🧘 <strong>Therapy Playlist</strong> for <strong>${finalEmotion}</strong></p><ol>`;
            playlistData.playlist.forEach(song => {
                html += `<li>${song.title} — ${song.artist} (${song.genre})</li>`;
            });
            html += '</ol>';
            this.addMessage(html, 'bot', true);
            this.addMessage(analysis.response, 'bot');
            this.updateChart(finalEmotion);
        } catch (e) {
            console.error(e);
            this.addMessage("Sorry, couldn't generate the playlist right now.", 'bot');
        } finally {
            this.showLoading(false);
        }
    }

    async analyzeEmotions(text, facialEmotionData) {
        const payload = {
            text: text,
            facial_emotion: facialEmotionData.emotion,
            face_confidence: facialEmotionData.confidence
        };
        const response = await fetch(`${this.backendURL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        return await response.json();
    }

    // ─── The following methods are identical to your previous version ───
    updateDecisionBreakdown(data) {
        console.log('📊 updating decision breakdown');
        try {
            const breakdownDiv = document.getElementById('decision-breakdown');
            if (!breakdownDiv) return;
            breakdownDiv.style.display = 'block';

            const fusion = data.fusion_data;
            const factors = data.factor_details;
            if (!fusion || !factors) return;

            const textWeightPercent = (fusion.text_weight * 100).toFixed(1);
            const faceWeightPercent = (fusion.face_weight * 100).toFixed(1);
            const textReliabilityPercent = (fusion.text_reliability * 100).toFixed(1);
            const faceReliabilityPercent = (fusion.face_reliability * 100).toFixed(1);

            document.getElementById('text-weight').textContent = `${textWeightPercent}%`;
            document.getElementById('face-weight').textContent = `${faceWeightPercent}%`;
            document.getElementById('text-weight-fill').style.width = `${textWeightPercent}%`;
            document.getElementById('face-weight-fill').style.width = `${faceWeightPercent}%`;
            document.getElementById('text-reliability').textContent = `${textReliabilityPercent}%`;
            document.getElementById('face-reliability').textContent = `${faceReliabilityPercent}%`;

            const detailedExplanation = this.generateSpecificFactorExplanation(data, fusion, factors);
            document.getElementById('decision-reason').innerHTML = detailedExplanation;

            // Show detected keywords
            if (data.detected_keywords && data.detected_keywords.length > 0) {
                document.getElementById('keyword-badge').innerHTML = 
                    `<span style="background:#e0e7ff; padding:4px 12px; border-radius:20px; font-size:0.9rem;">
                        🔑 Keywords: ${data.detected_keywords.join(', ')}
                    </span>`;
            } else {
                document.getElementById('keyword-badge').innerHTML = '';
            }

            this.updateMaskingAlerts(fusion, data);
        } catch (error) {
            console.error('❌ Error updating breakdown:', error);
        }
    }

    generateSpecificFactorExplanation(data, fusion, factors) {
        const textWeight = (fusion.text_weight * 100).toFixed(1);
        const faceWeight = (fusion.face_weight * 100).toFixed(1);
        const textReliability = (fusion.text_reliability * 100).toFixed(1);
        const faceReliability = (fusion.face_reliability * 100).toFixed(1);
        
        let explanation = `<strong>🧠 Detailed Analysis Breakdown</strong><br><br>`;
        
        const weightCalc = factors.weight_calculation;
        explanation += `<strong>⚖️ Weight Calculation:</strong><br>`;
        explanation += `• <strong>Base Text Weight:</strong> ${(weightCalc.base_text_weight * 100).toFixed(1)}%<br>`;
        explanation += `• <strong>Base Face Weight:</strong> ${(weightCalc.base_face_weight * 100).toFixed(1)}%<br>`;
        explanation += `• <strong>Reason:</strong> ${this.formatWeightReason(weightCalc.weight_adjustment_reason)}<br>`;
        explanation += `• <strong>Text Reliability Applied:</strong> ${(weightCalc.text_reliability_used * 100).toFixed(1)}%<br>`;
        explanation += `• <strong>Face Reliability Applied:</strong> ${(weightCalc.face_reliability_used * 100).toFixed(1)}%<br>`;
        explanation += `• <strong>Final Text Weight:</strong> ${textWeight}%<br>`;
        explanation += `• <strong>Final Face Weight:</strong> ${faceWeight}%<br><br>`;
        
        const textFactors = factors.text_reliability_factors;
        explanation += `<strong>📝 Text Reliability Factors (${textReliability}%):</strong><br>`;
        if (textFactors.base_confidence > 0) explanation += `• Base confidence: ${(textFactors.base_confidence * 100).toFixed(1)}%<br>`;
        if (textFactors.length_boost > 0) explanation += `• Text length boost: +${(textFactors.length_boost * 100).toFixed(1)}%<br>`;
        if (textFactors.emotional_words_boost > 0) explanation += `• Emotional words: +${(textFactors.emotional_words_boost * 100).toFixed(1)}%<br>`;
        if (textFactors.contradiction_penalty < 0) explanation += `• Contradiction penalty: ${(textFactors.contradiction_penalty * 100).toFixed(1)}%<br>`;
        if (textFactors.masking_boost > 0) explanation += `• Masking detection: +${(textFactors.masking_boost * 100).toFixed(1)}%<br>`;
        if (textFactors.sarcasm_boost > 0) explanation += `• Sarcasm adjustment: +${(textFactors.sarcasm_boost * 100).toFixed(1)}%<br>`;
        if (textFactors.mixed_emotion_penalty < 0) explanation += `• Mixed emotions: ${(textFactors.mixed_emotion_penalty * 100).toFixed(1)}%<br>`;
        
        explanation += `<br>`;
        
        const faceFactors = factors.face_reliability_factors;
        explanation += `<strong>😊 Face Reliability Factors (${faceReliability}%):</strong><br>`;
        explanation += `• Base confidence: ${(faceFactors.base_confidence * 100).toFixed(1)}%<br>`;
        explanation += `• Authenticity factor: ${(faceFactors.authenticity_factor * 100).toFixed(1)}%<br>`;
        explanation += `• <em>${this.getAuthenticityExplanation(data.facial_emotion)}</em><br><br>`;
        
        const context = factors.context_factors;
        explanation += `<strong>🔍 Context Analysis:</strong><br>`;
        explanation += `• Text length: ${context.text_length} characters<br>`;
        explanation += `• Sarcasm score: ${(context.sarcasm_score * 100).toFixed(1)}%<br>`;
        explanation += `• Mixed emotions: ${context.mixed_emotions_detected ? 'Yes' : 'No'}<br>`;
        explanation += `• Original face confidence: ${(context.face_confidence_original * 100).toFixed(1)}%<br>`;
        explanation += `• Original text confidence: ${(context.text_confidence_original * 100).toFixed(1)}%<br>`;
        
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

    updateMaskingAlerts(fusion, data) {
        try {
            const maskingAlert = document.getElementById('masking-alert');
            const maskingDetails = document.getElementById('masking-details');
            if (!maskingAlert || !maskingDetails) return;

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
                maskingDetails.innerHTML = maskingText;
            } else {
                maskingAlert.style.display = 'none';
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
            document.getElementById('text-emotion').textContent = this.capitalizeFirst(data.text_emotion || 'neutral');
            document.getElementById('text-confidence-fill').style.width = `${(data.text_confidence || 0.5) * 100}%`;

            document.getElementById('facial-emotion').textContent = this.capitalizeFirst(data.facial_emotion || 'neutral');
            document.getElementById('face-confidence-fill').style.width = `${(data.face_confidence || 0.3) * 100}%`;

            document.getElementById('final-emotion').textContent = this.capitalizeFirst(data.final_emotion || data.text_emotion || 'neutral');
            document.getElementById('emotion-emoji').textContent = this.getEmotionEmoji(data.final_emotion);
        } catch (error) {
            console.error('❌ Error updating analysis results:', error);
        }
    }

    addMessage(text, sender, isHTML = false) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        if (isHTML) {
            contentDiv.innerHTML = text;
        } else {
            contentDiv.textContent = text;
        }
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showMusicRecommendation(song) {
        try {
            const musicSection = document.getElementById('music-recommendation');
            if (!musicSection) return;

            document.getElementById('song-title').textContent = song.title || 'Unknown Song';
            document.getElementById('song-artist').textContent = song.artist || 'Unknown Artist';
            document.getElementById('song-genre').textContent = song.genre || 'Various';
            
            const spotifyLink = document.getElementById('spotify-link');
            if (spotifyLink && song.spotify_link) {
                spotifyLink.href = song.spotify_link;
            } else if (spotifyLink) {
                spotifyLink.href = 'https://open.spotify.com';
            }
            musicSection.style.display = 'block';
        } catch (error) {
            console.error('❌ Error showing music recommendation:', error);
        }
    }

    showLoading(show) {
        try {
            const overlay = document.getElementById('loading-overlay');
            if (!overlay) return;
            if (show) {
                overlay.style.display = 'flex';
            } else {
                overlay.style.display = 'none';
            }
        } catch (error) {
            console.error('❌ Error showing/hiding loading:', error);
        }
    }

    toggleCamera() {
        if (!this.webcamHandler) return;
        const button = document.getElementById('toggle-camera');
        if (!this.webcamHandler.isCameraOn) {
            this.webcamHandler.startCamera();
        } else {
            this.webcamHandler.stopCamera();
        }
    }

    async checkBackendConnection() {
        try {
            const response = await fetch(`${this.backendURL}/health`);
            if (!response.ok) console.warn('⚠️ Backend connection issues');
            else console.log('✅ Backend connection successful');
        } catch (error) {
            console.error('❌ Cannot connect to backend:', error);
            this.addMessage("I'm having trouble connecting to my analysis engine. Please make sure the backend server is running on port 5000.", 'bot');
        }
    }

    capitalizeFirst(string) {
        return string ? string.charAt(0).toUpperCase() + string.slice(1) : 'Unknown';
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
}

document.addEventListener('DOMContentLoaded', () => {
    window.empatheticAI = new EmpatheticAI();
});