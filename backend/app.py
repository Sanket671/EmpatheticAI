from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sentiment_model import SentimentAnalyzer
from music_recommender import MusicRecommender
import os

app = Flask(__name__)
CORS(app)

# Initialize models (only sentiment now)
sentiment_analyzer = SentimentAnalyzer()
music_recommender = MusicRecommender()

@app.route('/analyze', methods=['POST'])
def analyze_emotion():
    try:
        data = request.json
        
        # Text sentiment analysis
        text = data.get('text', '')
        text_sentiment, text_confidence = sentiment_analyzer.predict(text)
        
        # Get facial emotion from frontend (face-api.js)
        facial_emotion = data.get('facial_emotion', 'neutral')
        face_confidence = data.get('face_confidence', 0.5)
        
        # Determine final emotion
        final_emotion = determine_final_emotion(
            text_sentiment, text_confidence,
            facial_emotion, face_confidence
        )
        
        # Get empathetic response and music recommendation
        response = generate_empathetic_response(final_emotion, text)
        song_recommendation = music_recommender.recommend_song(final_emotion)
        
        return jsonify({
            'text_sentiment': text_sentiment,
            'text_confidence': float(text_confidence),
            'facial_emotion': facial_emotion,
            'face_confidence': float(face_confidence),
            'final_emotion': final_emotion,
            'response': response,
            'song_recommendation': song_recommendation,
            'status': 'success'
        })
    
    except Exception as e:
        print(f"Error in analyze_emotion: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'EmpatheticAI backend is running'})

@app.route('/recommend_music', methods=['POST'])
def recommend_music():
    """Direct music recommendation endpoint based on emotion"""
    try:
        data = request.json
        emotion = data.get('emotion', 'neutral')
        song_recommendation = music_recommender.recommend_song(emotion)
        return jsonify(song_recommendation)
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

def determine_final_emotion(text_sentiment, text_conf, facial_emotion, face_conf):
    """Combine text and facial analysis using confidence weights"""
    
    # If face confidence is high, prioritize facial emotion
    if face_conf > 0.6:
        return facial_emotion
    # If text confidence is high, use text sentiment
    elif text_conf > 0.7:
        return text_sentiment
    # If both are low confidence, default to neutral
    elif text_conf < 0.4 and face_conf < 0.4:
        return "neutral"
    # Otherwise use the one with higher confidence
    else:
        return facial_emotion if face_conf > text_conf else text_sentiment

def generate_empathetic_response(emotion, user_text):
    """Generate empathetic response based on detected emotion"""
    
    responses = {
        'happy': [
            "I'm glad to hear you're feeling positive! It's wonderful to see you in good spirits.",
            "Your happiness is contagious! It's great to see you feeling so upbeat.",
            "That sounds amazing! I'm really happy for you."
        ],
        'sad': [
            "I'm sorry you're feeling this way. It's okay to feel sad sometimes.",
            "That sounds really tough. I'm here to listen if you want to talk more.",
            "I can sense you're going through a difficult time. Remember, you're not alone."
        ],
        'angry': [
            "I can understand why you'd feel frustrated. Would you like to talk about what's bothering you?",
            "It sounds like you're dealing with a lot right now. Let's work through this together.",
            "I hear the frustration in your words. It's completely valid to feel this way."
        ],
        'fear': [
            "That sounds scary. I'm here with you, and we can face this together.",
            "It's completely normal to feel afraid sometimes. You're stronger than you think.",
            "I can sense your concern. Remember to breathe - you've got this."
        ],
        'disgust': [
            "That sounds unpleasant. I'm here to help you process these feelings.",
            "I understand this might be hard to deal with. Let's talk through it.",
            "It's okay to feel repulsed by certain things. Your feelings are valid."
        ],
        'neutral': [
            "Thanks for sharing that with me. How are you really feeling today?",
            "I appreciate you opening up. Is there anything specific on your mind?",
            "I'm here to listen whenever you're ready to share more."
        ],
        'surprise': [
            "Wow, that sounds unexpected! How are you processing everything?",
            "That's quite surprising! I'm here to help you make sense of it all.",
            "What an unexpected turn! Let's navigate this together."
        ],
        'positive': [
            "I'm glad to hear you're feeling positive! It's wonderful to see you in good spirits.",
            "Your positive energy is inspiring! Keep embracing those good vibes.",
            "That's fantastic! It's great to hear you're feeling so positive."
        ],
        'negative': [
            "I'm sorry you're feeling down. Remember that difficult moments pass.",
            "I hear the pain in your words. It's okay to not be okay sometimes.",
            "Thank you for sharing this with me. I'm here to support you."
        ]
    }
    
    # Select response based on emotion
    emotion_responses = responses.get(emotion, responses['neutral'])
    return np.random.choice(emotion_responses)

if __name__ == '__main__':
    print("Starting EmpatheticAI Server...")
    print("Sentiment model loading...")
    app.run(debug=True, port=5000, host='0.0.0.0')