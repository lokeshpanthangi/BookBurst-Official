
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
      
      // First get activity data from reading_activity table
      const { data: activityData, error: activityError } = await supabase
        .from('reading_activity')
        .select(`
          *,
          books:book_id(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (activityError) throw activityError;
      
      // Then get finished books directly from user_books table
      const { data: userBooksData, error: userBooksError } = await supabase
        .from('user_books')
        .select(`
          *,
          books(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'finished')
        .order('finish_date', { ascending: false });
      
      if (userBooksError) throw userBooksError;
      
      // Transform activity data to match our TimelineEvent format
      const activityTimeline: TimelineEvent[] = activityData.map((activity: any) => {
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
      
      // Transform user_books data to match our TimelineEvent format
      const userBooksTimeline: TimelineEvent[] = userBooksData.map((userBook: any) => {
        const book: UserBook = {
          id: userBook.books.id,
          title: userBook.books.title,
          author: userBook.books.author,
          coverImage: userBook.books.cover_image || '',
          description: userBook.books.description || '',
          status: 'finished',
          finishDate: userBook.finish_date,
          userRating: userBook.rating,
          notes: userBook.notes,
          userBookId: userBook.id
        };
        
        return {
          book,
          date: userBook.finish_date || userBook.updated_at || userBook.created_at,
          type: 'finished',
          details: {
            rating: userBook.rating,
            notes: userBook.notes
          },
        };
      });
      
      // Combine both timelines and filter out duplicates
      const combinedTimeline = [...activityTimeline];
      
      // Add user books that aren't already in the activity timeline
      userBooksTimeline.forEach(userBookEvent => {
        // Check if this book is already in the timeline as a 'finished' event
        const alreadyInTimeline = combinedTimeline.some(
          event => event.book.id === userBookEvent.book.id && event.type === 'finished'
        );
        
        if (!alreadyInTimeline) {
          combinedTimeline.push(userBookEvent);
        }
      });
      
      // Sort by date, newest first
      return combinedTimeline.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    },
    enabled: !!user,
  });
};
