class WebcamHandler {
    constructor() {
        this.video = document.getElementById('webcam');
        this.canvas = document.getElementById('emotion-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isCameraOn = false;
        this.stream = null;
        this.faceDetectionInterval = null;
        this.isFaceAPILoaded = false;
        this.currentEmotion = 'neutral';
        this.currentConfidence = 0.5;
        
        console.log('🎥 WebcamHandler initialized');
        this.initializeFaceAPI();
    }

    async initializeFaceAPI() {
        try {
            console.log('🔄 Starting FaceAPI initialization...');
            
            if (typeof faceapi === 'undefined') {
                console.error('FaceAPI not available, using fallback');
                this.isFaceAPILoaded = false;
                return;
            }

            // Load models with error handling
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri('./assets/models');
                await faceapi.nets.faceLandmark68Net.loadFromUri('./assets/models');
                await faceapi.nets.faceRecognitionNet.loadFromUri('./assets/models');
                await faceapi.nets.faceExpressionNet.loadFromUri('./assets/models');
                
                this.isFaceAPILoaded = true;
                console.log('✅ FaceAPI models loaded');
            } catch (modelError) {
                console.warn('⚠️ FaceAPI models failed, using fallback:', modelError);
                this.isFaceAPILoaded = false;
            }
            
        } catch (error) {
            console.error('❌ FaceAPI initialization failed:', error);
            this.isFaceAPILoaded = false;
        }
    }

    async startCamera() {
        try {
            console.log('🎥 Requesting camera access...');
            
            // Update button to show we're trying
            const button = document.getElementById('toggle-camera');
            if (button) {
                button.textContent = '⏳ Requesting...';
                button.disabled = true;
            }

            // Check if browser supports camera
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported in this browser');
            }

            // Request camera access with specific constraints
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 320 },
                    height: { ideal: 240 },
                    facingMode: 'user',
                    frameRate: { ideal: 30 }
                },
                audio: false
            });

            console.log('✅ Camera access granted');
            
            // Set up video element
            this.video.srcObject = this.stream;
            this.isCameraOn = true;

            // Wait for video to be ready
            await new Promise((resolve) => {
                if (this.video.readyState >= 3) { // HAVE_FUTURE_DATA
                    resolve();
                } else {
                    this.video.addEventListener('loadeddata', resolve, { once: true });
                }
            });

            await this.video.play();
            console.log('✅ Video playback started');

            // Update UI
            if (button) {
                button.textContent = '📷 Stop Camera';
                button.style.background = '#ef4444';
                button.disabled = false;
            }

            this.startFaceDetection();
            return true;
            
        } catch (error) {
            console.error('❌ Camera error:', error);
            
            // Update button to show error state
            const button = document.getElementById('toggle-camera');
            if (button) {
                button.textContent = '📷 Start Camera';
                button.style.background = '#10b981';
                button.disabled = false;
            }

            this.showCameraError(error);
            return false;
        }
    }

    showCameraError(error) {
        let errorMessage = 'Camera access failed. ';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = '❌ Camera permission denied. Please allow camera access in your browser settings and refresh the page.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = '❌ No camera found. Please check if you have a camera connected.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = '❌ Camera not supported in this browser.';
        } else if (error.name === 'NotReadableError') {
            errorMessage = '❌ Camera is already in use by another application.';
        } else {
            errorMessage = `❌ Camera error: ${error.message}`;
        }
        
        // Show error in UI
        const emotionDisplay = document.getElementById('emotion-display');
        if (emotionDisplay) {
            emotionDisplay.innerHTML = `
                <div style="color: #dc2626; text-align: center;">
                    <div>${errorMessage}</div>
                    <small>Using simulated emotion detection instead.</small>
                </div>
            `;
        }
        
        // Start fallback detection
        this.startFallbackDetection();
    }

    startFallbackDetection() {
        console.log('🔄 Starting fallback emotion detection');
        this.isCameraOn = true; // Mark as "on" for fallback mode
        
        if (this.faceDetectionInterval) {
            clearInterval(this.faceDetectionInterval);
        }
        
        this.faceDetectionInterval = setInterval(() => {
            this.simulateFaceDetection();
        }, 2000);
    }

    stopCamera() {
        console.log('🛑 Stopping camera...');
        
        // Clear detection interval
        if (this.faceDetectionInterval) {
            clearInterval(this.faceDetectionInterval);
            this.faceDetectionInterval = null;
        }
        
        // Stop video tracks
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
        }
        
        this.isCameraOn = false;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Reset UI
        const button = document.getElementById('toggle-camera');
        if (button) {
            button.textContent = '📷 Start Camera';
            button.style.background = '#10b981';
        }
        
        // Reset emotion display
        const emotionDisplay = document.getElementById('emotion-display');
        if (emotionDisplay) {
            emotionDisplay.innerHTML = `
                <div class="emotion-label">Current Emotion: <span id="current-emotion">Not detected</span></div>
                <div class="confidence-label">Confidence: <span id="emotion-confidence">0%</span></div>
            `;
        }
        
        this.currentEmotion = 'neutral';
        this.currentConfidence = 0.5;
        this.updateEmotionDisplay();
        
        console.log('✅ Camera stopped');
    }

    startFaceDetection() {
        if (!this.isCameraOn) return;

        console.log('🔍 Starting face detection...');
        
        // Clear existing interval
        if (this.faceDetectionInterval) {
            clearInterval(this.faceDetectionInterval);
        }
        
        this.faceDetectionInterval = setInterval(async () => {
            await this.detectFace();
        }, 1500);
    }

    async detectFace() {
        try {
            if (!this.isCameraOn) return;

            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (this.isFaceAPILoaded && this.stream) {
                try {
                    const detections = await faceapi
                        .detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions())
                        .withFaceLandmarks()
                        .withFaceExpressions();

                    if (detections && detections.length > 0) {
                        // Draw detections
                        const resizedDetections = faceapi.resizeResults(detections, {
                            width: this.video.width,
                            height: this.video.height
                        });
                        
                        faceapi.draw.drawDetections(this.canvas, resizedDetections);
                        faceapi.draw.drawFaceLandmarks(this.canvas, resizedDetections);
                        faceapi.draw.drawFaceExpressions(this.canvas, resizedDetections);

                        // Get dominant emotion
                        const expressions = detections[0].expressions;
                        let maxEmotion = 'neutral';
                        let maxConfidence = 0;

                        Object.entries(expressions).forEach(([emotion, confidence]) => {
                            if (confidence > maxConfidence) {
                                maxConfidence = confidence;
                                maxEmotion = emotion;
                            }
                        });

                        this.currentEmotion = maxEmotion;
                        this.currentConfidence = maxConfidence;
                        
                    } else {
                        // No face detected
                        this.currentEmotion = 'neutral';
                        this.currentConfidence = 0.3;
                        this.drawNoFaceMessage();
                    }
                    
                } catch (faceError) {
                    console.warn('⚠️ Face detection failed, using fallback:', faceError);
                    this.simulateFaceDetection();
                }
            } else {
                // Use fallback detection
                this.simulateFaceDetection();
            }
            
            this.updateEmotionDisplay();
            
        } catch (error) {
            console.error('❌ Face detection error:', error);
            this.simulateFaceDetection();
        }
    }

    drawNoFaceMessage() {
        this.ctx.fillStyle = '#6b7280';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('No face detected', this.canvas.width / 2, this.canvas.height / 2);
    }

    simulateFaceDetection() {
        if (!this.isCameraOn) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw simulated face
        this.drawSimulatedFace();
        
        // Occasionally change emotion (15% chance)
        if (Math.random() < 0.15) {
            this.simulateEmotionChange();
        }
        
        this.updateEmotionDisplay();
    }

    drawSimulatedFace() {
        const ctx = this.ctx;
        
        // Face outline
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2;
        ctx.strokeRect(80, 60, 160, 120);
        
        // Eyes
        ctx.fillStyle = '#4f46e5';
        ctx.beginPath();
        ctx.arc(120, 100, 8, 0, Math.PI * 2);
        ctx.arc(200, 100, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth based on emotion
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        switch(this.currentEmotion) {
            case 'happy':
                ctx.arc(160, 140, 20, 0, Math.PI, false);
                break;
            case 'sad':
                ctx.arc(160, 150, 20, Math.PI, 0, false);
                break;
            case 'angry':
                ctx.moveTo(140, 140);
                ctx.lineTo(180, 140);
                // Angry eyebrows
                ctx.moveTo(110, 85);
                ctx.lineTo(130, 90);
                ctx.moveTo(210, 85);
                ctx.lineTo(190, 90);
                break;
            case 'surprise':
                ctx.arc(160, 140, 12, 0, Math.PI * 2);
                break;
            case 'fear':
                ctx.moveTo(140, 140);
                ctx.lineTo(180, 140);
                break;
            default: // neutral
                ctx.moveTo(140, 140);
                ctx.lineTo(180, 140);
                break;
        }
        ctx.stroke();
        
        // Add "Simulated" text
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Simulated', this.canvas.width / 2, 30);
    }

    simulateEmotionChange() {
        const emotions = ['happy', 'sad', 'angry', 'neutral', 'surprise', 'fear'];
        this.currentEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        this.currentConfidence = Math.random() * 0.3 + 0.6; // 0.6 to 0.9
    }

    updateEmotionDisplay() {
        try {
            const emotionElement = document.getElementById('current-emotion');
            const confidenceElement = document.getElementById('emotion-confidence');
            
            if (emotionElement) {
                emotionElement.textContent = this.currentEmotion;
            }
            if (confidenceElement) {
                confidenceElement.textContent = `${(this.currentConfidence * 100).toFixed(0)}%`;
            }
            
            // Update analysis panel
            const facialEmotionElement = document.getElementById('facial-emotion');
            const faceConfidenceBar = document.getElementById('face-confidence')?.querySelector('.confidence-fill');
            
            if (facialEmotionElement) {
                facialEmotionElement.textContent = this.capitalizeFirst(this.currentEmotion);
            }
            if (faceConfidenceBar) {
                faceConfidenceBar.style.width = `${this.currentConfidence * 100}%`;
            }
        } catch (error) {
            console.warn('⚠️ Error updating emotion display:', error);
        }
    }

    getCurrentEmotion() {
        return {
            emotion: this.currentEmotion,
            confidence: this.currentConfidence
        };
    }

    capitalizeFirst(string) {
        return string ? string.charAt(0).toUpperCase() + string.slice(1) : 'Neutral';
    }
}