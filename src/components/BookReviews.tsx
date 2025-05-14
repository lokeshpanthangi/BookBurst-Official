import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types/review";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Rating } from "./Rating";
import { Heart, Share2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { useAuth } from "@/hooks/useAuth";

interface BookReviewsProps {
  bookId: string;
  onWriteReview: () => void;
}

const REVIEWS_PER_PAGE = 5;

const BookReviews: React.FC<BookReviewsProps> = ({ bookId, onWriteReview }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get total count first
        const { count, error: countError } = await supabase
          .from('reviews')
          .select('*', { count: 'exact' })
          .eq('book_id', bookId);
          
        if (countError) throw countError;
        setTotalReviews(count || 0);
        
        // Then get paginated reviews
        const { data, error: reviewsError } = await supabase
          .from('reviews')
          .select('*, profiles(*)')
          .eq('book_id', bookId)
          .order('created_at', { ascending: false })
          .range(currentPage * REVIEWS_PER_PAGE, (currentPage + 1) * REVIEWS_PER_PAGE - 1);
        
        if (reviewsError) throw reviewsError;
        
        // Format the reviews
        const formattedReviews = data.map(review => ({
          id: review.id,
          bookId: review.book_id,
          userId: review.user_id,
          userName: review.profiles?.username || 'Anonymous',
          userAvatar: review.profiles?.avatar_url || '',
          rating: review.rating,
          content: review.content,
          datePosted: review.date_posted || new Date().toISOString(),
          likes: review.likes || 0,
          spoiler: review.spoiler || false,
          recommended: review.recommended || false
        }));
        
        setReviews(formattedReviews);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, [bookId, currentPage]);
  
  const totalPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Reviews</h3>
        {user && (
          <Button 
            onClick={onWriteReview} 
            size="sm"
            className="flex items-center gap-1"
          >
            <MessageSquare size={14} />
            Write Review
          </Button>
        )}
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-background p-4 rounded-lg border space-y-2 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-muted"></div>
                  <div>
                    <div className="h-4 w-24 bg-muted rounded"></div>
                    <div className="h-3 w-16 bg-muted rounded mt-1"></div>
                  </div>
                </div>
                <div className="h-4 w-20 bg-muted rounded"></div>
              </div>
              <div className="h-4 w-full bg-muted rounded"></div>
              <div className="h-4 w-3/4 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : reviews.length > 0 ? (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <motion.div 
                key={review.id} 
                className="bg-background p-4 rounded-lg border space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={review.userAvatar} />
                      <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{review.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.datePosted).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Rating value={review.rating} readOnly />
                    {review.recommended && (
                      <span className="text-xs text-green-600 font-semibold mt-1 px-2 py-0.5 bg-green-50 rounded-full">Recommended</span>
                    )}
                  </div>
                </div>
                <p className="text-sm">{review.content}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <Heart size={14} />
                    <span className="text-xs">{review.likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <Share2 size={14} />
                    <span className="text-xs">Share</span>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                {currentPage > 0 && (
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} 
                      className="cursor-pointer"
                    />
                  </PaginationItem>
                )}
                
                {Array.from({ length: totalPages }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink 
                      isActive={index === currentPage}
                      onClick={() => setCurrentPage(index)}
                      className="cursor-pointer"
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                {currentPage < totalPages - 1 && (
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                      className="cursor-pointer"
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No reviews yet.</p>
          {user ? (
            <Button onClick={onWriteReview} variant="outline">
              Be the first to review this book
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Sign in to write a review</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BookReviews;
