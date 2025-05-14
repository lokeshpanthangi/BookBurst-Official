
import { Link } from "react-router-dom";
import { Book as BookIcon } from "lucide-react";
import { UserBook } from "@/types/book";
import BookCover from "./BookCover";
import StarRating from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookCardProps {
  book: UserBook;
  view: "grid" | "list";
}

const BookCard = ({ book, view }: BookCardProps) => {
  const getStatusBadge = () => {
    switch (book.status) {
      case "currently-reading":
        return (
          <Badge className="badge-currently-reading">
            Currently Reading
          </Badge>
        );
      case "want-to-read":
        return <Badge className="badge-want-to-read">Want to Read</Badge>;
      case "finished":
        return <Badge className="badge-finished">Finished</Badge>;
      default:
        return null;
    }
  };

  return (
    <div 
      className={cn(
        "book-card group border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300", 
        view === "grid" ? "flex flex-col h-[400px]" : "flex flex-row items-start gap-4 h-[200px]"
      )}
    >
      <div 
        className={cn(
          "book-card-image overflow-hidden", 
          view === "grid" ? "w-full h-[250px]" : "w-24 md:w-32 h-full"
        )}
      >
        <Link to={`/book/${book.id}`} className="block w-full h-full">
          <BookCover 
            src={book.coverImage} 
            alt={book.title}
            className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      </div>
      
      <div 
        className={cn(
          "p-4 flex flex-col", 
          view === "grid" ? "flex-1" : "flex-1"
        )}
      >
        <Link to={`/book/${book.id}`} className="mb-2">
          <h3 
            className={cn(
              "font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200",
              view === "grid" ? "text-sm" : "text-base md:text-lg"
            )}
          >
            {book.title}
          </h3>
        </Link>
        
        <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{book.author}</p>
        
        <div className="flex items-center space-x-2 mb-2">
          <StarRating 
            rating={book.userRating || 0} 
            size={view === "grid" ? "sm" : "md"}
            readOnly
            interactive={false}
          />
          {book.userRating ? (
            <span className="text-xs text-muted-foreground">{book.userRating.toFixed(1)}</span>
          ) : null}
        </div>
        
        {getStatusBadge()}
        
        {book.status === "currently-reading" && book.progress && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{book.progress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${book.progress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {view === "list" && book.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {book.description}
          </p>
        )}
        
        {view === "list" && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link to={`/book/${book.id}`}>
                <BookIcon className="mr-1 h-3 w-3" />
                Details
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;
