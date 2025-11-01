import pandas as pd
import numpy as np
import random
import os

class MusicRecommender:
    def __init__(self):
        self.music_dataset = self.load_music_dataset()
        self.emotion_mapping = self.create_emotion_mapping()
    
    def load_music_dataset(self):
        """Load and process the Spotify music dataset with proper error handling"""
        dataset_path = '../datasets/spotify_millsongdata.csv'
        
        try:
            if not os.path.exists(dataset_path):
                print("❌ Spotify dataset not found, using fallback")
                return self.generate_fallback_dataset()
            
            print("📊 Loading Spotify music dataset...")
            df = pd.read_csv(dataset_path)
            
            if df.empty:
                print("❌ Spotify dataset is empty, using fallback")
                return self.generate_fallback_dataset()
            
            print(f"✅ Loaded {len(df)} songs from Spotify dataset")
            return df
            
        except Exception as e:
            print(f"❌ Error loading Spotify dataset: {e}")
            print("🔄 Using fallback music dataset...")
            return self.generate_fallback_dataset()
    
    def create_emotion_mapping(self):
        """Create comprehensive emotion mapping for music recommendations"""
        emotion_mapping = {
            'happy': {
                'keywords': ['love', 'happy', 'joy', 'smile', 'dance', 'party', 'sunshine', 'beautiful', 'wonderful', 'amazing', 'celebrate', 'good', 'great'],
                'genres': ['Pop', 'Dance', 'Reggae', 'Funk', 'Disco'],
                'energy': 'high'
            },
            'sad': {
                'keywords': ['sad', 'cry', 'tears', 'lonely', 'miss', 'heartbreak', 'goodbye', 'pain', 'broken', 'alone', 'hurt', 'lost'],
                'genres': ['Acoustic', 'Folk', 'Indie', 'Soul', 'Blues'],
                'energy': 'low'
            },
            'angry': {
                'keywords': ['angry', 'mad', 'hate', 'rage', 'fight', 'war', 'burn', 'fire', 'break', 'destroy', 'kill', 'revenge'],
                'genres': ['Rock', 'Metal', 'Punk', 'Industrial', 'Hard Rock'],
                'energy': 'high'
            },
            'fear': {
                'keywords': ['fear', 'scared', 'afraid', 'dark', 'night', 'ghost', 'monster', 'alone', 'lost', 'run', 'hide', 'danger'],
                'genres': ['Ambient', 'Classical', 'Soundtrack', 'Electronic', 'Experimental'],
                'energy': 'medium'
            },
            'surprise': {
                'keywords': ['surprise', 'shock', 'sudden', 'unexpected', 'wow', 'amazing', 'incredible', 'unbelievable', 'magic'],
                'genres': ['Alternative', 'Indie Pop', 'Electronic', 'Progressive'],
                'energy': 'high'
            },
            'disgust': {
                'keywords': ['disgust', 'hate', 'ugly', 'wrong', 'bad', 'terrible', 'horrible', 'awful', 'sick'],
                'genres': ['Industrial', 'Metal', 'Alternative Rock', 'Grunge'],
                'energy': 'medium'
            },
            'neutral': {
                'keywords': ['day', 'time', 'life', 'world', 'people', 'place', 'thing', 'way', 'feel', 'know', 'think'],
                'genres': ['Indie', 'Pop', 'Rock', 'Folk', 'Alternative'],
                'energy': 'medium'
            }
        }
        return emotion_mapping
    
    def analyze_song_emotion(self, lyrics):
        """Analyze song lyrics to determine emotional content"""
        if not isinstance(lyrics, str):
            return 'neutral'
        
        lyrics_lower = lyrics.lower()
        emotion_scores = {emotion: 0 for emotion in self.emotion_mapping.keys()}
        
        for emotion, data in self.emotion_mapping.items():
            for keyword in data['keywords']:
                if keyword in lyrics_lower:
                    emotion_scores[emotion] += 1
        
        # Also consider song length and emotional density
        word_count = len(lyrics_lower.split())
        if word_count > 0:
            for emotion in emotion_scores:
                emotion_scores[emotion] = emotion_scores[emotion] / word_count * 100
        
        # Find dominant emotion
        if max(emotion_scores.values()) > 0:
            dominant_emotion = max(emotion_scores, key=emotion_scores.get)
        else:
            dominant_emotion = 'neutral'
        
        return dominant_emotion
    
    def recommend_song(self, emotion):
        """Recommend song based on detected emotion with intelligent selection"""
        if self.music_dataset is None or len(self.music_dataset) == 0:
            return self.get_fallback_song(emotion)
        
        try:
            # Sample a larger set for better variety
            sample_size = min(500, len(self.music_dataset))
            sampled_songs = self.music_dataset.sample(n=sample_size, random_state=42)
            
            # Analyze emotions for sampled songs
            song_emotions = []
            for _, song in sampled_songs.iterrows():
                song_emotion = self.analyze_song_emotion(str(song.get('text', '')))
                song_emotions.append({
                    'title': song.get('song', 'Unknown Title'),
                    'artist': song.get('artist', 'Unknown Artist'),
                    'lyrics': song.get('text', ''),
                    'emotion': song_emotion
                })
            
            # Filter songs by target emotion
            emotion_songs = [song for song in song_emotions if song['emotion'] == emotion]
            
            if not emotion_songs:
                # If no exact match, find similar emotions
                similar_emotions = self.get_similar_emotions(emotion)
                for similar_emotion in similar_emotions:
                    emotion_songs = [song for song in song_emotions if song['emotion'] == similar_emotion]
                    if emotion_songs:
                        break
            
            if emotion_songs:
                recommended_song = random.choice(emotion_songs)
                return {
                    'title': recommended_song['title'],
                    'artist': recommended_song['artist'],
                    'genre': self.get_genre_for_emotion(emotion),
                    'spotify_link': self.generate_spotify_link(recommended_song['title'], recommended_song['artist']),
                    'emotion_match': emotion,
                    'status': 'success'
                }
            else:
                return self.get_fallback_song(emotion)
                
        except Exception as e:
            print(f"❌ Error in song recommendation: {e}")
            return self.get_fallback_song(emotion)
    
    def get_similar_emotions(self, emotion):
        """Get similar emotions for fallback recommendations"""
        similarity_groups = {
            'happy': ['surprise', 'neutral'],
            'sad': ['fear', 'neutral'],
            'angry': ['disgust', 'fear'],
            'fear': ['sad', 'surprise'],
            'surprise': ['happy', 'fear'],
            'disgust': ['angry', 'sad'],
            'neutral': ['happy', 'sad']
        }
        return similarity_groups.get(emotion, ['neutral'])
    
    def get_genre_for_emotion(self, emotion):
        """Get appropriate genre for emotion"""
        genre_mapping = {
            'happy': 'Pop',
            'sad': 'Acoustic',
            'angry': 'Rock',
            'fear': 'Ambient',
            'surprise': 'Alternative',
            'disgust': 'Industrial',
            'neutral': 'Indie'
        }
        return genre_mapping.get(emotion, 'Various')
    
    def generate_spotify_link(self, title, artist):
        """Generate Spotify search link"""
        search_query = f"{title} {artist}".replace(' ', '%20')
        return f"https://open.spotify.com/search/{search_query}"
    
    def get_fallback_song(self, emotion):
        """Get fallback song when dataset is unavailable"""
        fallback_songs = {
            'happy': {'title': 'Happy', 'artist': 'Pharrell Williams', 'genre': 'Pop'},
            'sad': {'title': 'Someone Like You', 'artist': 'Adele', 'genre': 'Pop'},
            'angry': {'title': 'Killing in the Name', 'artist': 'Rage Against the Machine', 'genre': 'Rock'},
            'fear': {'title': 'Weightless', 'artist': 'Marconi Union', 'genre': 'Ambient'},
            'surprise': {'title': 'Bohemian Rhapsody', 'artist': 'Queen', 'genre': 'Rock'},
            'disgust': {'title': 'You Oughta Know', 'artist': 'Alanis Morissette', 'genre': 'Rock'},
            'neutral': {'title': 'Three Little Birds', 'artist': 'Bob Marley', 'genre': 'Reggae'}
        }
        
        song = fallback_songs.get(emotion, fallback_songs['neutral'])
        return {
            'title': song['title'],
            'artist': song['artist'],
            'genre': song['genre'],
            'spotify_link': self.generate_spotify_link(song['title'], song['artist']),
            'emotion_match': emotion,
            'status': 'success_fallback'
        }
    
    def generate_fallback_dataset(self):
        """Generate comprehensive fallback music dataset"""
        # This is your existing fallback dataset
        # Keeping it as backup
        music_data = []
        
        emotions_tracks = {
            'happy': [
                {'title': 'Happy', 'artist': 'Pharrell Williams', 'genre': 'Pop'},
                # ... keep your existing fallback songs
            ],
            # ... other emotions
        }
        
        for emotion, tracks in emotions_tracks.items():
            for track in tracks:
                music_data.append({
                    'title': track['title'],
                    'artist': track['artist'],
                    'genre': track['genre'],
                    'text': f"{track['title']} by {track['artist']}",
                    'mood': emotion
                })
        
        return pd.DataFrame(music_data)