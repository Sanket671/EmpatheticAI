from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sentiment_model import SentimentAnalyzer
from music_recommender import MusicRecommender
import os
import re

app = Flask(__name__)
CORS(app)

# Initialize models
sentiment_analyzer = SentimentAnalyzer()
music_recommender = MusicRecommender()

def map_old_to_new_emotion(emotion):
    """Map old sentiment labels to new emotion labels"""
    emotion_mapping = {
        'positive': 'happy',
        'negative': 'sad', 
        'neutral': 'neutral'
    }
    return emotion_mapping.get(emotion, emotion)

@app.route('/analyze', methods=['POST'])
def analyze_emotion():
    try:
        data = request.json
        print(f"📨 Received analysis request: {data}")
        
        # Text sentiment analysis
        text = data.get('text', '')
        text_emotion, text_confidence, mixed_emotions, sarcasm_score = sentiment_analyzer.predict(text)
        
        # Map old emotion labels to new ones if needed
        text_emotion = map_old_to_new_emotion(text_emotion)
        
        # Get facial emotion from frontend
        facial_emotion = data.get('facial_emotion', 'neutral')
        face_confidence = data.get('face_confidence', 0.5)
        
        print(f"🔍 Text analysis: {text_emotion} (confidence: {text_confidence})")
        print(f"🔍 Face analysis: {facial_emotion} (confidence: {face_confidence})")
        print(f"🎭 Mixed emotions: {mixed_emotions}")
        print(f"😏 Sarcasm score: {sarcasm_score}")
        
        # Get text length for reliability calculation
        text_length = len(text.strip())
        
        # Determine final emotion with intelligent fusion
        final_emotion, decision_reason, fusion_data, factor_details = determine_final_emotion(
            text_emotion, text_confidence, text_length,
            facial_emotion, face_confidence, text,
            mixed_emotions, sarcasm_score
        )
        
        print(f"🎯 Final emotion: {final_emotion}")
        print(f"🤔 Decision reason: {decision_reason}")
        print(f"📊 Fusion data: {fusion_data}")
        print(f"🔧 Factor details: {factor_details}")
        
        # Get empathetic response and music recommendation
        response = generate_empathetic_response(final_emotion, text, mixed_emotions, sarcasm_score)
        song_recommendation = music_recommender.recommend_song(final_emotion)
        
        result = {
            'text_emotion': text_emotion,
            'text_confidence': float(text_confidence),
            'facial_emotion': facial_emotion,
            'face_confidence': float(face_confidence),
            'final_emotion': final_emotion,
            'response': response,
            'song_recommendation': song_recommendation,
            'decision_reason': decision_reason,
            'fusion_data': fusion_data,
            'factor_details': factor_details,  # NEW: Add detailed factors
            'mixed_emotions': mixed_emotions,
            'sarcasm_detected': sarcasm_score > 0.6,
            'sarcasm_score': float(sarcasm_score),
            'status': 'success'
        }
        
        print(f"✅ Sending response: {result}")
        return jsonify(result)
    
    except Exception as e:
        print(f"❌ Error in analyze_emotion: {str(e)}")
        import traceback
        print(f"📝 Traceback: {traceback.format_exc()}")
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

def calculate_text_reliability(text_conf, text_length, emotion, text, mixed_emotions, sarcasm_score):
    """Calculate text reliability based on multiple factors with detailed tracking"""
    base_reliability = text_conf
    factors = {
        'base_confidence': float(text_conf),
        'length_boost': 0,
        'emotional_words_boost': 0,
        'contradiction_penalty': 0,
        'masking_boost': 0,
        'sarcasm_boost': 0,
        'mixed_emotion_penalty': 0
    }
    
    # Longer text = more reliable (up to 40% boost)
    length_factor = min(text_length / 100, 0.4)
    factors['length_boost'] = length_factor
    
    # Strong emotional words increase reliability
    strong_emotional_words = {
        'sad': ['heartbroken', 'devastated', 'miserable', 'hopeless', 'crying', 'tears', 'depressed', 'hurt'],
        'angry': ['furious', 'enraged', 'betrayed', 'hate', 'rage', 'angry', 'mad', 'upset'],
        'fear': ['terrified', 'panicked', 'anxious', 'frightened', 'scared', 'afraid', 'worried'],
        'happy': ['ecstatic', 'overjoyed', 'thrilled', 'blissful', 'excited', 'joy', 'happy', 'good'],
        'disgust': ['disgusted', 'repulsed', 'revolted', 'gross', 'nasty'],
        'surprise': ['shocked', 'surprised', 'amazed', 'astonished', 'unexpected']
    }
    
    emotion_strength = 0
    if emotion in strong_emotional_words:
        words = text.lower().split()
        emotion_strength = sum(1 for word in words if word in strong_emotional_words[emotion])
        emotion_strength = min(emotion_strength * 0.1, 0.3)  # Max 30% boost
    factors['emotional_words_boost'] = emotion_strength
    
    # Contradictions decrease reliability (sad text with happy words/emojis)
    contradiction_penalty = 0
    if emotion in ['sad', 'angry', 'fear'] and any(happy_word in text.lower() for happy_word in ['happy', 'good', 'great', 'joy', '😊', ':)', '😂']):
        contradiction_penalty = -0.2
    factors['contradiction_penalty'] = contradiction_penalty
    
    # Explicit masking statements increase text reliability
    masking_boost = 0
    masking_phrases = ['crying inside', 'smiling outside', 'hiding my feelings', 'putting on a brave face']
    if any(phrase in text.lower() for phrase in masking_phrases):
        masking_boost = 0.3
    factors['masking_boost'] = masking_boost
    
    # Sarcasm detection increases text reliability for negative emotions
    sarcasm_boost = 0
    if sarcasm_score > 0.6 and emotion in ['sad', 'angry', 'fear']:
        sarcasm_boost = 0.4
    factors['sarcasm_boost'] = sarcasm_boost
    
    # Mixed emotions slightly decrease reliability (more complex interpretation)
    mixed_emotion_penalty = -0.1 if mixed_emotions else 0
    factors['mixed_emotion_penalty'] = mixed_emotion_penalty
    
    final_reliability = base_reliability + length_factor + emotion_strength + contradiction_penalty + masking_boost + sarcasm_boost + mixed_emotion_penalty
    final_reliability = max(0.1, min(1.0, final_reliability))
    
    print(f"📝 Text reliability factors: {factors}")
    print(f"📝 Text reliability: base={base_reliability}, final={final_reliability}")
    
    return final_reliability, factors

def calculate_face_reliability(face_conf, emotion):
    """Calculate face reliability considering emotional authenticity with detailed tracking"""
    base_reliability = face_conf
    factors = {
        'base_confidence': float(face_conf),
        'authenticity_factor': 0,
        'final_reliability': 0
    }
    
    # Some emotions are easier to fake than others
    authenticity_factors = {
        'happy': 0.7,      # Easy to fake smile
        'neutral': 0.3,    # Often masks true feelings
        'sad': 0.8,        # Harder to fake genuine sadness
        'angry': 0.75,     # Hard to fake subtle anger
        'fear': 0.7,       # Complex emotion
        'surprise': 0.8,   # Genuine surprise has specific markers
        'disgust': 0.8     # Hard to fake subtle disgust
    }
    
    emotion_factor = authenticity_factors.get(emotion, 0.5)
    factors['authenticity_factor'] = emotion_factor
    
    final_reliability = base_reliability * emotion_factor
    factors['final_reliability'] = final_reliability
    
    print(f"😊 Face reliability factors: {factors}")
    
    return final_reliability, factors

def detect_emotional_masking(text_emotion, text_conf, facial_emotion, face_conf, text, sarcasm_score):
    """Detect if user might be masking true emotions"""
    masking_indicators = []
    masking_details = []
    
    # Strong negative text with positive/neutral face
    if (text_emotion in ['sad', 'angry', 'fear'] and text_conf > 0.6 and 
        facial_emotion in ['happy', 'neutral'] and face_conf < 0.7):
        masking_indicators.append("strong_negative_text_with_neutral_face")
        masking_details.append("Your words show strong negative emotions but your face appears neutral/happy")
    
    # Minimization language
    minimization_phrases = ["i'm fine", "it's okay", "no problem", "i'm good", "everything's fine", "don't worry"]
    if any(phrase in text.lower() for phrase in minimization_phrases) and text_emotion in ['sad', 'angry', 'fear']:
        masking_indicators.append("minimization_language_detected")
        masking_details.append("You used minimizing language while expressing difficult emotions")
    
    # Excessive positive emojis in negative context
    if text_emotion in ['sad', 'angry', 'fear'] and ('😊' in text or ':)' in text or '😂' in text or '😄' in text):
        masking_indicators.append("incongruent_emojis")
        masking_details.append("Positive emojis used in negative emotional context")
    
    # Explicit masking statements
    masking_phrases = ["crying inside", "smiling outside", "hiding my feelings", "putting on a brave face"]
    if any(phrase in text.lower() for phrase in masking_phrases):
        masking_indicators.append("explicit_masking_statement")
        masking_details.append("You explicitly mentioned hiding or masking your feelings")
    
    # Sarcasm as a form of emotional masking
    if sarcasm_score > 0.7:
        masking_indicators.append("sarcasm_detected")
        masking_details.append(f"Sarcastic tone detected ({sarcasm_score*100:.1f}% confidence)")
    
    print(f"🎭 Masking indicators: {masking_indicators}")
    return masking_indicators, masking_details

def determine_final_emotion(text_emotion, text_conf, text_length, facial_emotion, face_conf, text, mixed_emotions, sarcasm_score):
    """Intelligent emotion fusion with masking and sarcasm detection - RETURN FACTOR DETAILS"""
    
    # Ensure emotions are valid
    valid_emotions = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
    if text_emotion not in valid_emotions:
        text_emotion = 'neutral'
    if facial_emotion not in valid_emotions:
        facial_emotion = 'neutral'
    
    # Calculate reliability scores WITH FACTOR TRACKING
    text_reliability, text_factors = calculate_text_reliability(text_conf, text_length, text_emotion, text, mixed_emotions, sarcasm_score)
    face_reliability, face_factors = calculate_face_reliability(face_conf, facial_emotion)
    
    # Check for emotional masking
    masking_indicators, masking_details = detect_emotional_masking(text_emotion, text_conf, facial_emotion, face_conf, text, sarcasm_score)
    
    # Context-aware weighting with enhanced logic - TRACK BASE WEIGHTS
    base_text_weight = 0.5
    base_face_weight = 0.5
    weight_adjustment_reason = "Balanced base weights"
    
    if sarcasm_score > 0.7:
        base_text_weight = 0.9
        base_face_weight = 0.1
        weight_adjustment_reason = "High sarcasm detected - text prioritized"
    elif text_length > 50:  # Substantial text input
        base_text_weight = 0.7
        base_face_weight = 0.3
        weight_adjustment_reason = "Substantial text input - text weighted more"
    elif face_conf > 0.8 and text_length < 10:  # Very clear face, little text
        base_text_weight = 0.2
        base_face_weight = 0.8
        weight_adjustment_reason = "Strong facial expression with minimal text - face weighted more"
    elif masking_indicators:  # Possible masking detected
        base_text_weight = 0.8
        base_face_weight = 0.2
        weight_adjustment_reason = "Emotional masking suspected - text trusted more"
    elif mixed_emotions:  # Mixed emotions detected
        base_text_weight = 0.6
        base_face_weight = 0.4
        weight_adjustment_reason = "Mixed emotions detected - complex analysis"
    
    print(f"⚖️ Base weights: text={base_text_weight:.3f}, face={base_face_weight:.3f} - {weight_adjustment_reason}")
    
    # Apply reliability-adjusted weights
    text_final_weight = base_text_weight * text_reliability
    face_final_weight = base_face_weight * face_reliability
    
    # Normalize weights
    total_weight = text_final_weight + face_final_weight
    if total_weight > 0:
        text_final_weight /= total_weight
        face_final_weight /= total_weight
    
    print(f"⚖️ Final weights: text={text_final_weight:.3f}, face={face_final_weight:.3f}")
    
    # Create detailed factor explanation
    factor_details = {
        'weight_calculation': {
            'base_text_weight': float(base_text_weight),
            'base_face_weight': float(base_face_weight),
            'weight_adjustment_reason': weight_adjustment_reason,
            'text_reliability_used': float(text_reliability),
            'face_reliability_used': float(face_reliability),
            'final_text_weight': float(text_final_weight),
            'final_face_weight': float(face_final_weight)
        },
        'text_reliability_factors': text_factors,
        'face_reliability_factors': face_factors,
        'masking_indicators_details': masking_details,
        'context_factors': {
            'text_length': text_length,
            'sarcasm_score': float(sarcasm_score),
            'mixed_emotions_detected': bool(mixed_emotions),
            'face_confidence_original': float(face_conf),
            'text_confidence_original': float(text_conf)
        }
    }
    
    # Handle mixed emotions specially
    if mixed_emotions:
        primary, secondary = mixed_emotions
        # For mixed emotions, we might choose the more intense or contextually appropriate one
        emotion_intensity = {
            'angry': 5, 'fear': 4, 'sad': 4, 'surprise': 3, 'disgust': 3, 'happy': 3, 'neutral': 1
        }
        
        # Choose the more intense emotion from the mix
        if emotion_intensity.get(primary, 0) >= emotion_intensity.get(secondary, 0):
            final_emotion = primary
        else:
            final_emotion = secondary
        
        decision_reason = f"mixed_emotion_resolved_{primary}_{secondary}"
    
    # If both agree
    elif text_emotion == facial_emotion:
        final_emotion = text_emotion
        decision_reason = "both_modalities_agree"
    
    # If text shows strong negative but face shows positive/neutral (potential masking)
    elif (text_emotion in ['sad', 'angry', 'fear'] and text_conf > 0.6 and 
          facial_emotion in ['happy', 'neutral'] and face_conf < 0.7):
        final_emotion = text_emotion
        decision_reason = "text_trusted_potential_masking"
    
    # High sarcasm overrides facial expression
    elif sarcasm_score > 0.7 and text_emotion in ['sad', 'angry', 'fear']:
        final_emotion = text_emotion
        decision_reason = "sarcasm_overrides_face"
    
    # Weighted decision for other cases
    else:
        emotions = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
        scores = {emotion: 0 for emotion in emotions}
        
        scores[text_emotion] += text_final_weight
        scores[facial_emotion] += face_final_weight
        
        final_emotion = max(scores, key=scores.get)
        decision_reason = "weighted_combination"
    
    fusion_data = {
        'text_weight': float(text_final_weight),
        'face_weight': float(face_final_weight),
        'text_reliability': float(text_reliability),
        'face_reliability': float(face_reliability),
        'masking_indicators': masking_indicators,
        'decision_context': weight_adjustment_reason.lower().replace(' ', '_')
    }
    
    return final_emotion, decision_reason, fusion_data, factor_details

def generate_empathetic_response(emotion, user_text, mixed_emotions, sarcasm_score):
    """Generate empathetic response based on detected emotion with enhanced understanding"""
    
    # Base responses (keep your existing response logic)
    base_responses = {
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
        # ... keep your existing response arrays
        'neutral': [
            "Thanks for sharing that with me. How are you really feeling today?",
            "I appreciate you opening up. Is there anything specific on your mind?",
            "I'm here to listen whenever you're ready to share more."
        ]
    }
    
    # Enhanced responses for special cases (keep your existing logic)
    if sarcasm_score > 0.7:
        sarcasm_responses = [
            "I sense there might be some sarcasm in your words. It sounds like you're actually feeling pretty frustrated.",
            "That sounds like it might be sarcastic. Sometimes we use humor or sarcasm when we're dealing with difficult feelings.",
            "I hear the sarcasm in your tone. Would you like to talk about what's really bothering you?"
        ]
        return np.random.choice(sarcasm_responses)
    
    if mixed_emotions:
        primary, secondary = mixed_emotions
        mixed_responses = [
            f"I can sense you're feeling both {primary} and {secondary}. That sounds like a complex emotional experience.",
            f"It seems like you're experiencing a mix of {primary} and {secondary}. Would you like to explore these feelings more?",
            f"Having mixed feelings of {primary} and {secondary} is completely normal. Let's talk through what you're experiencing."
        ]
        return np.random.choice(mixed_responses)
    
    # Special handling for masking
    if 'crying inside' in user_text.lower() or 'smiling outside' in user_text.lower():
        masking_responses = [
            "It sounds like you might be putting on a brave face while hurting inside. Your true feelings matter.",
            "I hear that you're smiling on the outside but might be feeling different inside. It's okay to show your real emotions.",
            "Sometimes we smile to protect others, but it's important to acknowledge what we're truly feeling."
        ]
        return np.random.choice(masking_responses)
    
    # Select response based on emotion
    emotion_responses = base_responses.get(emotion, base_responses['neutral'])
    return np.random.choice(emotion_responses)

if __name__ == '__main__':
    print("Starting EmpatheticAI Server...")
    print("Sentiment model loading...")
    app.run(debug=True, port=5000, host='0.0.0.0')