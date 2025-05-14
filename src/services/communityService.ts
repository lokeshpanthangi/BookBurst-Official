import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types/user";

// Create a custom table for follows if it doesn't exist
const createFollowsTable = async () => {
  try {
    // Check if the table exists by trying to select from it
    const { error } = await supabase
      .rpc('create_follows_table_if_not_exists');
    
    if (error) {
      console.error('Error creating follows table:', error);
      
      // Create the function to create the table if it doesn't exist
      await supabase.rpc('create_follows_function', {
        sql_code: `
          CREATE OR REPLACE FUNCTION create_follows_table_if_not_exists()
          RETURNS void AS $$
          BEGIN
            -- Create follows table if it doesn't exist
            CREATE TABLE IF NOT EXISTS follows (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(follower_id, following_id)
            );
            
            -- Add is_private column to user_books if it doesn't exist
            ALTER TABLE user_books ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
          END;
          $$ LANGUAGE plpgsql;
        `
      });
      
      // Try creating the table again
      await supabase.rpc('create_follows_table_if_not_exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up follows functionality:', error);
    return false;
  }
};

// Initialize the follows table
createFollowsTable();

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

// Get user's all books (both public and private)
export const useUserAllBooks = (userId: string) => {
  const { user: currentUser } = useAuth();
  
  return useQuery({
    queryKey: ['userAllBooks', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      
      // Get all books for the user
      const { data, error } = await supabase
        .from('user_books')
        .select(`
          *,
          books(*)
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        console.log('No books found for user:', userId);
      } else {
        console.log(`Found ${data.length} books for user:`, userId);
      }
      
      return {
        books: data.map((item: any) => ({
          ...item.books,
          status: item.status,
          startDate: item.start_date,
          finishDate: item.finish_date,
          userRating: item.rating,
          progress: item.progress,
          notes: item.notes,
          userBookId: item.id,
          is_private: item.is_private
        })),
        isFollowing: false // We don't need this anymore but keep it for compatibility
      };
    },
    enabled: !!userId,
  });
};

// Check if current user follows a specific user
export const useIsFollowing = (userId: string) => {
  const { user: currentUser } = useAuth();
  
  return useQuery({
    queryKey: ['isFollowing', userId],
    queryFn: async () => {
      if (!userId || !currentUser) return false;
      
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      
      return !!data;
    },
    enabled: !!userId && !!currentUser,
  });
};

// Follow a user
export const useFollowUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!user) throw new Error('User must be authenticated');
      if (user.id === userId) throw new Error('Cannot follow yourself');
      
      const { data, error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
      queryClient.invalidateQueries({ queryKey: ['userAllBooks', userId] });
      toast({
        title: "User followed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to follow user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Unfollow a user
export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!user) throw new Error('User must be authenticated');
      
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);
      
      if (error) throw error;
      
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
      queryClient.invalidateQueries({ queryKey: ['userAllBooks', userId] });
      toast({
        title: "User unfollowed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to unfollow user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Get followers count
export const useFollowersCount = (userId: string) => {
  return useQuery({
    queryKey: ['followersCount', userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
      
      if (error) throw error;
      
      return count || 0;
    },
    enabled: !!userId,
  });
};

// Get following count
export const useFollowingCount = (userId: string) => {
  return useQuery({
    queryKey: ['followingCount', userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
      
      if (error) throw error;
      
      return count || 0;
    },
    enabled: !!userId,
  });
};
