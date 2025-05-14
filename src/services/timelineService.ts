
import { supabase } from "@/integrations/supabase/client";
import { UserBook } from "@/types/book";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

// Interface for timeline events
interface TimelineEvent {
  book: UserBook;
  date: string;
  type: 'started' | 'finished' | 'updated' | 'rated' | 'reviewed';
  details?: any;
}

// Get user's reading timeline
export const useReadingTimeline = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['readingTimeline'],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('reading_activity')
        .select(`
          *,
          books:book_id(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to match our TimelineEvent format
      const timeline: TimelineEvent[] = data.map((activity: any) => {
        const book: UserBook = {
          id: activity.books.id,
          title: activity.books.title,
          author: activity.books.author,
          coverImage: activity.books.cover_image || '',
          description: activity.books.description || '',
          status: activity.activity_type === 'finished' ? 'finished' 
            : activity.activity_type === 'started' ? 'currently-reading' 
            : 'want-to-read',
          userRating: activity.details?.rating,
          progress: activity.details?.progress,
        };
        
        return {
          book,
          date: activity.created_at,
          type: activity.activity_type,
          details: activity.details,
        };
      });
      
      return timeline;
    },
    enabled: !!user,
  });
};
