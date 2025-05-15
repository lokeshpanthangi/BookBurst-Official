import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types/user";

// Ensure the is_public column exists in user_books table
const ensureUserBooksPublicColumn = async () => {
  try {
    // Check if the is_public column exists
    const { error } = await supabase.rpc('ensure_user_books_public_column', {
      sql_code: `
        DO $$
        BEGIN
          -- Add is_public column to user_books if it doesn't exist
          ALTER TABLE user_books ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (error) {
      console.error('Error ensuring is_public column exists:', error);
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up user_books table:', error);
    return false;
  }
};

// Initialize the user_books table
ensureUserBooksPublicColumn();

// Get all users
export const useAllUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      
      // Format user objects
      const users: User[] = data.map(profile => ({
        id: profile.id,
        name: profile.username || profile.id.slice(0, 8),
        username: profile.username || profile.id.slice(0, 8),
        email: '',
        avatar: profile.avatar_url,
        bio: profile.bio,
        joinedDate: profile.created_at,
      }));
      
      return users;
    },
  });
};

// Get a specific user's profile
export const useUserById = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Get user reading stats
      const { data: booksData } = await supabase
        .from('user_books')
        .select('status, rating')
        .eq('user_id', userId);
      
      const booksRead = booksData?.filter(book => book.status === 'finished').length || 0;
      const booksCurrentlyReading = booksData?.filter(book => book.status === 'currently-reading').length || 0;
      
      // Calculate average rating
      const ratings = booksData?.filter(book => book.rating).map(book => book.rating) || [];
      const averageRating = ratings.length 
        ? +(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) 
        : 0;
      
      // Format user object
      const user: User = {
        id: data.id,
        name: data.username || data.id.slice(0, 8),
        username: data.username || data.id.slice(0, 8),
        email: '',
        avatar: data.avatar_url,
        bio: data.bio,
        joinedDate: data.created_at,
        readingStats: {
          booksRead,
          pagesRead: 0,
          booksCurrentlyReading,
          averageRating,
        },
      };
      
      return user;
    },
    enabled: !!userId,
  });
};

// Get user's public books
export const useUserPublicBooks = (userId: string) => {
  return useQuery({
    queryKey: ['userPublicBooks', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      const { data, error } = await supabase
        .from('user_books')
        .select(`
          *,
          books(*)
        `)
        .eq('user_id', userId)
        .eq('is_private', false);
      
      if (error) throw error;
      
      return data.map((item: any) => ({
        ...item.books,
        status: item.status,
        startDate: item.start_date,
        finishDate: item.finish_date,
        userRating: item.rating,
        progress: item.progress,
        notes: item.notes,
        userBookId: item.id,
        is_private: item.is_private
      }));
    },
    enabled: !!userId,
  });
};

// Get user's books - all books for current user, only public books for other users
export const useUserAllBooks = (userId: string) => {
  const { user: currentUser } = useAuth();
  
  return useQuery({
    queryKey: ['userAllBooks', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      // Create query to get books
      let query = supabase
        .from('user_books')
        .select(`
          *,
          books(*)
        `)
        .eq('user_id', userId);
      
      // If viewing another user's books, only show public ones
      if (currentUser?.id !== userId) {
        query = query.eq('is_public', true);
      }
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        console.log('No books found for user:', userId);
      } else {
        console.log(`Found ${data.length} books for user:`, userId);
      }
      
      return {
        books: data.map((item: any) => ({
          ...item.books,
          coverImage: item.books.cover_image, // Explicitly map cover_image to coverImage
          status: item.status,
          startDate: item.start_date,
          finishDate: item.finish_date,
          userRating: item.rating,
          progress: item.progress,
          notes: item.notes,
          userBookId: item.id,
          is_public: item.is_public
        })),
        // No follow concept needed
        isFollowing: true // Always true to maintain compatibility with existing code
      };
    },
    enabled: !!userId,
  });
};

// No follow-related functions needed
// All users can see public books from other users without following
