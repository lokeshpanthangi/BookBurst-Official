
import { useState } from "react";
import { UserBook } from "@/types/book";
import BookCover from "./BookCover";
import StarRating from "./StarRating";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

interface TimelineEventProps {
  book: UserBook;
  date: string;
  type?: 'started' | 'finished' | 'updated' | 'rated' | 'reviewed';
  details?: any;
}

const TimelineEvent = ({ book, date, type, details }: TimelineEventProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const formattedDate = new Date(date);
  const timeAgo = formatDistanceToNow(formattedDate, { addSuffix: true });
  
  const getEventText = () => {
    // If type is provided, use it; otherwise fall back to book status
    if (type) {
      switch (type) {
        case "finished":
          return "finished reading";
        case "started":
          return "started reading";
        case "updated":
          return "updated";
        case "rated":
          return "rated";
        case "reviewed":
          return "reviewed";
        default:
          return "updated";
      }
    } else {
      // Fallback to book status if type is not provided
      switch (book.status) {
        case "finished":
          return "finished reading";
        case "currently-reading":
          return "started reading";
        case "want-to-read":
          return "added to want to read";
        default:
          return "updated";
      }
    }
  };
  
  return (
    <div className="relative pl-8 pb-12">
      <div className="timeline-line"></div>
      <div className="timeline-node"></div>
      
      <div className="mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          {timeAgo}
        </span>
      </div>
      
      <div className="bg-card border rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="p-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <BookCover src={book.coverImage} alt={book.title} size="sm" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-playfair font-medium text-lg mb-1">{book.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                by {book.author}
              </p>
              
              <p className="text-sm mb-3">
                You {getEventText()} this book
              </p>
              
              {(book.userRating || (type === 'rated' && details?.rating)) && (
                <div className="flex items-center mb-3">
                  <StarRating rating={book.userRating || details?.rating} readOnly size="sm" />
                  <span className="ml-2 text-xs text-muted-foreground">
                    You rated it {book.userRating || details?.rating}
                  </span>
                </div>
              )}
              
              {book.notes && (
                <div className="mb-3">
                  <div 
                    className={`text-sm ${expanded ? "" : "line-clamp-2"}`}
                  >
                    {book.notes}
                  </div>
                  {book.notes.length > 150 && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto text-xs mt-1" 
                      onClick={() => setExpanded(!expanded)}
                    >
                      {expanded ? "Show less" : "Show more"}
                    </Button>
                  )}
                </div>
              )}
              
              <Button size="sm" variant="outline" asChild>
                <Link to={`/book/${book.id}`}>
                  <BookOpen className="mr-1 h-3 w-3" />
                  View book
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineEvent;
