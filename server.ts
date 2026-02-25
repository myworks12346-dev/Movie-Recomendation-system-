import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("movies.db");

// Initialize Database with MovieLens-like data
db.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY,
    title TEXT,
    genres TEXT,
    poster_url TEXT,
    rating REAL,
    backdrop_url TEXT
  );

  CREATE TABLE IF NOT EXISTS ratings (
    userId INTEGER,
    movieId INTEGER,
    rating REAL,
    timestamp INTEGER,
    PRIMARY KEY (userId, movieId)
  );
`);

// Seed Data (Subset of MovieLens)
const seedMovies = [
  { id: 1, title: "The Shawshank Redemption", genres: "Drama, Crime", rating: 9.3, poster_url: "https://picsum.photos/seed/shawshank/400/600", backdrop_url: "https://picsum.photos/seed/shawshank_bg/1920/1080" },
  { id: 2, title: "The Godfather", genres: "Crime, Drama", rating: 9.2, poster_url: "https://picsum.photos/seed/godfather/400/600", backdrop_url: "https://picsum.photos/seed/godfather_bg/1920/1080" },
  { id: 3, title: "The Dark Knight", genres: "Action, Crime, Drama", rating: 9.0, poster_url: "https://picsum.photos/seed/darkknight/400/600", backdrop_url: "https://picsum.photos/seed/darkknight_bg/1920/1080" },
  { id: 4, title: "Pulp Fiction", genres: "Crime, Drama", rating: 8.9, poster_url: "https://picsum.photos/seed/pulp/400/600", backdrop_url: "https://picsum.photos/seed/pulp_bg/1920/1080" },
  { id: 5, title: "Inception", genres: "Action, Sci-Fi, Adventure", rating: 8.8, poster_url: "https://picsum.photos/seed/inception/400/600", backdrop_url: "https://picsum.photos/seed/inception_bg/1920/1080" },
  { id: 6, title: "Interstellar", genres: "Adventure, Drama, Sci-Fi", rating: 8.6, poster_url: "https://picsum.photos/seed/interstellar/400/600", backdrop_url: "https://picsum.photos/seed/interstellar_bg/1920/1080" },
  { id: 7, title: "The Matrix", genres: "Action, Sci-Fi", rating: 8.7, poster_url: "https://picsum.photos/seed/matrix/400/600", backdrop_url: "https://picsum.photos/seed/matrix_bg/1920/1080" },
  { id: 8, title: "Parasite", genres: "Comedy, Drama, Thriller", rating: 8.6, poster_url: "https://picsum.photos/seed/parasite/400/600", backdrop_url: "https://picsum.photos/seed/parasite_bg/1920/1080" },
  { id: 9, title: "Spirited Away", genres: "Animation, Adventure, Family", rating: 8.6, poster_url: "https://picsum.photos/seed/spirited/400/600", backdrop_url: "https://picsum.photos/seed/spirited_bg/1920/1080" },
  { id: 10, title: "The Lion King", genres: "Animation, Adventure, Drama", rating: 8.5, poster_url: "https://picsum.photos/seed/lionking/400/600", backdrop_url: "https://picsum.photos/seed/lionking_bg/1920/1080" },
];

const insertMovie = db.prepare("INSERT OR IGNORE INTO movies (id, title, genres, rating, poster_url, backdrop_url) VALUES (?, ?, ?, ?, ?, ?)");
seedMovies.forEach(m => insertMovie.run(m.id, m.title, m.genres, m.rating, m.poster_url, m.backdrop_url));

// Seed some ratings for collaborative filtering demo
const insertRating = db.prepare("INSERT OR IGNORE INTO ratings (userId, movieId, rating, timestamp) VALUES (?, ?, ?, ?)");
for (let u = 1; u <= 5; u++) {
  for (let m = 1; m <= 10; m++) {
    if (Math.random() > 0.3) {
      insertRating.run(u, m, (Math.random() * 5).toFixed(1), Date.now());
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API: Get All Movies
  app.get("/api/movies", (req, res) => {
    const movies = db.prepare("SELECT * FROM movies").all();
    res.json(movies);
  });

  // API: Get Recommendations (ML Logic)
  app.get("/api/recommendations", (req, res) => {
    const userId = parseInt(req.query.userId as string) || 1;
    
    // Simple Content-Based Filtering (by Genre)
    const userRatings = db.prepare("SELECT movieId FROM ratings WHERE userId = ? AND rating >= 4").all(userId);
    const favoriteMovieIds = userRatings.map((r: any) => r.movieId);
    
    if (favoriteMovieIds.length === 0) {
      // Fallback to top rated
      const topRated = db.prepare("SELECT * FROM movies ORDER BY rating DESC LIMIT 5").all();
      return res.json(topRated);
    }

    const favoriteGenres = db.prepare(`
      SELECT genres FROM movies WHERE id IN (${favoriteMovieIds.join(",")})
    `).all();

    const genreCounts: Record<string, number> = {};
    favoriteGenres.forEach((g: any) => {
      g.genres.split(", ").forEach((genre: string) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    const movies = db.prepare("SELECT * FROM movies").all();
    const recommendations = movies
      .filter(m => !favoriteMovieIds.includes(m.id))
      .map(m => {
        let score = 0;
        m.genres.split(", ").forEach((genre: string) => {
          score += genreCounts[genre] || 0;
        });
        return { ...m, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    res.json(recommendations);
  });

  // API: Similar Movies (Cosine Similarity logic)
  app.get("/api/similar/:id", (req, res) => {
    const movieId = parseInt(req.params.id);
    const targetMovie = db.prepare("SELECT * FROM movies WHERE id = ?").get(movieId) as any;
    
    if (!targetMovie) return res.status(404).json({ error: "Movie not found" });

    const targetGenres = targetMovie.genres.split(", ");
    const allMovies = db.prepare("SELECT * FROM movies WHERE id != ?").all(movieId);

    const similar = allMovies.map((m: any) => {
      const mGenres = m.genres.split(", ");
      const intersection = targetGenres.filter(g => mGenres.includes(g)).length;
      const union = new Set([...targetGenres, ...mGenres]).size;
      const jaccardSimilarity = intersection / union; // Using Jaccard as a proxy for Cosine on binary genre vectors
      return { ...m, similarity: jaccardSimilarity };
    }).sort((a, b) => b.similarity - a.similarity).slice(0, 5);

    res.json(similar);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CineMatch Server running at http://localhost:${PORT}`);
  });
}

startServer();
