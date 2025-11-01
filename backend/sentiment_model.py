import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense, Dropout, Embedding, LSTM, Bidirectional
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

        # Paths to persisted artifacts
        model_path = 'models/sentiment_classifier_1.h5'
        tokenizer_path = 'models/sentiment_tokenizer.pkl'
        encoder_path = 'models/sentiment_encoder.pkl'

        # If all artifacts exist, try to load them. If loading fails or any
        # artifact is missing, do NOT start training here (it blocks startup).
        # Instead configure a lightweight fallback analyzer so the Flask app
        # can start quickly and handle requests.
        if os.path.exists(model_path) and os.path.exists(tokenizer_path) and os.path.exists(encoder_path):
            try:
                self.load_model(model_path, tokenizer_path, encoder_path)
            except Exception as e:
                print(f"Failed to load saved sentiment model: {e}")
                print("Falling back to lightweight sentiment analyzer.")
                self.setup_fallback()
        else:
            print("Trained sentiment model/tokenizer not found. Using lightweight fallback analyzer.")
            self.setup_fallback()

    def setup_fallback(self):
        """Configure a simple keyword-based sentiment analyzer used when
        the TensorFlow model is not available. This avoids training at
        server start and keeps the service responsive."""
        # No TF model or tokenizer
        self.model = None
        self.tokenizer = None
        # Prepare a simple label encoder that maps indices to labels
        try:
            self.label_encoder = LabelEncoder()
            self.label_encoder.fit(['negative', 'neutral', 'positive'])
        except Exception:
            # LabelEncoder is only used when a TF model exists; fallback can operate without it
            self.label_encoder = None

        # Define simple positive/negative keyword sets
        self._positive_keywords = set([
            'good', 'great', 'happy', 'joy', 'amazing', 'love', 'wonderful', 'excellent', 'best', 'awesome', 'glad'
        ])
        self._negative_keywords = set([
            'bad', 'sad', 'terrible', 'hate', 'awful', 'worst', 'angry', 'depress', 'sucks', 'pain', 'upset'
        ])
    
    def preprocess_text(self, text):
        """Clean and preprocess text data"""
        if not isinstance(text, str):
            return ""
        
        text = text.lower()
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def create_model(self):
        """Create LSTM-based sentiment analysis model"""
        model = Sequential([
            Embedding(self.vocab_size, self.embedding_dim, input_length=self.max_sequence_length),
            Bidirectional(LSTM(64, return_sequences=True)),
            Dropout(0.3),
            Bidirectional(LSTM(32)),
            Dropout(0.3),
            Dense(64, activation='relu'),
            Dropout(0.2),
            Dense(32, activation='relu'),
            Dense(3, activation='softmax')  # positive, negative, neutral
        ])
        
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def load_sentiment_dataset(self):
        """Load and preprocess the Sentiment140 dataset"""
        print("Loading Sentiment140 dataset...")
        
        try:
            # Load the dataset
            df = pd.read_csv('../datasets/training.1600000.processed.noemoticon.csv', 
                           encoding='latin-1', header=None)
            
            # The dataset has columns: target, ids, date, flag, user, text
            df.columns = ['target', 'ids', 'date', 'flag', 'user', 'text']
            
            # Map target to sentiment (0: negative, 2: neutral, 4: positive)
            # For this dataset, we only have negative (0) and positive (4)
            # We'll sample to get balanced classes and add some neutral samples
            negative_samples = df[df['target'] == 0].sample(n=10000, random_state=42)
            positive_samples = df[df['target'] == 4].sample(n=10000, random_state=42)
            
            # Create some neutral samples from the data
            neutral_texts = [
                "I went to the store today",
                "The weather is normal today",
                "I completed my work tasks",
                "Today was a regular day",
                "I had lunch at the usual time",
                "The meeting proceeded as planned",
                "I read a book for about an hour",
                "Today followed the normal routine",
                "I walked the dog around the neighborhood",
                "It was an average day with typical activities"
            ] * 2000  # Multiply to get enough samples
            
            # Combine all data
            texts = list(negative_samples['text'].values) + list(positive_samples['text'].values) + neutral_texts[:20000]
            labels = ['negative'] * len(negative_samples) + ['positive'] * len(positive_samples) + ['neutral'] * 20000
            
            return texts, labels
            
        except Exception as e:
            print(f"Error loading dataset: {e}")
            print("Using fallback dataset...")
            return self.generate_fallback_data()
    
    def generate_fallback_data(self):
        """Generate fallback sentiment data"""
        print("Generating fallback sentiment data...")
        
        positive_texts = [
            "I had an amazing day today! Everything went perfectly.",
            "I'm so happy and excited about this wonderful news!",
            "This is absolutely fantastic and incredible!",
            "I feel great and everything is going well for me.",
            "What a beautiful day full of joy and happiness!",
            "I'm thrilled with the results and very satisfied.",
            "This makes me so happy and content with life.",
            "Wonderful experience that brought me so much joy!",
            "I'm overjoyed and everything feels perfect.",
            "Such a positive and uplifting moment in my life!"
        ] * 1000
        
        negative_texts = [
            "I had a terrible day and everything went wrong.",
            "I'm feeling so sad and disappointed right now.",
            "This is absolutely awful and heartbreaking.",
            "I feel miserable and nothing is going right.",
            "What a horrible day full of sadness and pain.",
            "I'm devastated by this terrible news.",
            "This makes me so unhappy and frustrated.",
            "Awful experience that left me feeling empty.",
            "I'm heartbroken and everything feels wrong.",
            "Such a negative and depressing situation."
        ] * 1000
        
        neutral_texts = [
            "I went to the store today to buy some groceries.",
            "The weather is normal today, not too hot or cold.",
            "I completed my work tasks as scheduled.",
            "Today was a regular day with nothing special.",
            "I had lunch at the usual time with regular food.",
            "The meeting proceeded as planned without issues.",
            "I read a book for about an hour this evening.",
            "Today followed the normal routine without changes.",
            "I walked the dog around the neighborhood park.",
            "It was an average day with typical activities."
        ] * 1000
        
        texts = positive_texts + negative_texts + neutral_texts
        labels = ['positive'] * len(positive_texts) + ['negative'] * len(negative_texts) + ['neutral'] * len(neutral_texts)
        
        return texts, labels
    
    def train_model(self):
        """Train the sentiment analysis model"""
        print("Training sentiment analysis model...")
        
        # Load dataset
        texts, labels = self.load_sentiment_dataset()
        
        # Preprocess texts
        processed_texts = [self.preprocess_text(text) for text in texts]
        
        # Initialize and fit tokenizer
        self.tokenizer = Tokenizer(num_words=self.vocab_size, oov_token='<OOV>')
        self.tokenizer.fit_on_texts(processed_texts)
        
        # Convert texts to sequences
        sequences = self.tokenizer.texts_to_sequences(processed_texts)
        padded_sequences = pad_sequences(sequences, maxlen=self.max_sequence_length)
        
        # Encode labels
        self.label_encoder = LabelEncoder()
        encoded_labels = self.label_encoder.fit_transform(labels)
        categorical_labels = tf.keras.utils.to_categorical(encoded_labels)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            padded_sequences, categorical_labels, test_size=0.2, random_state=42
        )
        
        # Create and train model
        self.model = self.create_model()
        
        print("Starting model training...")
        history = self.model.fit(
            X_train, y_train,
            epochs=10,
            batch_size=32,
            validation_data=(X_test, y_test),
            verbose=1
        )
        
        print("Sentiment model training completed!")
    
    def predict(self, text):
        """Predict sentiment of input text"""
        if not text or not text.strip():
            return "neutral", 0.5
        # If the TF model is not loaded, use a lightweight fallback keyword-based predictor
        if self.model is None:
            try:
                processed_text = self.preprocess_text(text)
                words = set(processed_text.split())
                pos_hits = len(words & self._positive_keywords)
                neg_hits = len(words & self._negative_keywords)

                if pos_hits == 0 and neg_hits == 0:
                    return 'neutral', 0.5
                elif pos_hits >= neg_hits:
                    conf = min(0.6 + 0.1 * pos_hits, 0.95)
                    return 'positive', conf
                else:
                    conf = min(0.6 + 0.1 * neg_hits, 0.95)
                    return 'negative', conf
            except Exception as e:
                print(f"Fallback sentiment prediction error: {e}")
                return 'neutral', 0.5

        # Otherwise use the full TF model
        try:
            processed_text = self.preprocess_text(text)
            sequence = self.tokenizer.texts_to_sequences([processed_text])
            if not sequence or len(sequence[0]) == 0:
                return "neutral", 0.5

            padded_sequence = pad_sequences(sequence, maxlen=self.max_sequence_length)
            prediction = self.model.predict(padded_sequence, verbose=0)
            sentiment_idx = np.argmax(prediction)
            confidence = np.max(prediction)
            sentiment = self.label_encoder.inverse_transform([sentiment_idx])[0]
            return sentiment, confidence
        except Exception as e:
            print(f"Error in sentiment prediction: {e}")
            return "neutral", 0.5
    
    def save_model(self, model_path, tokenizer_path, encoder_path):
        """Save model, tokenizer and encoder"""
        os.makedirs('models', exist_ok=True)
        self.model.save(model_path)
        with open(tokenizer_path, 'wb') as f:
            pickle.dump(self.tokenizer, f)
        with open(encoder_path, 'wb') as f:
            pickle.dump(self.label_encoder, f)
    
    def load_model(self, model_path, tokenizer_path, encoder_path):
        """Load model, tokenizer and encoder"""
        self.model = load_model(model_path)
        with open(tokenizer_path, 'rb') as f:
            self.tokenizer = pickle.load(f)
        with open(encoder_path, 'rb') as f:
            self.label_encoder = pickle.load(f)