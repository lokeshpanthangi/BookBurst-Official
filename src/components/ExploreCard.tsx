
import { Book } from "@/types/book";
import { Link } from "react-router-dom";
import BookCover from "./BookCover";
import StarRating from "./StarRating";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen } from "lucide-react";

interface ExploreCardProps {
  book: Book;
  onAddToShelf?: () => void;
}

const ExploreCard = ({ book, onAddToShelf }: ExploreCardProps) => {
  return (
    <div className="book-card hover-scale shadow-sm border rounded-md overflow-hidden">
      <div className="book-card-image relative pt-[150%]">
        <Link to={`/google-book/${book.id}`}>
          <BookCover 
            src={book.coverImage} 
            alt={book.title} 
            className="absolute inset-0 w-full h-full object-cover" 
          />
        </Link>
      </div>
      
      <div className="p-3">
        <Link to={`/google-book/${book.id}`} className="mb-1">
          <h3 className="font-playfair font-medium text-lg line-clamp-1 hover:underline">
            {book.title}
          </h3>
        </Link>
        
        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{book.author}</p>
        
        {book.averageRating ? (
          <div className="flex items-center space-x-2 mb-3">
            <StarRating 
              rating={book.averageRating} 
              readOnly 
              interactive={false}
              size="sm"
            />
            <span className="text-xs text-muted-foreground">
              {book.averageRating.toFixed(1)} ({book.ratingsCount || 0})
            </span>
          </div>
        ) : (
          <div className="h-5 mb-3"></div>
        )}
        
        <div className="flex flex-wrap gap-2 mt-auto">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/google-book/${book.id}`}>
              <BookOpen className="mr-1 h-3 w-3" />
              View
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExploreCard;
