
export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string; // Matches with cover_image in the database mapping function
  description: string;
  publishedDate?: string; // Matches with published_date in the database mapping function
  publisher?: string;
  pageCount?: number; // Matches with page_count in the database mapping function
  isbn?: string;
  language?: string;
  genres?: string[];
  averageRating?: number; // Matches with average_rating in the database mapping function
  ratingsCount?: number; // Matches with ratings_count in the database mapping function
  series?: {
    name: string;
    position: number;
  };
}

export interface UserBook extends Book {
  status: 'currently-reading' | 'want-to-read' | 'finished';
  startDate?: string;
  finishDate?: string;
  userRating?: number;
  progress?: number; // 0 to 100
  notes?: string;
  shelves?: string[];
  userBookId?: string; // Added to store the user_book relation ID
}

export interface BookshelfFilters {
  status?: 'currently-reading' | 'want-to-read' | 'finished' | 'all';
  shelf?: string;
  genre?: string[];
  search?: string;
  sort?: 'title' | 'author' | 'dateAdded' | 'rating' | 'recentlyUpdated';
}

export type BookView = 'grid' | 'list';
