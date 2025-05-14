
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
    <div className="book-card hover-scale">
      <div className="book-card-image">
        <Link to={`/book/${book.id}`}>
          <BookCover src={book.coverImage} alt={book.title} className="w-full" />
        </Link>
      </div>
      
      <div className="p-3">
        <Link to={`/book/${book.id}`} className="mb-1">
          <h3 className="font-playfair font-medium text-lg line-clamp-1">
            {book.title}
          </h3>
        </Link>
        
        <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
        
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
        
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/book/${book.id}`}>
              <BookOpen className="mr-1 h-3 w-3" />
              View
            </Link>
          </Button>
          
          <Button size="sm" onClick={onAddToShelf}>
            <PlusCircle className="mr-1 h-3 w-3" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExploreCard;
