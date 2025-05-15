
import { supabase } from "@/integrations/supabase/client";
import { Book, UserBook, BookshelfFilters } from "@/types/book";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Json } from "@/integrations/supabase/types";
import { fetchTrendingBooks as fetchGoogleTrendingBooks, fetchNewReleases as fetchGoogleNewReleases, fetchRecommendedBooks as fetchGoogleRecommendedBooks, searchBooks as searchGoogleBooks } from "@/services/googleBooksService";

// Map database fields to our Book type
const mapDbBookToBook = (item: any): Book => ({
  id: item.id,
  title: item.title,
  author: item.author,
  coverImage: item.cover_image || '',
  description: item.description || '',
  publisher: item.publisher,
  publishedDate: item.published_date,
  isbn: item.isbn,
  pageCount: item.page_count,
  language: item.language,
  genres: item.book_genres?.map((bg: any) => bg.genres?.name) || [],
  averageRating: item.average_rating,
  ratingsCount: item.ratings_count
});

// Get all books from the database
export const useBooks = () => {
  return useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*');
      
      if (error) throw error;
      
      // Map database fields to our Book type
      const books: Book[] = data.map(mapDbBookToBook);
      
      return books;
    },
  });
};

// Get a single book by id
export const useBook = (id: string) => {
  return useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          book_genres(genres(*))
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Return the mapped book
      return mapDbBookToBook(data);
    },
    enabled: !!id,
  });
};

// Get a book by user book ID
export const useUserBookDetails = (id: string) => {
  return useQuery({
    queryKey: ['userBookDetails', id],
    queryFn: async () => {
      console.log('useUserBookDetails called with ID:', id);
      
      try {
        // First, try fetching it directly as a book ID (this is more reliable)
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select(`*`)
          .eq('id', id)
          .single();
        
        if (!bookError && bookData) {
          console.log('Found book with ID:', id, bookData);
          
          // Now check if this book is in the user's collection
          const { data: userBookData, error: userBookError } = await supabase
            .from('user_books')
            .select('*')
            .eq('book_id', id)
            .maybeSingle();
          
          return {
            book: mapDbBookToBook(bookData),
            userBook: !userBookError && userBookData ? userBookData : null
          };
        } else {
          console.log('Book not found with ID:', id, 'Trying as user book ID');
          
          // If not found as a book ID, try as a user_book ID
          const { data: userBookData, error: userBookError } = await supabase
            .from('user_books')
            .select('*, books(*)')
            .eq('id', id)
            .single();
          
          if (userBookError) {
            console.error('Error fetching as user book:', userBookError);
            throw new Error(`Book not found with ID: ${id}`);
          }
          
          console.log('Found user book with ID:', id, userBookData);
          
          if (!userBookData.books) {
            console.error('User book found but no associated book data');
            throw new Error('User book found but no associated book data');
          }
          
          return {
            book: mapDbBookToBook(userBookData.books),
            userBook: userBookData
          };
        }
      } catch (error) {
        console.error('Error in useUserBookDetails:', error);
        throw error;
      }
    },
    enabled: !!id,
    retry: 1, // Only retry once to avoid infinite loops
  });
};

// Get user's books with filters and pagination
export const useUserBooks = (filters: BookshelfFilters = {}, page: number = 0, pageSize: number = 20) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userBooks', filters, page, pageSize],
    queryFn: async () => {
      if (!user) throw new Error("User must be authenticated");
      
      try {
        // First, get all user_books entries for this user
        let query = supabase
          .from('user_books')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id);
        
        // Apply status filter
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        
        // Apply shelf filter
        if (filters.shelf) {
          query = query
            .select('*, bookshelf_books!inner(bookshelf_id)')
            .eq('bookshelf_books.bookshelf_id', filters.shelf);
        }
        
        // Apply sorting
        if (filters.sort) {
          switch (filters.sort) {
            case 'dateAdded':
              query = query.order('created_at', { ascending: false });
              break;
            case 'rating':
              query = query.order('rating', { ascending: false });
              break;
            case 'recentlyUpdated':
              query = query.order('updated_at', { ascending: false });
              break;
            default:
              // For title and author, we'll sort after fetching the books
              break;
          }
        } else {
          // Default sorting by created_at
          query = query.order('created_at', { ascending: false });
        }
        
        // Apply pagination
        query = query.range(page * pageSize, (page + 1) * pageSize - 1);
        
        const { data: userBooksData, error: userBooksError, count } = await query;
        
        if (userBooksError) {
          console.error('Error fetching user_books:', userBooksError);
          throw userBooksError;
        }
        
        console.log('User books data:', userBooksData);
        
        if (!userBooksData || userBooksData.length === 0) {
          return { books: [], totalCount: 0 };
        }
        
        // Extract book IDs from user_books
        const bookIds = userBooksData.map(item => item.book_id);
        
        // Fetch the actual books
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('*')
          .in('id', bookIds);
        
        if (booksError) {
          console.error('Error fetching books:', booksError);
          throw booksError;
        }
        
        console.log('Books data:', booksData);
        
        // Create a map of book data by ID for easy lookup
        const booksMap = {};
        booksData.forEach(book => {
          booksMap[book.id] = book;
        });
        
        // Combine user_books and books data
        const userBooks = userBooksData.map(userBook => {
          const book = booksMap[userBook.book_id];
          
          if (!book) {
            console.warn(`Book not found for ID: ${userBook.book_id}`);
            return null;
          }
          
          return {
            id: book.id,
            title: book.title,
            author: book.author,
            coverImage: book.cover_image || '',
            description: book.description || '',
            publisher: book.publisher,
            publishedDate: book.published_date,
            isbn: book.isbn,
            pageCount: book.page_count,
            language: book.language,
            status: userBook.status,
            startDate: userBook.start_date,
            finishDate: userBook.finish_date,
            userRating: userBook.rating,
            progress: userBook.progress,
            notes: userBook.notes,
            userBookId: userBook.id,
            genres: [], // We'll handle genres separately if needed
            averageRating: book.average_rating || 0,
            ratingsCount: book.ratings_count || 0
          };
        }).filter(book => book !== null);
        
        return { 
          books: userBooks,
          totalCount: count || 0
        };
      } catch (error) {
        console.error('Error in useUserBooks:', error);
        throw error;
      }
      
      // Transform the data to match our UserBook type
      const userBooks: UserBook[] = data.map((item: any) => {
        // Log each item for debugging
        console.log('Processing item:', item);
        
        // Handle case where books might be null
        if (!item.books) {
          console.warn('Book data missing for item:', item);
          // Fetch the book data separately if needed
          return null;
        }
        
        return {
          id: item.books.id,
          title: item.books.title,
          author: item.books.author,
          coverImage: item.books.cover_image || '',
          description: item.books.description || '',
          publisher: item.books.publisher,
          publishedDate: item.books.published_date,
          isbn: item.books.isbn,
          pageCount: item.books.page_count,
          language: item.books.language,
          status: item.status,
          startDate: item.start_date,
          finishDate: item.finish_date,
          userRating: item.rating,
          progress: item.progress,
          notes: item.notes,
          userBookId: item.id,
          genres: [],  // We'll handle genres separately if needed
          averageRating: item.books.average_rating || 0,
          ratingsCount: item.books.ratings_count || 0
        };
      }).filter(book => book !== null);  // Filter out any null entries
      
      return { 
        books: userBooks,
        totalCount: count || 0
      };
    },
    enabled: !!user,
  });
};

// Search Google Books API
export const useSearchBooks = (query: string, page: number = 0, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['googleBooks', query, page, pageSize],
    queryFn: async () => {
      if (!query.trim()) {
        return { items: [], totalItems: 0 };
      }
      
      try {
        // Use the Google Books search function
        return searchGoogleBooks(query, page, pageSize);
      } catch (error) {
        console.error('Error searching books:', error);
        throw error;
      }
    },
    enabled: query.trim().length > 0
  });
};

// Get book with the highest rating
export const getBookWithHighestRating = async () => {
  const { data: books } = await supabase.from('books').select('*').order('average_rating', { ascending: false }).limit(1);
  return books && books.length > 0 ? books[0] : null;
};

// Get books by genre - Fixed the query syntax
export const getBooksByGenre = async (genreId: string) => {
  const { data } = await supabase
    .from('book_genres')
    .select('book_id')
    .filter('genre_id', 'eq', genreId);
    
  return data ? data.map(bg => bg.book_id) : [];
};

// Get books by genres - Fixed the query syntax
export const getBooksByGenres = async (genreIds: string[]) => {
  if (!genreIds.length) return [];
  
  const { data } = await supabase
    .from('book_genres')
    .select('book_id')
    .filter('genre_id', 'in', `(${genreIds.join(',')})`);
    
  return data ? data.map(bg => bg.book_id) : [];
};

// Fetch trending books from Google Books API
export const fetchTrendingBooks = async (): Promise<Book[]> => {
  return fetchGoogleTrendingBooks();
};

// Fetch new releases from Google Books API
export const fetchNewReleases = async (): Promise<Book[]> => {
  return fetchGoogleNewReleases();
};

// Fetch recommended books from Google Books API
export const fetchRecommendedBooks = async (preferredGenres?: string[]): Promise<Book[]> => {
  return fetchGoogleRecommendedBooks(preferredGenres);
};

// Order books by a given sort
export const orderBooksBy = (query: any, sort: string) => {
  switch (sort) {
    case 'title':
      return query.order('title', { ascending: true });
    case 'author': 
      return query.order('author', { ascending: true });
    case 'newest':
      return query.order('created_at', { ascending: false });
    case 'rating':
      return query.order('average_rating', { ascending: false });
    default:
      return query.order('created_at', { ascending: false });
  }
};

// Add a book to the database from Open Library or manual entry
export const useAddBook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (book: Omit<Book, "id">) => {
      // Check if the book already exists by ISBN or title+author
      let existingBook = null;
      
      if (book.isbn) {
        const { data } = await supabase
          .from('books')
          .select('*')
          .eq('isbn', book.isbn)
          .maybeSingle();
          
        existingBook = data;
      }
      
      if (!existingBook) {
        const { data } = await supabase
          .from('books')
          .select('*')
          .eq('title', book.title)
          .eq('author', book.author)
          .maybeSingle();
          
        existingBook = data;
      }
      
      // If the book exists, return it
      if (existingBook) {
        return existingBook;
      }
      
      // Map our Book type to database schema (camelCase to snake_case)
      const dbBook = {
        title: book.title,
        author: book.author,
        cover_image: book.coverImage,
        description: book.description,
        published_date: book.publishedDate,
        publisher: book.publisher,
        page_count: book.pageCount,
        isbn: book.isbn,
        language: book.language,
        average_rating: book.averageRating,
        ratings_count: book.ratingsCount
      };
      
      const { data, error } = await supabase
        .from('books')
        .insert(dbBook)
        .select()
        .single();
      
      if (error) throw error;
      
      // Add genres if provided
      if (book.genres && book.genres.length > 0) {
        for (const genreName of book.genres) {
          // Check if genre exists
          const { data: existingGenre } = await supabase
            .from('genres')
            .select('id')
            .eq('name', genreName.trim())
            .maybeSingle();
            
          let genreId;
          
          if (existingGenre) {
            genreId = existingGenre.id;
          } else {
            // Create new genre
            const { data: newGenre, error: genreError } = await supabase
              .from('genres')
              .insert({ name: genreName.trim() })
              .select()
              .single();
              
            if (genreError) continue;
            genreId = newGenre.id;
          }
          
          // Link book to genre
          await supabase
            .from('book_genres')
            .insert({
              book_id: data.id,
              genre_id: genreId
            });
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({
        title: "Book added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add book",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Add a book to user's collection with status
export const useAddUserBook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      bookId, 
      status,
      startDate,
      progress,
      notes,
      isPublic = true // Default to true if not provided
    }: { 
      bookId: string; 
      status: 'currently-reading' | 'want-to-read' | 'finished';
      startDate?: string;
      progress?: number;
      notes?: string;
      isPublic?: boolean;
    }) => {
      if (!user) throw new Error("User must be authenticated");
      
      // First check if the user already has this book
      const { data: existingBook } = await supabase
        .from('user_books')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingBook) {
        throw new Error('This book is already in your collection');
      }
      
      // Prepare user book data
      const userBookData = {
        book_id: bookId,
        status,
        user_id: user.id,
        start_date: status === 'currently-reading' ? startDate || new Date().toISOString() : startDate,
        progress: status === 'currently-reading' ? progress || 0 : null,
        notes,
        is_public: isPublic // Include the is_public flag from the parameter
      };
      
      // Add the book to the user's collection
      const { data, error } = await supabase
        .from('user_books')
        .insert(userBookData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Create reading activity
      await supabase
        .from('reading_activity')
        .insert({
          book_id: bookId,
          user_id: user.id,
          activity_type: status === 'finished' ? 'finished' : status === 'currently-reading' ? 'started' : 'added',
          details: {
            status,
            start_date: userBookData.start_date,
            progress: userBookData.progress
          } as Json,
        });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBooks'] });
      queryClient.invalidateQueries({ queryKey: ['readingActivity'] });
      toast({
        title: "Book added to your collection",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add book",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Update a user book
export const useUpdateUserBook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      id,
      updates
    }: { 
      id: string; 
      updates: Partial<UserBook>
    }) => {
      if (!user) throw new Error("User must be authenticated");
      
      // Map user book updates to the database schema
      const dbUpdates: any = {};
      
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.startDate) dbUpdates.start_date = updates.startDate;
      if (updates.finishDate) dbUpdates.finish_date = updates.finishDate;
      if (updates.userRating !== undefined) dbUpdates.rating = updates.userRating;
      if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      
      // Add updated_at timestamp
      dbUpdates.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('user_books')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Create reading activity
      let activityType = 'updated';
      if (updates.status === 'finished') activityType = 'finished';
      if (updates.status === 'currently-reading' && !data.start_date) activityType = 'started';
      
      await supabase
        .from('reading_activity')
        .insert({
          book_id: data.book_id,
          user_id: user.id,
          activity_type: activityType,
          details: dbUpdates as Json,
        });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBooks'] });
      queryClient.invalidateQueries({ queryKey: ['readingActivity'] });
      toast({
        title: "Book updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update book",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Remove a book from user's collection
export const useRemoveUserBook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User must be authenticated");
      
      const { error } = await supabase
        .from('user_books')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBooks'] });
      toast({
        title: "Book removed from your collection",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove book",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Get user's bookshelves
export const useBookshelves = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['bookshelves'],
    queryFn: async () => {
      if (!user) throw new Error("User must be authenticated");
      
      const { data, error } = await supabase
        .from('bookshelves')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return data;
    },
    enabled: !!user,
  });
};

// Add a new bookshelf
export const useAddBookshelf = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("User must be authenticated");
      
      const { data, error } = await supabase
        .from('bookshelves')
        .insert({
          name,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookshelves'] });
      toast({
        title: "Bookshelf created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create bookshelf",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Delete a bookshelf
export const useDeleteBookshelf = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User must be authenticated");
      
      const { error } = await supabase
        .from('bookshelves')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookshelves'] });
      toast({
        title: "Bookshelf deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete bookshelf",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Add book to a bookshelf
export const useAddBookToBookshelf = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      bookshelfId, 
      userBookId 
    }: { 
      bookshelfId: string; 
      userBookId: string
    }) => {
      const { data, error } = await supabase
        .from('bookshelf_books')
        .insert({
          bookshelf_id: bookshelfId,
          user_book_id: userBookId
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBooks'] });
      toast({
        title: "Book added to bookshelf",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add book to bookshelf",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Remove book from a bookshelf
export const useRemoveBookFromBookshelf = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      bookshelfId, 
      userBookId 
    }: { 
      bookshelfId: string; 
      userBookId: string
    }) => {
      const { error } = await supabase
        .from('bookshelf_books')
        .delete()
        .eq('bookshelf_id', bookshelfId)
        .eq('user_book_id', userBookId);
      
      if (error) throw error;
      
      return { bookshelfId, userBookId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBooks'] });
      toast({
        title: "Book removed from bookshelf",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove book from bookshelf",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Save view preference to cookies
export const saveViewPreference = (view: 'grid' | 'list') => {
  document.cookie = `bookshelf-view=${view}; path=/; max-age=${60*60*24*365}; SameSite=Strict`;
};

// Get view preference from cookies
export const getViewPreference = (): 'grid' | 'list' => {
  const match = document.cookie.match(/(^|;)\s*bookshelf-view=([^;]+)/);
  return (match ? match[2] : 'grid') as 'grid' | 'list';
};

// Save last selected tab to cookies
export const saveLastSelectedTab = (tabId: string) => {
  document.cookie = `bookshelf-last-tab=${tabId}; path=/; max-age=${60*60*24*365}; SameSite=Strict`;
};

// Get last selected tab from cookies
export const getLastSelectedTab = (): string | null => {
  const match = document.cookie.match(/(^|;)\s*bookshelf-last-tab=([^;]+)/);
  return match ? match[2] : null;
};
