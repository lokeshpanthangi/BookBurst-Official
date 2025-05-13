
import { Book } from "@/types/book";
import { Link } from "react-router-dom";
import BookCover from "./BookCover";
import StarRating from "./StarRating";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExploreCardProps {
  book: Book;
  onAddToShelf?: () => void;
}

const ExploreCard = ({ book, onAddToShelf }: ExploreCardProps) => {
  const { toast } = useToast();
  
  const handleAddToShelf = () => {
    onAddToShelf?.();
    toast({
      title: "Added to your shelf",
      description: `${book.title} has been added to your "Want to Read" shelf.`,
      duration: 3000,
    });
  };
  
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
              {book.averageRating.toFixed(1)} ({book.ratingsCount})
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
          
          <Button size="sm" onClick={handleAddToShelf}>
            <PlusCircle className="mr-1 h-3 w-3" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExploreCard;
