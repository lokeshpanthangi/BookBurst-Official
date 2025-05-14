
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Json } from "@/integrations/supabase/types";

// Get reviews for a book
export const useBookReviews = (bookId: string) => {
  return useQuery({
    queryKey: ['reviews', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles(*)
        `)
        .eq('book_id', bookId)
        .order('date_posted', { ascending: false });
      
      if (error) throw error;
      
      const reviews: Review[] = data.map(item => ({
        id: item.id,
        bookId: item.book_id,
        userId: item.user_id,
        userName: item.profiles?.username || 'Anonymous',
        userAvatar: item.profiles?.avatar_url || undefined,
        rating: item.rating,
        content: item.content || '',
        datePosted: item.date_posted,
        likes: item.likes,
        spoiler: item.spoiler,
        recommended: item.recommended
      }));
      
      return reviews;
    },
    enabled: !!bookId,
  });
};

// Add a review
export const useAddReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      bookId, 
      rating, 
      content, 
      spoiler = false, 
      recommended = true 
    }: { 
      bookId: string; 
      rating: number; 
      content: string; 
      spoiler?: boolean; 
      recommended?: boolean;
    }) => {
      if (!user) throw new Error("User must be authenticated");
      
      // Check if the user already reviewed this book
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingReview) {
        throw new Error('You have already reviewed this book');
      }
      
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          book_id: bookId,
          user_id: user.id,
          rating,
          content,
          spoiler,
          recommended
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
          activity_type: 'reviewed',
          details: {
            rating,
            review_id: data.id
          } as Json,
        }]);
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ['readingActivity'] });
      toast({
        title: "Review added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add review",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Like a review
export const useLikeReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      reviewId, 
      bookId 
    }: { 
      reviewId: string; 
      bookId: string;
    }) => {
      if (!user) throw new Error("User must be authenticated");
      
      // First get the current review
      const { data: review, error: fetchError } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Increment the likes count
      const { data, error } = await supabase
        .from('reviews')
        .update({ likes: (review.likes || 0) + 1 })
        .eq('id', reviewId)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.bookId] });
      toast({
        title: "Review liked",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to like review",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Get user's reviews
export const useUserReviews = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userReviews'],
    queryFn: async () => {
      if (!user) throw new Error("User must be authenticated");
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          books(*)
        `)
        .eq('user_id', user.id)
        .order('date_posted', { ascending: false });
      
      if (error) throw error;
      
      const reviews = data.map(item => ({
        id: item.id,
        bookId: item.book_id,
        userId: item.user_id,
        rating: item.rating,
        content: item.content || '',
        datePosted: item.date_posted,
        likes: item.likes,
        spoiler: item.spoiler,
        recommended: item.recommended,
        book: {
          id: item.books.id,
          title: item.books.title,
          author: item.books.author,
          coverImage: item.books.cover_image
        }
      }));
      
      return reviews;
    },
    enabled: !!user,
  });
};

// Delete a review
export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      reviewId, 
      bookId 
    }: { 
      reviewId: string; 
      bookId: string;
    }) => {
      if (!user) throw new Error("User must be authenticated");
      
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return { reviewId, bookId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ['userReviews'] });
      toast({
        title: "Review deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete review",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
