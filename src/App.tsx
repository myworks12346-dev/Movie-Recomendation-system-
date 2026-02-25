import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Info, Search, User, ChevronRight, ChevronLeft, BookOpen } from "lucide-react";
import MovieCard from "./components/MovieCard";
import Documentation from "./components/Documentation";

interface Movie {
  id: number;
  title: string;
  genres: string;
  poster_url: string;
  rating: number;
  backdrop_url: string;
}

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);
  const [showDoc, setShowDoc] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesRes, recsRes] = await Promise.all([
          fetch("/api/movies"),
          fetch("/api/recommendations?userId=1")
        ]);
        const moviesData = await moviesRes.json();
        const recsData = await recsRes.json();
        
        setMovies(moviesData);
        setRecommendations(recsData);
        setHeroMovie(moviesData[Math.floor(Math.random() * moviesData.length)]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
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
              <MovieRow title="Recommended For You" movies={recommendations} />
              <MovieRow title="Trending Now" movies={movies} />
              <MovieRow title="Top Rated Classics" movies={[...movies].sort((a,b) => b.rating - a.rating)} />
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
    </div>
  );
}

function MovieRow({ title, movies }: { title: string; movies: Movie[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
          {title} <ChevronRight className="w-5 h-5 text-red-600" />
        </h3>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide mask-fade-right">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onClick={() => {}} />
        ))}
      </div>
    </div>
  );
}
