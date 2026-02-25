import ReactMarkdown from 'react-markdown';

const documentation = `
# CineMatch AI: Academic Project Documentation

## 1. Abstract
CineMatch AI is an end-to-end Movie Recommendation System designed to bridge the gap between complex Machine Learning algorithms and high-end user experiences. The project utilizes the MovieLens dataset to implement hybrid recommendation strategies, including Content-Based Filtering and Collaborative Filtering.

## 2. Architecture
The system follows a **Full-Stack Decoupled Architecture**:
- **Frontend**: React.js with Tailwind CSS for a cinematic OTT (Over-The-Top) interface.
- **Backend**: Node.js/Express server handling API requests and ML computations.
- **Database**: SQLite for persistent storage of user interactions and movie metadata.
- **ML Engine**: Custom implementation of Cosine Similarity and Jaccard Similarity for real-time recommendations.

## 3. Machine Learning Algorithms
### A. Cosine Similarity
Used for content-based filtering. It calculates the cosine of the angle between two vectors (movie genres/tags) to determine similarity.
$$ \\text{similarity} = \\cos(\\theta) = \\frac{A \\cdot B}{\\|A\\| \\|B\\|} $$

### B. K-Nearest Neighbors (KNN)
Used to find 'K' similar users or items based on their rating history.

### C. Collaborative Filtering
Predicts user preferences by analyzing patterns from similar users (User-User) or similar items (Item-Item).

## 4. Flowchart
1. **Input**: User selects a movie or rates a set of movies.
2. **Processing**: Backend fetches user interaction matrix.
3. **Computation**: Similarity scores are calculated using the ML Engine.
4. **Ranking**: Results are sorted by relevance score.
5. **Output**: Top 5 recommended movies are displayed in the UI.

## 5. Viva Q&A
**Q: What is the cold start problem?**
A: It occurs when the system cannot recommend items to new users or recommend new items because of a lack of data.

**Q: Why use Cosine Similarity over Euclidean Distance?**
A: Cosine similarity is better for high-dimensional data where the magnitude of vectors might vary but the orientation (pattern) is what matters.

**Q: How do you evaluate the model?**
A: Using metrics like RMSE (Root Mean Square Error) and MAE (Mean Absolute Error) on a test dataset.
`;

export default function Documentation() {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-zinc-900/50 rounded-2xl border border-white/10 backdrop-blur-xl mt-20 text-gray-300 prose prose-invert prose-red">
      <ReactMarkdown>{documentation}</ReactMarkdown>
    </div>
  );
}
