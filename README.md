# Emotion-Based Music Recommendation System with Multi-Modal AI

An advanced intelligent system that combines computer vision, natural language processing, and deep learning to create a personalized music recommendation experience. The system uniquely integrates facial emotion detection, text sentiment analysis, and sophisticated music recommendation algorithms to provide context-aware music suggestions.

## Key Features

- **Multi-Modal Emotion Analysis**
  - Real-time facial emotion detection using face-api.js
  - Text sentiment analysis using deep learning
  - Emotion fusion algorithm for better accuracy

- **Advanced Music Recommendation**
  - Context-aware music suggestions
  - Emotion-based song filtering
  - Lyrics sentiment matching
  - Fallback recommendation system

- **Real-Time Processing**
  - Webcam-based emotion detection at 30 FPS
  - Instant sentiment analysis
  - Low-latency recommendation engine

- **Robust Architecture**
  - REST API with Flask backend
  - Responsive frontend with vanilla JavaScript
  - WebSocket integration for real-time updates
  - Cross-Origin Resource Sharing (CORS) support

## Technical Stack

### Backend
- **Framework**: Flask 2.3.3
- **ML/DL Libraries**:
  - TensorFlow 2.13.0
  - NumPy 1.24.3
  - Pandas 2.0.3
  - Scikit-learn 1.3.0
- **Image Processing**: Pillow 10.0.0
- **CORS Handling**: Flask-CORS 4.0.0

### Frontend
- **Core Technologies**:
  - HTML5
  - CSS3
  - Vanilla JavaScript (ES6+)
- **AI Libraries**:
  - face-api.js (with TensorFlow.js)
- **Features**:
  - Webcam integration
  - Real-time face detection
  - Dynamic UI updates
  - Error handling & recovery

### Machine Learning Models

1. **Facial Emotion Recognition**
   - Technology: face-api.js
   - Models: 
     - Face Detection: SSD MobileNet v1
     - Landmark Detection: 68 point predictor
     - Expression Recognition: 7-class classifier
   - Supported Emotions: angry, disgust, fear, happy, neutral, sad, surprise
   - Real-time processing capabilities

2. **Sentiment Analysis Model**
   - Architecture: Deep Learning (sentiment_classifier_1.h5)
   - Training Data: 1.6M tweets dataset
   - Features: Text preprocessing, tokenization
   - Multi-class sentiment classification

3. **Music Recommendation Engine**
   - Dataset: Spotify Million Song Dataset
   - Algorithms: 
     - Collaborative filtering
     - Emotion-based filtering
     - Lyrics sentiment matching
   - Fallback system for robustness

## Models Used

1. **Face Detection & Emotion Recognition**: 
   - face-api.js models for real-time facial analysis
   - Supports 7 emotions: angry, disgust, fear, happy, neutral, sad, surprise

2. **Sentiment Analysis**:
   - Custom trained model using deep learning
   - Located in `backend/models/sentiment_classifier_1.h5`

3. **Music Recommendation**:
   - Based on Spotify Million Song Dataset
   - Uses collaborative filtering and emotion mapping

## Datasets

1. **Spotify Million Song Dataset**
   - Purpose: Music recommendation training
   - Features: Track metadata, audio features, popularity metrics
   - Size: 1 million songs
   - Usage: Training recommendation system

2. **Twitter Sentiment Dataset**
   - Purpose: Sentiment analysis training
   - Size: 1.6 million processed tweets
   - Features: Text, sentiment labels
   - File: training.1600000.processed.noemoticon.csv

3. **FER2023 Dataset**
   - Purpose: Facial emotion validation
   - Categories: 7 emotions
   - Structure:
     - Training set: Balanced emotion classes
     - Test set: Real-world validation
   - Resolution: Standardized face images

## Special Features

1. **Intelligent Emotion Fusion**
   - Combines facial and textual emotions
   - Weighted decision system
   - Contextual awareness

2. **Robust Error Handling**
   - Fallback recommendation system
   - Graceful degradation
   - Connection retry mechanisms
   - Clear error messages

3. **Performance Optimizations**
   - Efficient data processing
   - Model caching
   - Optimized API calls
   - Resource management

4. **User Experience**
   - Real-time feedback
   - Intuitive interface
   - Responsive design
   - Clear emotion visualization

5. **Therapy Playlist (Emotional Progression)**
   - Description: Generates a 5‑song emotional‑progression playlist that guides the user from the detected emotion toward happiness. The playlist appears as a bot message showing each song's title, artist, and genre.
   - How to use: Type your message in the chat input and either click `Send` (to see the full analysis) or click the `🧘 Therapy Playlist` button next to the input. The button re‑uses the last final emotion (or triggers a new analysis) to create the playlist.
   - Fallbacks: If the Spotify dataset doesn't contain enough songs for any progression stage, the system fills the remainder with curated fallback tracks so a full 5‑song playlist is always returned.

6. **Explainability Printout — Keywords**
   - Description: After every analysis (via `Send`) the "🧠 Analysis Breakdown" card displays a `🔑 Keywords` badge listing the lexicon words that influenced the text sentiment decision (e.g., `lonely, depressed, worried`).
   - Behavior: If no strong keywords are detected the badge will be empty. This badge makes text‑based decisions transparent and easy to inspect.

7. **Real‑Time Emotion Chart (Emotion History)**
   - Description: The "📊 Emotion History" dashboard records the final emotion each time the user triggers an analysis (by clicking `Send` or `🧘 Therapy Playlist`) and updates a bar chart of counts per emotion.
   - Controls: Use the red `Clear History` button to reset all counts to zero.
   - Note: The chart is only updated when the user triggers an analysis; passive face‑only detections do not increment the chart so it reflects explicit user engagements.

8. **Voice Input (Speech → Text)**
   - Description: Click the `🎤` button next to the message input, speak, and your words will appear in the text box. Press `Send` to analyze the transcribed text.
   - Mic indicator: The UI shows a clear mic state (on/off) via the icon and color change so users know when audio capture is active.
   - Privacy: Uses browser speech recognition APIs where available and requests permission before recording.

9. **Export History — CSV**
   - Description: The dashboard includes a `📥 Export CSV` control that downloads the session emotion log as a CSV file for offline inspection and analysis.
   - CSV contents: Each row includes `timestamp`, `final_emotion`, `confidence`, `keywords` (if any), and `source` (text/playlist).

10. **Dark Mode**
   - Description: A `🌙 Dark Mode` toggle in the top-right header switches the UI between light and dark themes. The user's preference is saved in the browser so it persists across sessions.
   - Behavior: Click again to return to light mode; preference stored in `localStorage`.

### Try This Full Flow
- Example: Type "I'm feeling really depressed and lonely, but don't worry about me 😊" and click `Send`.
  - You will see the fusion breakdown, the `🔑 Keywords` badge (showing `lonely`, `depressed`), and an immediate song recommendation.
  - The "📊 Emotion History" chart will increment for the detected emotion (e.g., `sad`).
- Then click `🧘 Therapy Playlist` (without typing a new message). The system re‑uses the last final emotion and returns a 5‑song progression (e.g., `sad → neutral → happy`). The chart may increment again depending on whether your implementation counts playlist generation as a separate analysis event.
- To reset the chart, click `Clear History`.

### UI Notes
- The `🧘 Therapy Playlist` button should be placed next to the message input for quick access.
- Playlist messages should present each track with **Title — Artist (Genre)** and a short explanation of the progression stage.
- Keep the `🔑 Keywords` badge visible under the analysis bars for immediate explainability.

- Voice input: Click the `🎤` button next to the text input to enable speech-to-text. The mic icon and color change indicate whether the mic is active; speak to populate the input and press `Send` to analyze.
- Export history: Use the `📥 Export CSV` button on the dashboard to download your session emotion log (timestamp, emotion, confidence, keywords).
- Dark mode: Toggle the `🌙 Dark Mode` button in the top-right header to switch themes; the choice is saved in the browser `localStorage`.

## Development

- Backend: Flask REST API with ML models
- Frontend: HTML5, CSS3, JavaScript
- ML: TensorFlow, face-api.js
- Data Processing: Pandas, NumPy

## Project Structure

```
📦Main_Project
 ┣ 📂backend
 ┃ ┣ 📂models
 ┃ ┃ ┣ 📜emotion_classifier_1.h5
 ┃ ┃ ┗ 📜sentiment_classifier_1.h5
 ┃ ┣ 📜app.py
 ┃ ┣ 📜emotion_model.py
 ┃ ┣ 📜music_recommender.py
 ┃ ┣ 📜requirements.txt
 ┃ ┗ 📜sentiment_model.py
 ┣ 📂datasets
 ┃ ┣ 📂fer2023
 ┃ ┃ ┣ 📂test
 ┃ ┃ ┃ ┣ 📂angry
 ┃ ┃ ┃ ┣ 📂disgust
 ┃ ┃ ┃ ┣ 📂fear
 ┃ ┃ ┃ ┣ 📂happy
 ┃ ┃ ┃ ┣ 📂neutral
 ┃ ┃ ┃ ┣ 📂sad
 ┃ ┃ ┃ ┗ 📂surprise
 ┃ ┃ ┗ 📂train
 ┃ ┃ ┃ ┣ 📂angry
 ┃ ┃ ┃ ┣ 📂disgust
 ┃ ┃ ┃ ┣ 📂fear
 ┃ ┃ ┃ ┣ 📂happy
 ┃ ┃ ┃ ┣ 📂neutral
 ┃ ┃ ┃ ┣ 📂sad
 ┃ ┃ ┃ ┗ 📂surprise
 ┃ ┣ 📜spotify_millsongdata.csv
 ┃ ┗ 📜training.1600000.processed.noemoticon.csv
 ┗ 📂frontend
 ┃ ┣ 📂assets
 ┃ ┃ ┗ 📂models
 ┃ ┃ ┃ ┣ 📜age_gender_model-shard1
 ┃ ┃ ┃ ┣ 📜age_gender_model-weights_manifest.json
 ┃ ┃ ┃ ┣ 📜face_expression_model-shard1
 ┃ ┃ ┃ ┣ 📜face_expression_model-weights_manifest.json
 ┃ ┃ ┃ ┣ 📜face_landmark_68_model-shard1
 ┃ ┃ ┃ ┣ 📜face_landmark_68_model-weights_manifest.json
 ┃ ┃ ┃ ┣ 📜face_landmark_68_tiny_model-shard1
 ┃ ┃ ┃ ┣ 📜face_landmark_68_tiny_model-weights_manifest.json
 ┃ ┃ ┃ ┣ 📜face_recognition_model-shard1
 ┃ ┃ ┃ ┣ 📜face_recognition_model-shard2
 ┃ ┃ ┃ ┣ 📜face_recognition_model-weights_manifest.json
 ┃ ┃ ┃ ┣ 📜mtcnn_model-shard1
 ┃ ┃ ┃ ┣ 📜mtcnn_model-weights_manifest.json
 ┃ ┃ ┃ ┣ 📜ssd_mobilenetv1_model-shard1
 ┃ ┃ ┃ ┣ 📜ssd_mobilenetv1_model-shard2
 ┃ ┃ ┃ ┣ 📜ssd_mobilenetv1_model-weights_manifest.json
 ┃ ┃ ┃ ┣ 📜tiny_face_detector_model-shard1
 ┃ ┃ ┃ ┗ 📜tiny_face_detector_model-weights_manifest.json
 ┃ ┣ 📂css
 ┃ ┃ ┗ 📜style.css
 ┃ ┣ 📂js
 ┃ ┃ ┣ 📜app.js
 ┃ ┃ ┣ 📜face-api.min.js
 ┃ ┃ ┗ 📜webcam.js
 ┃ ┗ 📜index.html
```

## Prerequisites

- Python 3.8+
- Node.js (for running frontend server)
- Web browser with webcam support
- GPU recommended for better performance (but not required)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Download and place the required model files:
   - Ensure all face-api.js models are in `frontend/assets/models/`
   - Place the sentiment classifier model in `backend/models/`

## Running the Application

1. Start the backend server:
   ```bash
   cd backend
   python app.py
   ```

2. Start the frontend server:
   ```bash
   cd frontend
   python -m http.server 8000
   ```

3. Access the application:
   - Open your web browser and navigate to `http://localhost:8000`
   - Allow webcam access when prompted

## API Endpoints

- `POST /analyze`: Sentiment analysis endpoint
  - Input: JSON with text field
  - Output: Sentiment prediction

- Additional endpoints documented in backend code

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

- face-api.js for facial emotion detection
- Spotify Million Song Dataset
- FER2023 dataset for facial emotion recognition
- Twitter sentiment dataset for sentiment analysis

## Future Improvements

- [ ] Add user profiles and personalized recommendations
- [ ] Implement music player integration
- [ ] Enhance emotion detection accuracy
- [ ] Add support for multiple languages
- [ ] Implement real-time collaborative filtering