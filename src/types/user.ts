
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  joinedDate: string;
  readingStats?: {
    booksRead: number;
    pagesRead: number;
    booksCurrentlyReading: number;
    averageRating: number;
  };
  preferences?: {
    favoriteGenres: string[];
    theme: 'light' | 'dark' | 'system';
  };
}

export interface ReadingGoal {
  year: number;
  target: number;
  current: number;
}
