
import { supabase } from "@/integrations/supabase/client";
import { Book, UserBook, BookshelfFilters } from "@/types/book";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Json } from "@/integrations/supabase/types";

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
      const books: Book[] = data.map(item => ({
        id: item.id,
        title: item.title,
        author: item.author,
        coverImage: item.cover_image || '',
        description: item.description || '',
        publishedDate: item.published_date,
        publisher: item.publisher,
        pageCount: item.page_count,
        isbn: item.isbn,
        language: item.language
      }));
      
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
      
      const formattedBook: Book = {
        id: data.id,
        title: data.title,
        author: data.author,
        coverImage: data.cover_image || '',
        description: data.description || '',
        publishedDate: data.published_date,
        publisher: data.publisher,
        pageCount: data.page_count,
        isbn: data.isbn,
        language: data.language,
        genres: data.book_genres?.map((bg: any) => bg.genres.name) || [],
      };
      
      return formattedBook;
    },
    enabled: !!id,
  });
};

// Get user's books with filters
export const useUserBooks = (filters: BookshelfFilters = {}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userBooks', filters],
    queryFn: async () => {
      if (!user) throw new Error("User must be authenticated");
      
      let query = supabase
        .from('user_books')
        .select(`
          *,
          books(*)
        `)
        .eq('user_id', user.id);
      
      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to match our UserBook type
      const userBooks: UserBook[] = data.map((item: any) => ({
        id: item.books.id,
        title: item.books.title,
        author: item.books.author,
        coverImage: item.books.cover_image || '',
        description: item.books.description || '',
        publishedDate: item.books.published_date,
        publisher: item.books.publisher,
        pageCount: item.books.page_count,
        isbn: item.books.isbn,
        language: item.books.language,
        status: item.status,
        startDate: item.start_date,
        finishDate: item.finish_date,
        userRating: item.rating,
        progress: item.progress,
        notes: item.notes,
        userBookId: item.id,
      }));
      
      return userBooks;
    },
    enabled: !!user,
  });
};

// Add a book to the database
export const useAddBook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (book: Omit<Book, "id">) => {
      // Map our Book type to database schema
      const dbBook = {
        title: book.title,
        author: book.author,
        cover_image: book.coverImage,
        description: book.description,
        published_date: book.publishedDate,
        publisher: book.publisher,
        page_count: book.pageCount,
        isbn: book.isbn,
        language: book.language
      };
      
      const { data, error } = await supabase
        .from('books')
        .insert([dbBook])
        .select()
        .single();
      
      if (error) throw error;
      
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

// Add a book to user's collection
export const useAddUserBook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      bookId, 
      status 
    }: { 
      bookId: string; 
      status: 'currently-reading' | 'want-to-read' | 'finished'
    }) => {
      if (!user) throw new Error("User must be authenticated");
      
      // First check if the user already has this book
      const { data: existingBook } = await supabase
        .from('user_books')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', user.id);
      
      if (existingBook && existingBook.length > 0) {
        throw new Error('This book is already in your collection');
      }
      
      // Add the book to the user's collection
      const { data, error } = await supabase
        .from('user_books')
        .insert([{
          book_id: bookId,
          status,
          user_id: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Create reading activity
      await supabase
        .from('reading_activity')
        .insert([{
          book_id: bookId,
          user_id: user.id,
          activity_type: status === 'finished' ? 'finished' : status === 'currently-reading' ? 'started' : 'updated',
          details: {
            status,
          } as Json,
        }]);
      
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
      
      const { data, error } = await supabase
        .from('user_books')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Create reading activity
      await supabase
        .from('reading_activity')
        .insert([{
          book_id: data.book_id,
          user_id: user.id,
          activity_type: updates.status === 'finished' ? 'finished' : 'updated',
          details: dbUpdates as Json,
        }]);
      
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
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_books')
        .delete()
        .eq('id', id);
      
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
