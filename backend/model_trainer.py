import os
import sys
sys.path.append('.')

from sentiment_model import SentimentAnalyzer
from emotion_model import EmotionRecognizer

def train_models():
    """Train both sentiment and emotion models"""
    print("Training Sentiment Model...")
    sentiment_model = SentimentAnalyzer()
    
    print("Training Emotion Model...")
    emotion_model = EmotionRecognizer()
    
    print("All models trained successfully!")

if __name__ == "__main__":
    train_models()