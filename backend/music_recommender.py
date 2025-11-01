import pandas as pd
import numpy as np
import random

class MusicRecommender:
    def __init__(self):
        self.music_dataset = self.load_music_dataset()
    
    def load_music_dataset(self):
        """Load and process the Spotify music dataset"""
        try:
            print("Loading Spotify music dataset...")
            # Load the Spotify dataset
            df = pd.read_csv('../datasets/spotify_millsongdata.csv')
            
            # Create emotion mapping based on lyrics analysis
            emotion_mapping = self.create_emotion_mapping(df)
            return emotion_mapping
            
        except Exception as e:
            print(f"Error loading Spotify dataset: {e}")
            print("Using fallback music dataset...")
            return self.generate_fallback_dataset()
    
    def create_emotion_mapping(self, df):
        """Create emotion mapping based on lyrics analysis"""
        # Sample the dataset for efficiency
        df_sample = df.sample(n=min(1000, len(df)), random_state=42)
        
        music_data = []
        
        # Simple keyword-based emotion mapping
        emotion_keywords = {
            'happy': ['love', 'happy', 'joy', 'smile', 'dance', 'party', 'sunshine', 'beautiful', 'wonderful', 'amazing'],
            'sad': ['sad', 'cry', 'tears', 'lonely', 'miss', 'heartbreak', 'goodbye', 'pain', 'broken', 'alone'],
            'angry': ['angry', 'mad', 'hate', 'rage', 'fight', 'war', 'burn', 'fire', 'break', 'destroy'],
            'fear': ['fear', 'scared', 'afraid', 'dark', 'night', 'ghost', 'monster', 'alone', 'lost', 'run'],
            'surprise': ['surprise', 'shock', 'sudden', 'unexpected', 'wow', 'amazing', 'incredible', 'unbelievable'],
            'neutral': ['day', 'time', 'life', 'world', 'people', 'place', 'thing', 'way', 'feel', 'know']
        }
        
        for _, row in df_sample.iterrows():
            lyrics = str(row['text']).lower()
            emotion_scores = {}
            
            for emotion, keywords in emotion_keywords.items():
                score = sum(1 for keyword in keywords if keyword in lyrics)
                emotion_scores[emotion] = score
            
            # Determine primary emotion
            if max(emotion_scores.values()) > 0:
                primary_emotion = max(emotion_scores, key=emotion_scores.get)
            else:
                primary_emotion = 'neutral'
            
            music_data.append({
                'title': row.get('song', 'Unknown Title'),
                'artist': row.get('artist', 'Unknown Artist'),
                'genre': 'Various',
                'mood': primary_emotion,
                'spotify_link': f"https://open.spotify.com/search/{str(row.get('song', 'song')).replace(' ', '%20')}%20{str(row.get('artist', 'artist')).replace(' ', '%20')}"
            })
        
        return pd.DataFrame(music_data)
    
    def generate_fallback_dataset(self):
        """Generate comprehensive fallback music dataset"""
        music_data = []
        
        # Expanded music dataset with emotional mappings
        emotions_tracks = {
            'happy': [
                {'title': 'Happy', 'artist': 'Pharrell Williams', 'genre': 'Pop'},
                {'title': 'Can\'t Stop the Feeling', 'artist': 'Justin Timberlake', 'genre': 'Pop'},
                {'title': 'Good Vibrations', 'artist': 'The Beach Boys', 'genre': 'Pop'},
                {'title': 'Walking on Sunshine', 'artist': 'Katrina & The Waves', 'genre': 'Pop'},
                {'title': 'Dancing Queen', 'artist': 'ABBA', 'genre': 'Pop'},
                {'title': 'Uptown Funk', 'artist': 'Mark Ronson ft. Bruno Mars', 'genre': 'Funk'},
                {'title': 'Shake It Off', 'artist': 'Taylor Swift', 'genre': 'Pop'},
                {'title': 'Happy Together', 'artist': 'The Turtles', 'genre': 'Rock'},
                {'title': 'I Gotta Feeling', 'artist': 'The Black Eyed Peas', 'genre': 'Pop'},
                {'title': 'Best Day of My Life', 'artist': 'American Authors', 'genre': 'Rock'}
            ],
            'sad': [
                {'title': 'Someone Like You', 'artist': 'Adele', 'genre': 'Pop'},
                {'title': 'The Sound of Silence', 'artist': 'Simon & Garfunkel', 'genre': 'Folk'},
                {'title': 'Hurt', 'artist': 'Johnny Cash', 'genre': 'Country'},
                {'title': 'Everybody Hurts', 'artist': 'R.E.M.', 'genre': 'Rock'},
                {'title': 'Skinny Love', 'artist': 'Bon Iver', 'genre': 'Folk'},
                {'title': 'Say Something', 'artist': 'A Great Big World', 'genre': 'Pop'},
                {'title': 'All I Want', 'artist': 'Kodaline', 'genre': 'Rock'},
                {'title': 'Fix You', 'artist': 'Coldplay', 'genre': 'Rock'},
                {'title': 'The Night We Met', 'artist': 'Lord Huron', 'genre': 'Folk'},
                {'title': 'Let Her Go', 'artist': 'Passenger', 'genre': 'Folk'}
            ],
            'angry': [
                {'title': 'Killing in the Name', 'artist': 'Rage Against the Machine', 'genre': 'Rock'},
                {'title': 'Break Stuff', 'artist': 'Limp Bizkit', 'genre': 'Rock'},
                {'title': 'Given Up', 'artist': 'Linkin Park', 'genre': 'Rock'},
                {'title': 'Bulls on Parade', 'artist': 'Rage Against the Machine', 'genre': 'Rock'},
                {'title': 'Du Hast', 'artist': 'Rammstein', 'genre': 'Industrial'},
                {'title': 'Last Resort', 'artist': 'Papa Roach', 'genre': 'Rock'},
                {'title': 'Chop Suey!', 'artist': 'System Of A Down', 'genre': 'Rock'},
                {'title': 'Bodies', 'artist': 'Drowning Pool', 'genre': 'Rock'},
                {'title': 'Down with the Sickness', 'artist': 'Disturbed', 'genre': 'Rock'},
                {'title': 'Psychosocial', 'artist': 'Slipknot', 'genre': 'Metal'}
            ],
            'fear': [
                {'title': 'Weightless', 'artist': 'Marconi Union', 'genre': 'Ambient'},
                {'title': 'Clair de Lune', 'artist': 'Claude Debussy', 'genre': 'Classical'},
                {'title': 'Spiegel im Spiegel', 'artist': 'Arvo Pärt', 'genre': 'Classical'},
                {'title': 'Gymnopédie No.1', 'artist': 'Erik Satie', 'genre': 'Classical'},
                {'title': 'Deep Blue', 'artist': 'Max Richter', 'genre': 'Classical'},
                {'title': 'The Four Seasons - Winter', 'artist': 'Antonio Vivaldi', 'genre': 'Classical'},
                {'title': 'Lux Aeterna', 'artist': 'Clint Mansell', 'genre': 'Classical'},
                {'title': 'The Host of Seraphim', 'artist': 'Dead Can Dance', 'genre': 'Ambient'},
                {'title': 'On the Nature of Daylight', 'artist': 'Max Richter', 'genre': 'Classical'},
                {'title': 'Medicine', 'artist': 'Daughter', 'genre': 'Indie'}
            ],
            'surprise': [
                {'title': 'Bohemian Rhapsody', 'artist': 'Queen', 'genre': 'Rock'},
                {'title': 'Somebody That I Used to Know', 'artist': 'Gotye', 'genre': 'Pop'},
                {'title': 'Hey Ya!', 'artist': 'OutKast', 'genre': 'Hip-Hop'},
                {'title': 'Thriller', 'artist': 'Michael Jackson', 'genre': 'Pop'},
                {'title': 'Take On Me', 'artist': 'a-ha', 'genre': 'Pop'},
                {'title': 'Sweet Dreams', 'artist': 'Eurythmics', 'genre': 'Pop'},
                {'title': 'Seven Nation Army', 'artist': 'The White Stripes', 'genre': 'Rock'},
                {'title': 'Smells Like Teen Spirit', 'artist': 'Nirvana', 'genre': 'Rock'},
                {'title': 'Virtual Insanity', 'artist': 'Jamiroquai', 'genre': 'Funk'},
                {'title': 'Sabotage', 'artist': 'Beastie Boys', 'genre': 'Hip-Hop'}
            ],
            'disgust': [
                {'title': 'You Oughta Know', 'artist': 'Alanis Morissette', 'genre': 'Rock'},
                {'title': 'Before He Cheats', 'artist': 'Carrie Underwood', 'genre': 'Country'},
                {'title': 'Cry Me a River', 'artist': 'Justin Timberlake', 'genre': 'Pop'},
                {'title': 'Irreplaceable', 'artist': 'Beyoncé', 'genre': 'Pop'},
                {'title': 'Since U Been Gone', 'artist': 'Kelly Clarkson', 'genre': 'Pop'},
                {'title': 'We Are Never Ever Getting Back Together', 'artist': 'Taylor Swift', 'genre': 'Pop'},
                {'title': 'Don\'t Speak', 'artist': 'No Doubt', 'genre': 'Rock'},
                {'title': 'You Give Love a Bad Name', 'artist': 'Bon Jovi', 'genre': 'Rock'},
                {'title': 'Hit the Road Jack', 'artist': 'Ray Charles', 'genre': 'R&B'},
                {'title': 'I Will Survive', 'artist': 'Gloria Gaynor', 'genre': 'Disco'}
            ],
            'neutral': [
                {'title': 'Three Little Birds', 'artist': 'Bob Marley', 'genre': 'Reggae'},
                {'title': 'Banana Pancakes', 'artist': 'Jack Johnson', 'genre': 'Folk'},
                {'title': 'Island in the Sun', 'artist': 'Weezer', 'genre': 'Rock'},
                {'title': 'Float On', 'artist': 'Modest Mouse', 'genre': 'Rock'},
                {'title': 'The Middle', 'artist': 'Jimmy Eat World', 'genre': 'Rock'},
                {'title': 'Better Together', 'artist': 'Jack Johnson', 'genre': 'Folk'},
                {'title': 'Sitting, Waiting, Wishing', 'artist': 'Jack Johnson', 'genre': 'Folk'},
                {'title': 'No Rain', 'artist': 'Blind Melon', 'genre': 'Rock'},
                {'title': 'Smooth', 'artist': 'Santana ft. Rob Thomas', 'genre': 'Rock'},
                {'title': 'Collide', 'artist': 'Howie Day', 'genre': 'Rock'}
            ]
        }
        
        for emotion, tracks in emotions_tracks.items():
            for track in tracks:
                music_data.append({
                    'title': track['title'],
                    'artist': track['artist'],
                    'genre': track['genre'],
                    'mood': emotion,
                    'spotify_link': f"https://open.spotify.com/search/{track['title'].replace(' ', '%20')}%20{track['artist'].replace(' ', '%20')}"
                })
        
        return pd.DataFrame(music_data)
    
    def recommend_song(self, emotion):
        """Recommend song based on detected emotion"""
        if self.music_dataset is None or len(self.music_dataset) == 0:
            self.music_dataset = self.generate_fallback_dataset()
        
        emotion_songs = self.music_dataset[self.music_dataset['mood'] == emotion]
        
        if len(emotion_songs) == 0:
            # Fallback to neutral if no specific emotion songs found
            emotion_songs = self.music_dataset[self.music_dataset['mood'] == 'neutral']
        
        if len(emotion_songs) > 0:
            recommended_song = emotion_songs.sample(n=1).iloc[0]
            return {
                'title': recommended_song['title'],
                'artist': recommended_song['artist'],
                'genre': recommended_song['genre'],
                'spotify_link': recommended_song['spotify_link'],
                'status': 'success'
            }
        
        # Default recommendation
        return {
            'title': 'Three Little Birds',
            'artist': 'Bob Marley',
            'genre': 'Reggae',
            'spotify_link': 'https://open.spotify.com/search/Three%20Little%20Birds%20Bob%20Marley',
            'status': 'success'
        }