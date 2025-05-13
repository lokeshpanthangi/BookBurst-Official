
export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  description: string;
  publishedDate?: string;
  publisher?: string;
  pageCount?: number;
  isbn?: string;
  language?: string;
  genres?: string[];
  averageRating?: number;
  ratingsCount?: number;
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
}

export interface BookshelfFilters {
  status?: 'currently-reading' | 'want-to-read' | 'finished' | 'all';
  shelf?: string;
  genre?: string[];
  search?: string;
  sort?: 'title' | 'author' | 'dateAdded' | 'rating' | 'recentlyUpdated';
}

export type BookView = 'grid' | 'list';
