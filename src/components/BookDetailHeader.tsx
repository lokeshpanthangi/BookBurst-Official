
import { UserBook } from "@/types/book";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  BookMarked,
  CheckCircle,
  Share2,
  Heart,
  Clock,
} from "lucide-react";
import BookCover from "./BookCover";
import StarRating from "./StarRating";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BookDetailHeaderProps {
  book: UserBook;
  onStatusChange: (status: UserBook["status"]) => void;
  onRatingChange: (rating: number) => void;
}

const BookDetailHeader = ({
  book,
  onStatusChange,
  onRatingChange,
}: BookDetailHeaderProps) => {
  return (
    <div className="bg-card border-b">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <BookCover src={book.coverImage} alt={book.title} size="lg" />
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
                {book.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-4">{book.author}</p>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center">
                  <StarRating
                    rating={book.userRating || 0}
                    onChange={onRatingChange}
                    size="lg"
                  />
                  <span className="ml-2 text-sm">
                    {book.userRating ? `Your rating: ${book.userRating}` : "Rate this book"}
                  </span>
                </div>

                {book.genres && book.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {book.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre}
                        className="px-2 py-1 bg-secondary/10 text-xs rounded-full text-secondary-foreground"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={book.status}
                  onValueChange={(value: UserBook["status"]) => onStatusChange(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Set Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="want-to-read">Want to Read</SelectItem>
                      <SelectItem value="currently-reading">Currently Reading</SelectItem>
                      <SelectItem value="finished">Finished</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add to favorites</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share this book</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {book.status === "currently-reading" && (
                <div className="w-full max-w-md">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Reading Progress</span>
                    <span>{book.progress || 0}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${book.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailHeader;
