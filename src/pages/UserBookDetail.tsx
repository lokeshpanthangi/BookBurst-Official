import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rating } from "../components/Rating";

const UserBookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Review state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState("");
  const [reviewRating, setReviewRating] = useState(0);

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(false);
      
      try {
        console.log('Fetching book with ID:', id);
        
        // Fetch the book directly from the database
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .single();
        
        if (bookError) {
          console.error('Error fetching book:', bookError);
          setError(true);
          toast({
            title: 'Error',
            description: 'Failed to load book details',
            variant: 'destructive'
          });
          return;
        }
        
        if (!bookData) {
          console.error('Book not found');
          setError(true);
          toast({
            title: 'Book not found',
            description: 'The requested book could not be found',
            variant: 'destructive'
          });
          return;
        }
        
        console.log('Book data:', bookData);
        setBook(bookData);
        
        // Fetch reviews for this book
        fetchReviews(bookData.id);
      } catch (error) {
        console.error('Error in fetchBookDetails:', error);
        setError(true);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    const fetchReviews = async (bookId: string) => {
      try {
        console.log('Fetching reviews for book:', bookId);
        
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*, profiles(*)')
          .eq('book_id', bookId)
          .order('date_posted', { ascending: false });
        
        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError);
          return;
        }
        
        if (reviewsData) {
          console.log('Found reviews:', reviewsData.length);
          
          // Format the reviews
          const formattedReviews = reviewsData.map(review => ({
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
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };
    
    fetchBookDetails();
  }, [id, toast]);

  // Function to open the review modal
  const openReviewModal = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'You need to sign in to write a review',
        variant: 'destructive'
      });
      return;
    }
    
    setReviewModalOpen(true);
  };
  
  // Function to submit a new review
  const submitReview = async () => {
    if (!book || !user || !newReview || reviewRating === 0) return;
    
    try {
      const reviewData = {
        book_id: book.id,
        user_id: user.id,
        content: newReview,
        rating: reviewRating,
        date_posted: new Date().toISOString(),
        spoiler: false,
        recommended: true
      };
      
      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select('*, profiles(*)')
        .single();
      
      if (error) throw error;
      
      if (data) {
        const newFormattedReview = {
          id: data.id,
          bookId: data.book_id,
          userId: data.user_id,
          userName: data.profiles?.username || 'You',
          userAvatar: data.profiles?.avatar_url || '',
          rating: data.rating,
          content: data.content,
          datePosted: data.date_posted || new Date().toISOString(),
          likes: 0,
          spoiler: false,
          recommended: true
        };
        
        setReviews([newFormattedReview, ...reviews]);
        setNewReview('');
        setReviewRating(0);
        setReviewModalOpen(false);
        
        toast({
          title: 'Review submitted',
          description: 'Your review has been posted',
        });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive'
      });
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button
        onClick={() => navigate(-1)}
        variant="ghost"
        className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back
      </Button>
      
      {loading ? (
        <div className="space-y-4">
          <div className="flex gap-6">
            <Skeleton className="h-[225px] w-[150px] rounded-md" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4 mt-2" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Error Loading Book</h2>
          <p className="text-muted-foreground mt-2">There was an error loading the book details. Please try again.</p>
          <Button onClick={() => navigate('/bookshelf')} className="mt-4">
            Go to My Bookshelf
          </Button>
        </div>
      ) : book ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <img 
                src={book.cover_image || 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=300'} 
                alt={book.title} 
                className="w-[150px] h-[225px] object-cover rounded-md shadow-md" 
              />
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{book.title}</h1>
              <p className="text-muted-foreground mb-4">By {book.author}</p>
              
              {book.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-medium mb-2">Description</h2>
                  <p className="text-muted-foreground">{book.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {book.publisher && (
                  <div>
                    <h3 className="text-sm font-medium">Publisher</h3>
                    <p className="text-muted-foreground">{book.publisher}</p>
                  </div>
                )}
                
                {book.published_date && (
                  <div>
                    <h3 className="text-sm font-medium">Published Date</h3>
                    <p className="text-muted-foreground">{book.published_date}</p>
                  </div>
                )}
                
                {book.page_count && (
                  <div>
                    <h3 className="text-sm font-medium">Pages</h3>
                    <p className="text-muted-foreground">{book.page_count}</p>
                  </div>
                )}
                
                {book.language && (
                  <div>
                    <h3 className="text-sm font-medium">Language</h3>
                    <p className="text-muted-foreground">{book.language}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <Button 
                  onClick={openReviewModal} 
                  className="flex items-center gap-2"
                >
                  <MessageSquare size={16} />
                  Add a Review
                </Button>
              </div>
            </div>
          </div>
          
          {/* Reviews Section */}
          <div className="mt-10">
            <Tabs defaultValue="public">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Reviews</h2>
                <TabsList>
                  <TabsTrigger value="public">Public Reviews</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="public" className="space-y-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-8 border rounded-md bg-muted/20">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">No reviews yet</h3>
                    <p className="text-muted-foreground">Be the first to share your thoughts on this book.</p>
                    <Button onClick={openReviewModal} className="mt-4">
                      Write a Review
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map(review => (
                      <div key={review.id} className="border rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={review.userAvatar} />
                              <AvatarFallback>{review.userName.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{review.userName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.datePosted).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                size={16}
                                className={star <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm">{review.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Review Modal */}
          {reviewModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Write a Review</h2>
                  <Button variant="ghost" size="icon" onClick={() => setReviewModalOpen(false)}>
                    <X size={18} />
                  </Button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          size={24}
                          className={star <= reviewRating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Your Review</p>
                  <Textarea
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    placeholder="Share your thoughts about this book..."
                    className="min-h-[150px]"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={submitReview}
                    disabled={!newReview || reviewRating === 0}
                  >
                    Submit Review
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Book not found</h2>
          <p className="text-muted-foreground mt-2">The book you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/bookshelf')} className="mt-4">
            Go to My Bookshelf
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserBookDetail;
