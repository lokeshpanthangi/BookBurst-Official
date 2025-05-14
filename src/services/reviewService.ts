
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Get reviews for a book
export const useBookReviews = (bookId: string) => {
  return useQuery({
    queryKey: ['reviews', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .eq('book_id', bookId);
      
      if (error) throw error;
      
      // Transform the data to match our Review type
      const reviews: Review[] = data.map((review: any) => ({
        id: review.id,
        bookId: review.book_id,
        userId: review.user_id,
        userName: review.profiles.username,
        userAvatar: review.profiles.avatar_url,
        rating: review.rating,
        content: review.content,
        datePosted: review.date_posted,
        likes: review.likes,
        spoiler: review.spoiler,
        recommended: review.recommended,
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
  
  return useMutation({
    mutationFn: async (review: Omit<Review, "id" | "userName" | "userAvatar" | "datePosted" | "likes">) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          book_id: review.bookId,
          rating: review.rating,
          content: review.content,
          spoiler: review.spoiler,
          recommended: review.recommended,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Create reading activity
      await supabase
        .from('reading_activity')
        .insert([{
          book_id: review.bookId,
          activity_type: 'reviewed',
          details: {
            rating: review.rating,
          },
        }]);
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ['readingActivity'] });
      toast({
        title: "Review submitted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Update a review
export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      id,
      updates,
      bookId,
    }: { 
      id: string; 
      updates: Partial<Review>;
      bookId: string;
    }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          rating: updates.rating,
          content: updates.content,
          spoiler: updates.spoiler,
          recommended: updates.recommended,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.bookId] });
      toast({
        title: "Review updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update review",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Delete a review
export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      id,
      bookId,
    }: { 
      id: string;
      bookId: string;
    }) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return id;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.bookId] });
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
