
import { supabase } from "@/integrations/supabase/client";
import { User, ReadingGoal } from "@/types/user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Get current user's profile
export const useUserProfile = () => {
  const { user: authUser } = useAuth();
  
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!authUser) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error) throw error;
      
      // Get user reading stats
      const { data: booksData } = await supabase
        .from('user_books')
        .select('status, rating')
        .eq('user_id', authUser.id);
      
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
        name: data.username || authUser.email?.split('@')[0] || '',
        username: data.username || authUser.email?.split('@')[0] || '',
        email: authUser.email || '',
        avatar: data.avatar_url,
        bio: data.bio,
        joinedDate: data.created_at,
        readingStats: {
          booksRead,
          pagesRead: 0, // We would need to calculate this from book data
          booksCurrentlyReading,
          averageRating,
        },
      };
      
      return user;
    },
    enabled: !!authUser,
  });
};

// Update user profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!authUser) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: updates.username,
          bio: updates.bio,
          avatar_url: updates.avatar,
        })
        .eq('id', authUser.id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: "Profile updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Get user reading goal
export const useReadingGoal = (year: number = new Date().getFullYear()) => {
  const { user: authUser } = useAuth();
  
  return useQuery({
    queryKey: ['readingGoal', year],
    queryFn: async () => {
      if (!authUser) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('reading_goals')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('year', year)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) return null;
      
      const readingGoal: ReadingGoal = {
        year: data.year,
        target: data.target,
        current: data.current,
      };
      
      return readingGoal;
    },
    enabled: !!authUser,
  });
};

// Create or update reading goal
export const useUpsertReadingGoal = () => {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (goal: { year: number; target: number }) => {
      if (!authUser) throw new Error('User not authenticated');
      
      // Check if goal exists for this year
      const { data: existingGoal } = await supabase
        .from('reading_goals')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('year', goal.year)
        .maybeSingle();
      
      if (existingGoal) {
        // Update existing goal
        const { data, error } = await supabase
          .from('reading_goals')
          .update({
            target: goal.target,
          })
          .eq('id', existingGoal.id)
          .select()
          .single();
        
        if (error) throw error;
        
        return data;
      } else {
        // Create new goal
        const { data, error } = await supabase
          .from('reading_goals')
          .insert([{
            user_id: authUser.id,
            year: goal.year,
            target: goal.target,
          }])
          .select()
          .single();
        
        if (error) throw error;
        
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['readingGoal', data.year] });
      toast({
        title: "Reading goal saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save reading goal",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
