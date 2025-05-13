
import { useState } from "react";
import { Review } from "@/types/review";
import StarRating from "./StarRating";
import { Button } from "@/components/ui/button";
import { ThumbsUp, AlertTriangle, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface ReviewCardProps {
  review: Review;
}

const ReviewCard = ({ review }: ReviewCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(review.likes);
  const { toast } = useToast();
  
  const formattedDate = new Date(review.datePosted);
  const timeAgo = formatDistanceToNow(formattedDate, { addSuffix: true });
  
  // Determine if the content is long and should be truncated
  const isLongContent = review.content.length > 300;
  
  const handleLikeClick = () => {
    if (liked) {
      setLiked(false);
      setLikeCount(likeCount - 1);
    } else {
      setLiked(true);
      setLikeCount(likeCount + 1);
      toast({
        title: "Review marked as helpful",
        description: "Thank you for your feedback",
        duration: 2000,
      });
    }
  };
  
  const handleReportClick = () => {
    toast({
      title: "Review reported",
      description: "Thank you for helping keep BookBurst safe",
      variant: "destructive",
    });
  };
  
  return (
    <div className="bg-card border rounded-lg p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden mr-3">
          {review.userAvatar ? (
            <img 
              src={review.userAvatar} 
              alt={review.userName} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {review.userName.charAt(0)}
            </div>
          )}
        </div>
        
        <div>
          <div className="font-medium">{review.userName}</div>
          <div className="text-xs text-muted-foreground">{timeAgo}</div>
        </div>
      </div>
      
      <div className="mb-3">
        <StarRating rating={review.rating} readOnly interactive={false} />
        {review.recommended && (
          <div className="mt-1 text-sm text-primary">
            ✓ Recommends this book
          </div>
        )}
      </div>
      
      {review.spoiler && (
        <div className="mb-3 p-2 bg-muted/30 border border-muted rounded-md text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-accent" />
          This review may contain spoilers
        </div>
      )}
      
      <div className="mb-4">
        <div 
          className={`text-sm ${isLongContent && !expanded ? "line-clamp-5" : ""}`}
        >
          {review.content}
        </div>
        
        {isLongContent && (
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
      
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm"
          className={liked ? "text-primary" : ""}
          onClick={handleLikeClick}
        >
          <ThumbsUp className="h-4 w-4 mr-1" />
          Helpful {likeCount > 0 && `(${likeCount})`}
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={handleReportClick}
              >
                <Flag className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Report review</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ReviewCard;
