import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense, Dropout, Embedding, LSTM, Bidirectional, GlobalAveragePooling1D
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import re
import pickle
import os

class SentimentAnalyzer:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.label_encoder = None
        self.max_sequence_length = 100
        self.vocab_size = 10000
        self.embedding_dim = 100

        # Enhanced emotion lexicon with sarcasm and mixed emotion detection
        self.emotion_lexicon = {
            'angry': {
                'words': ['angry', 'mad', 'furious', 'rage', 'hate', 'frustrated', 'irritated', 'annoyed', 'pissed', 'upset', 'livid'],
                'weight': 1.0,
                'intensity': 'high'
            },
            'disgust': {
                'words': ['disgust', 'disgusting', 'gross', 'nasty', 'revolting', 'sickening', 'repulsive', 'hate'],
                'weight': 0.9,
                'intensity': 'medium'
            },
            'fear': {
                'words': ['scared', 'afraid', 'terrified', 'fear', 'anxious', 'worried', 'nervous', 'panic', 'anxiety', 'frightened'],
                'weight': 0.9,
                'intensity': 'high'
            },
            'happy': {
                'words': ['happy', 'joy', 'excited', 'delighted', 'pleased', 'ecstatic', 'thrilled', 'wonderful', 'good', 'great', 'amazing'],
                'weight': 1.0,
                'intensity': 'high'
            },
            'sad': {
                'words': ['sad', 'unhappy', 'depressed', 'miserable', 'heartbroken', 'sorrow', 'grief', 'tears', 'crying', 'hurt', 'devastated'],
                'weight': 1.0,
                'intensity': 'high'
            },
            'surprise': {
                'words': ['surprised', 'shocked', 'amazed', 'astonished', 'unexpected', 'wow', 'surprise', 'stunned'],
                'weight': 0.8,
                'intensity': 'medium'
            },
            'neutral': {
                'words': ['okay', 'fine', 'alright', 'normal', 'regular', 'usual', 'meh', 'whatever'],
                'weight': 0.5,
                'intensity': 'low'
            }
        }

        # Sarcasm indicators
        self.sarcasm_indicators = {
            'excessive_positive': ['so happy', 'just wonderful', 'fantastic', 'perfect', 'great job', 'amazing', 'lovely'],
            'contrast_words': ['but', 'however', 'although', 'yet', 'except'],
            'sarcastic_phrases': ['oh great', 'wow amazing', 'just what i needed', 'fantastic news', 'wonderful timing'],
            'exaggeration': ['best day ever', 'absolutely thrilled', 'completely overjoyed', 'extremely happy']
        }

        # Mixed emotion patterns
        self.mixed_emotion_patterns = {
            'bittersweet': [('happy', 'sad'), ('excited', 'nervous'), ('proud', 'sad')],
            'anxious_excitement': [('excited', 'fear'), ('happy', 'anxious')],
            'angry_sad': [('angry', 'sad'), ('frustrated', 'disappointed')]
        }

        print("🔄 Using enhanced emotion analyzer with sarcasm detection...")
        self.setup_fallback()

    def setup_fallback(self):
        """Configure enhanced keyword-based sentiment analyzer"""
        self.model = None
        self.tokenizer = None
        try:
            self.label_encoder = LabelEncoder()
            self.label_encoder.fit(['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral'])
        except Exception as e:
            print(f"Label encoder setup failed: {e}")
            self.label_encoder = None

    def preprocess_text(self, text):
        """Clean and preprocess text data"""
        if not isinstance(text, str):
            return ""
        
        text = text.lower()
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def detect_sarcasm(self, text):
        """Enhanced sarcasm detection using multiple indicators"""
        processed_text = text.lower()
        sarcasm_score = 0
        
        # Check for excessive positive language in negative context
        positive_words_in_negative = 0
        negative_context_indicators = ['not', "don't", "can't", "won't", 'never', 'bad', 'terrible', 'awful']
        
        for phrase in self.sarcasm_indicators['excessive_positive']:
            if phrase in processed_text:
                sarcasm_score += 0.3
                # If excessive positive phrase appears with negative context, higher sarcasm
                if any(neg in processed_text for neg in negative_context_indicators):
                    sarcasm_score += 0.4
        
        # Check for contrast words that might indicate sarcasm
        contrast_count = sum(1 for word in self.sarcasm_indicators['contrast_words'] if word in processed_text)
        sarcasm_score += contrast_count * 0.2
        
        # Check for specific sarcastic phrases
        for phrase in self.sarcasm_indicators['sarcastic_phrases']:
            if phrase in processed_text:
                sarcasm_score += 0.5
        
        # Check for exaggeration in emotional language
        for phrase in self.sarcasm_indicators['exaggeration']:
            if phrase in processed_text:
                sarcasm_score += 0.4
        
        # Punctuation analysis - multiple exclamation marks can indicate sarcasm
        if processed_text.count('!') > 2:
            sarcasm_score += 0.3
        
        # Contextual clues - if text says positive but has angry/sad indicators
        angry_sad_indicators = ['angry', 'mad', 'sad', 'upset', 'frustrated', 'annoyed']
        if any(indicator in processed_text for indicator in angry_sad_indicators) and any(positive in processed_text for positive in ['happy', 'good', 'great']):
            sarcasm_score += 0.4
        
        return min(sarcasm_score, 1.0)

    def detect_mixed_emotions(self, emotion_scores):
        """Detect if multiple emotions are strongly present"""
        # Get top 2 emotions
        sorted_emotions = sorted(emotion_scores.items(), key=lambda x: x[1], reverse=True)
        if len(sorted_emotions) < 2:
            return None
        
        top_emotion, top_score = sorted_emotions[0]
        second_emotion, second_score = sorted_emotions[1]
        
        # If second emotion is within 30% of top emotion, consider it mixed
        if second_score > 0 and top_score > 0 and (second_score / top_score) > 0.7:
            return (top_emotion, second_emotion)
        
        return None

    def enhanced_emotion_analysis(self, text):
        """Enhanced emotion analysis with sarcasm and mixed emotion detection"""
        processed_text = self.preprocess_text(text)
        words = processed_text.split()
        
        emotion_scores = {emotion: 0 for emotion in self.emotion_lexicon.keys()}

        # ────── NEW: collect matched keywords ──────
        matched_keywords = []
        # ───────────────────────────────────────────
        
        # Score each word
        for word in words:
            for emotion, data in self.emotion_lexicon.items():
                if word in data['words']:
                    emotion_scores[emotion] += data['weight']
                    matched_keywords.append(word)   # NEW
        
        # Boost scores for emotional phrases and patterns
        emotional_phrases = {
            'angry': ['so angry', 'very mad', 'extremely frustrated', 'pissed off', 'losing my mind'],
            'sad': ['so sad', 'very unhappy', 'extremely depressed', 'crying my eyes', 'heart broken', 'feeling empty'],
            'fear': ['so scared', 'very afraid', 'terrified of', 'anxious about', 'panic attack'],
            'happy': ['so happy', 'very excited', 'extremely joyful', 'over the moon', 'thrilled to'],
            'disgust': ['so disgusting', 'completely grossed', 'totally repulsed'],
            'surprise': ['completely shocked', 'totally surprised', 'absolutely amazed']
        }
        
        for emotion, phrases in emotional_phrases.items():
            for phrase in phrases:
                if phrase in processed_text:
                    emotion_scores[emotion] += 2.0  # Significant boost for phrases
        
        # Special handling for masking patterns
        if 'crying inside' in processed_text or 'smiling outside' in processed_text:
            emotion_scores['sad'] += 3.0
        if 'i\'m fine' in processed_text and any(word in processed_text for word in ['sad', 'angry', 'hurt', 'depressed']):
            emotion_scores['sad'] += 2.0
        
        # Detect sarcasm
        sarcasm_score = self.detect_sarcasm(text)
        if sarcasm_score > 0.6:
            # If sarcasm detected and dominant emotion is positive, flip to negative
            dominant_emotion = max(emotion_scores, key=emotion_scores.get)
            if dominant_emotion in ['happy', 'surprise']:
                # Reduce positive emotion score, boost negative emotions
                emotion_scores[dominant_emotion] *= 0.3
                emotion_scores['angry'] += emotion_scores[dominant_emotion] * 2
                emotion_scores['sad'] += emotion_scores[dominant_emotion] * 1.5
        
        # Detect mixed emotions
        mixed_emotions = self.detect_mixed_emotions(emotion_scores)
        
        # Normalize scores
        if words:
            for emotion in emotion_scores:
                emotion_scores[emotion] = emotion_scores[emotion] / len(words) * 10
        
        # Find dominant emotion
        dominant_emotion = max(emotion_scores, key=emotion_scores.get)
        max_score = emotion_scores[dominant_emotion]
        
        # Handle mixed emotions by adjusting confidence
        if mixed_emotions and max_score > 0:
            primary, secondary = mixed_emotions
            confidence = min(max_score / 8.0, 1.0)
            return dominant_emotion, confidence, mixed_emotions, sarcasm_score, matched_keywords   # NEW: include keywords
        else:
            if max_score > 0:
                confidence = min(max_score / 5.0, 1.0)
            else:
                dominant_emotion = 'neutral'
                confidence = 0.3
        
        valid_emotions = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
        if dominant_emotion not in valid_emotions:
            dominant_emotion = 'neutral'
        
        return dominant_emotion, confidence, None, sarcasm_score, matched_keywords   # NEW
    
    def predict(self, text):
        """Predict emotion of input text with enhanced analysis"""
        if not text or not text.strip():
            return "neutral", 0.3, None, 0.0, []               # NEW: empty list for keywords
        
        # Use enhanced emotion analysis (bypassing TensorFlow model for now)
        emotion, confidence, mixed, sarcasm, keywords = self.enhanced_emotion_analysis(text)   # NEW
        return emotion, confidence, mixed, sarcasm, keywords                                    # NEW
    
    def save_model(self, model_path, tokenizer_path, encoder_path):
        """Save model, tokenizer and encoder"""
        os.makedirs('models', exist_ok=True)
        if self.model:
            self.model.save(model_path)
        if self.tokenizer:
            with open(tokenizer_path, 'wb') as f:
                pickle.dump(self.tokenizer, f)
        if self.label_encoder:
            with open(encoder_path, 'wb') as f:
                pickle.dump(self.label_encoder, f)
    
    def load_model(self, model_path, tokenizer_path, encoder_path):
        """Load model, tokenizer and encoder"""
        try:
            self.model = load_model(model_path)
            with open(tokenizer_path, 'rb') as f:
                self.tokenizer = pickle.load(f)
            with open(encoder_path, 'rb') as f:
                self.label_encoder = pickle.load(f)
            print("✅ Model loaded successfully")
        except Exception as e:
            print(f"❌ Model loading failed: {e}")
            self.setup_fallback()