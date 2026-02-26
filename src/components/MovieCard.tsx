import { motion } from "motion/react";
import { Star, Play, Info } from "lucide-react";

interface Movie {
  id: number;
  title: string;
  genres: string;
  poster_url: string;
  rating: number;
  backdrop_url: string;
}

export default function MovieCard({ 
  movie, 
  onClick 
}: { 
  movie: Movie; 
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -10 }}
      className="relative flex-none w-48 h-72 rounded-lg overflow-hidden cursor-pointer group shadow-2xl border border-white/10 bg-zinc-900"
      onClick={onClick}
    >
      <div className="w-full h-full bg-zinc-800 flex items-center justify-center relative">
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${movie.id + 100}/400/600`;
          }}
        />
        {!movie.poster_url && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500 font-bold text-xs text-center px-4">
            {movie.title}
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <h3 className="text-white font-bold text-sm mb-1 uppercase tracking-wider">{movie.title}</h3>
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <Star className="w-3 h-3 text-red-500 fill-red-500" />
          <span>{movie.rating}</span>
          <span className="text-white/40">|</span>
          <span className="truncate">{movie.genres.split(',')[0]}</span>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="bg-red-600 p-1.5 rounded-full hover:bg-red-700 transition-colors">
            <Play className="w-3 h-3 text-white fill-white" />
          </button>
          <button className="bg-white/20 p-1.5 rounded-full hover:bg-white/30 transition-colors">
            <Info className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
      
      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-red-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
    </motion.div>
  );
}
