import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Info, Search, User, ChevronRight, ChevronLeft, BookOpen, Sparkles, Loader2 } from "lucide-react";
import MovieCard from "./components/MovieCard";
import Documentation from "./components/Documentation";
import ChatBot from "./components/ChatBot";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface Movie {
  id: number;
  title: string;
  genres: string;
  poster_url: string;
  rating: number;
  backdrop_url: string;
}

const FALLBACK_MOVIES: Movie[] = [
  { id: 1, title: "Baahubali: The Beginning", genres: "Action, Drama", rating: 8.0, poster_url: "https://picsum.photos/seed/baahubali/400/600", backdrop_url: "https://picsum.photos/seed/baahubali_bg/1920/1080" },
  { id: 2, title: "RRR", genres: "Action, Drama", rating: 8.8, poster_url: "https://picsum.photos/seed/rrr/400/600", backdrop_url: "https://picsum.photos/seed/rrr_bg/1920/1080" },
  { id: 3, title: "Pushpa: The Rise", genres: "Action, Crime, Drama", rating: 7.6, poster_url: "https://picsum.photos/seed/pushpa/400/600", backdrop_url: "https://picsum.photos/seed/pushpa_bg/1920/1080" },
  { id: 4, title: "Eega", genres: "Action, Comedy, Fantasy", rating: 7.7, poster_url: "https://picsum.photos/seed/eega/400/600", backdrop_url: "https://picsum.photos/seed/eega_bg/1920/1080" },
  { id: 5, title: "Arjun Reddy", genres: "Action, Drama, Romance", rating: 8.0, poster_url: "https://picsum.photos/seed/arjunreddy/400/600", backdrop_url: "https://picsum.photos/seed/arjunreddy_bg/1920/1080" },
  { id: 6, title: "Jersey", genres: "Drama, Sport", rating: 8.5, poster_url: "https://picsum.photos/seed/jersey/400/600", backdrop_url: "https://picsum.photos/seed/jersey_bg/1920/1080" },
  { id: 7, title: "Mahanati", genres: "Biography, Drama", rating: 8.5, poster_url: "https://picsum.photos/seed/mahanati/400/600", backdrop_url: "https://picsum.photos/seed/mahanati_bg/1920/1080" },
  { id: 8, title: "Magadheera", genres: "Action, Drama, Fantasy", rating: 7.7, poster_url: "https://picsum.photos/seed/magadheera/400/600", backdrop_url: "https://picsum.photos/seed/magadheera_bg/1920/1080" },
];

export default function App() {
  const [movies, setMovies] = useState<Movie[]>(FALLBACK_MOVIES);
  const [recommendations, setRecommendations] = useState<Movie[]>(FALLBACK_MOVIES.slice(0, 5));
  const [heroMovie, setHeroMovie] = useState<Movie | null>(FALLBACK_MOVIES[1]); // RRR as default hero
  const [showDoc, setShowDoc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  const generateMoviePoster = useCallback(async (movie: Movie, retryCount = 0) => {
    // Check permanent cache first
    const cached = localStorage.getItem(`poster_${movie.id}`);
    if (cached) return cached;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ parts: [{ text: `A high-quality, cinematic movie poster for the film "${movie.title}". Genres: ${movie.genres}. Professional lighting, epic composition, no text.` }] }],
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64 = `data:image/png;base64,${part.inlineData.data}`;
          localStorage.setItem(`poster_${movie.id}`, base64);
          return base64;
        }
      }
    } catch (error: any) {
      if (error?.status === "RESOURCE_EXHAUSTED" || error?.code === 429) {
        if (retryCount < 1) {
          const delay = 5000; 
          await new Promise(resolve => setTimeout(resolve, delay));
          return generateMoviePoster(movie, retryCount + 1);
        }
      }
    }
    return null;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const [moviesRes, recsRes] = await Promise.allSettled([
          fetch("/api/movies", { signal: controller.signal }),
          fetch("/api/recommendations?userId=1", { signal: controller.signal })
        ]);
        
        clearTimeout(timeoutId);

        let currentMovies = FALLBACK_MOVIES;

        if (moviesRes.status === 'fulfilled' && moviesRes.value.ok) {
          try {
            const moviesData = await moviesRes.value.json();
            if (Array.isArray(moviesData) && moviesData.length > 0) {
              currentMovies = moviesData;
            }
          } catch (e) {}
        }

        // Apply permanent cache to movies
        const cachedMovies = currentMovies.map((m: Movie) => {
          const cached = localStorage.getItem(`poster_${m.id}`);
          return cached ? { ...m, poster_url: cached, backdrop_url: cached } : m;
        });
        
        setMovies(cachedMovies);
        setHeroMovie(cachedMovies[Math.floor(Math.random() * cachedMovies.length)]);

        // Generate missing posters ONCE and save them permanently
        setIsGeneratingImages(true);
        for (const movie of cachedMovies.slice(0, 5)) {
          if (!localStorage.getItem(`poster_${movie.id}`)) {
            const posterUrl = await generateMoviePoster(movie);
            if (posterUrl) {
              setMovies(prev => prev.map(m => m.id === movie.id ? { ...m, poster_url: posterUrl, backdrop_url: posterUrl } : m));
            }
            await new Promise(resolve => setTimeout(resolve, 2000)); // Be gentle with quota
          }
        }
        setIsGeneratingImages(false);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="h-screen w-screen bg-[#0B0B0F] flex items-center justify-center">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-red-600 text-4xl font-black tracking-tighter"
      >
        CINEMATCH AI
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white font-sans selection:bg-red-600/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-8 py-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-10">
          <h1 className="text-2xl font-black tracking-tighter text-red-600 cursor-pointer">CINEMATCH AI</h1>
          {isGeneratingImages && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-600/30 rounded-full text-[10px] font-bold text-red-500 uppercase tracking-widest"
            >
              <Sparkles className="w-3 h-3 animate-pulse" />
              AI Generating Posters
            </motion.div>
          )}
          <div className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
            <span className="hover:text-white cursor-pointer transition-colors">Home</span>
            <span className="hover:text-white cursor-pointer transition-colors">Movies</span>
            <span className="hover:text-white cursor-pointer transition-colors">Top Rated</span>
            <span 
              className={`hover:text-white cursor-pointer transition-colors flex items-center gap-2 ${showDoc ? 'text-red-500' : ''}`}
              onClick={() => setShowDoc(!showDoc)}
            >
              <BookOpen className="w-4 h-4" />
              Academic Project
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Search className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white transition-colors" />
          <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center cursor-pointer">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {!showDoc ? (
          <motion.main
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Hero Section */}
            {heroMovie && (
              <section className="relative h-[85vh] w-full overflow-hidden">
                <img
                  src={heroMovie.backdrop_url}
                  alt={heroMovie.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F] via-[#0B0B0F]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-transparent to-transparent" />
                
                <div className="absolute bottom-24 left-12 max-w-2xl">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-7xl font-black uppercase tracking-tighter mb-4 leading-none"
                  >
                    {heroMovie.title}
                  </motion.h2>
                  <p className="text-lg text-gray-300 mb-8 line-clamp-3 font-medium">
                    Experience the pinnacle of cinematic storytelling. Rated {heroMovie.rating}/10 by global audiences.
                    A masterpiece in the {heroMovie.genres} genre.
                  </p>
                  <div className="flex gap-4">
                    <button className="bg-red-600 text-white px-8 py-3 rounded-md font-bold flex items-center gap-2 hover:bg-red-700 transition-all hover:scale-105 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                      <Play className="w-5 h-5 fill-white" /> PLAY NOW
                    </button>
                    <button className="bg-white/10 backdrop-blur-md text-white px-8 py-3 rounded-md font-bold flex items-center gap-2 hover:bg-white/20 transition-all">
                      <Info className="w-5 h-5" /> MORE INFO
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Movie Rows */}
            <div className="px-12 -mt-12 relative z-10 space-y-16 pb-20">
              <MovieRow 
                title="Recommended For You" 
                movies={recommendations} 
              />
              <MovieRow 
                title="Trending Now" 
                movies={movies} 
              />
              <MovieRow 
                title="Top Rated Classics" 
                movies={[...movies].sort((a,b) => b.rating - a.rating)} 
              />
            </div>
          </motion.main>
        ) : (
          <motion.div
            key="doc"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="pt-24 pb-20"
          >
            <Documentation />
            <div className="flex justify-center mt-10">
              <button 
                onClick={() => setShowDoc(false)}
                className="bg-red-600 px-8 py-3 rounded-full font-bold hover:bg-red-700 transition-all"
              >
                Back to Cinema
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-12 text-gray-500 text-sm flex justify-between items-center">
        <div>© 2026 CineMatch AI. Academic Minor Project.</div>
        <div className="flex gap-8">
          <span className="hover:text-white cursor-pointer">Privacy</span>
          <span className="hover:text-white cursor-pointer">Terms</span>
          <span className="hover:text-white cursor-pointer">Contact</span>
        </div>
      </footer>

      {/* ChatBot */}
      <ChatBot movies={movies} />
    </div>
  );
}

function MovieRow({ 
  title, 
  movies 
}: { 
  title: string; 
  movies: Movie[]; 
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
          {title} <ChevronRight className="w-5 h-5 text-red-600" />
        </h3>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide mask-fade-right">
        {movies.map((movie) => (
          <MovieCard 
            key={movie.id} 
            movie={movie} 
            onClick={() => {}} 
          />
        ))}
      </div>
    </div>
  );
}
