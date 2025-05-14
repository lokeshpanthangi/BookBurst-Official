
import { UserBook } from "@/types/book";
import TimelineEvent from "@/components/TimelineEvent";
import EmptyState from "@/components/EmptyState";
import { Clock, BookCheck, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useReadingTimeline } from "@/services/timelineService";
import { Skeleton } from "@/components/ui/skeleton";


const Timeline = () => {
  const navigate = useNavigate();
  const { data: timelineEvents, isLoading, error } = useReadingTimeline();
  
  // Filter timeline to only show finished books
  const finishedBooksTimeline = timelineEvents?.filter(event => 
    event.type === 'finished' || (event.book.status === 'finished' && event.type === 'rated')
  ) || [];
  
  const goToBookshelf = () => {
    navigate("/bookshelf");
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-playfair font-bold mb-2">Reading Timeline</h1>
        <p className="text-muted-foreground">
          Your reading journey visualized. See the history of books you've finished reading.
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col space-y-12 pl-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-20 bg-muted rounded mb-4"></div>
              <div className="bg-card border rounded-lg h-36"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center border rounded-lg">
          <p className="text-destructive">Error loading timeline data. Please try again later.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Refresh</Button>
        </div>
      ) : finishedBooksTimeline.length > 0 ? (
        <div className="relative">
          {finishedBooksTimeline.map((event, index) => (
            <TimelineEvent 
              key={`${event.book.id}-${index}`} 
              book={event.book} 
              date={event.date} 
              type={event.type}
              details={event.details}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookCheck className="h-8 w-8 text-muted-foreground" />}
          title="No finished books yet"
          description="Mark books as finished in your bookshelf to see them appear in your timeline."
          action={{
            label: "Go to bookshelf",
            onClick: goToBookshelf,
          }}
          className="my-12"
        />
      )}
    </div>
  );
};

export default Timeline;
