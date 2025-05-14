import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserBook } from "@/types/book";
import { Review } from "@/types/review";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Bookmark, Star, MessageSquare, Share2, Heart, Lock, Unlock } from "lucide-react";
import { motion } from "framer-motion";
import ReadingProgressModal from "@/components/ReadingProgressModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateUserBook, useAddUserBook } from "@/services/bookService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rating } from "@/components/Rating";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [book, setBook] = useState<any>(null);
  const [userBook, setUserBook] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInCollection, setIsInCollection] = useState(false);
  const [notes, setNotes] = useState("");
  const [newReview, setNewReview] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [isPublic, setIsPublic] = useState(true);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [animateEntry, setAnimateEntry] = useState(true);
  
  const updateUserBook = useUpdateUserBook();
  const addUserBook = useAddUserBook();

  useEffect(() => {
    const fetchBookData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setAnimateEntry(true);
      
      try {
        // Fetch the book details
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .single();
        
        if (bookError) {
          console.error('Error fetching book:', bookError);
          toast({
            title: 'Error',
            description: 'Failed to load book details',
            variant: 'destructive'
          });
          return;
        }
        
        if (!bookData) {
          toast({
            title: 'Book not found',
            description: 'The requested book could not be found',
            variant: 'destructive'
          });
          navigate('/bookshelf');
          return;
        }
        
        // Format the book data
        const formattedBook = {
          id: bookData.id,
          title: bookData.title,
          author: bookData.author,
          coverImage: bookData.cover_image || 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=300',
          description: bookData.description || '',
          publishedDate: bookData.published_date,
          publisher: bookData.publisher,
          pageCount: bookData.page_count,
          isbn: bookData.isbn,
          language: bookData.language,
          averageRating: bookData.average_rating || 0,
          ratingsCount: bookData.ratings_count || 0,
          genres: bookData.genres || []
        };
        
        setBook(formattedBook);
        
        // If user is logged in, check if this book is in their collection
        if (user) {
          const { data: userBookData, error: userBookError } = await supabase
            .from('user_books')
            .select('*')
            .eq('book_id', id)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (userBookError) {
            console.error('Error checking user book:', userBookError);
          } else if (userBookData) {
            setUserBook(userBookData);
            setIsInCollection(true);
            setNotes(userBookData.notes || '');
            setIsPublic(userBookData.is_public !== false); // Default to true if not set
          }
        }
        
        // Fetch reviews for this book
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*, profiles(*)')
          .eq('book_id', id)
          .order('created_at', { ascending: false });
        
        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError);
        } else if (reviewsData) {
          // Format the reviews
          const formattedReviews = reviewsData.map(review => ({
            id: review.id,
            bookId: review.book_id,
            userId: review.user_id,
            userName: review.profiles?.display_name || 'Anonymous',
            userAvatar: review.profiles?.avatar_url || '',
            rating: review.rating,
            content: review.content,
            datePosted: review.created_at,
            likes: review.likes || 0,
            spoiler: review.spoiler || false,
            recommended: review.recommended || false
          }));
          
          setReviews(formattedReviews);
        }
      } catch (error) {
        console.error('Error in fetchBookData:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookData();
  }, [id, user, navigate, toast]);

  const addToBookshelf = async () => {
    if (!book || !user) return;
    
    try {
      const newUserBook = {
        user_id: user.id,
        book_id: book.id,
        status: 'want-to-read',
        is_public: isPublic,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('user_books')
        .insert(newUserBook)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setUserBook(data);
        setIsInCollection(true);
        
        toast({
          title: 'Book added',
          description: 'Book has been added to your bookshelf',
        });
      }
    } catch (error) {
      console.error('Error adding book:', error);
      toast({
        title: 'Error',
        description: 'Failed to add book to your bookshelf',
        variant: 'destructive'
      });
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!book || !userBook) return;
    
    try {
      const updatedUserBook = {
        ...userBook,
        status,
        updated_at: new Date().toISOString()
      };
      
      // If status is 'currently-reading' and there's no start date, add one
      if (status === 'currently-reading' && !updatedUserBook.start_date) {
        updatedUserBook.start_date = new Date().toISOString();
      }
      
      // If status is 'finished' and there's no finish date, add one
      if (status === 'finished' && !updatedUserBook.finish_date) {
        updatedUserBook.finish_date = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('user_books')
        .update(updatedUserBook)
        .eq('id', userBook.id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setUserBook(data);
        
        toast({
          title: 'Status updated',
          description: `Book moved to "${status.replace('-', ' ')}"`
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update book status',
        variant: 'destructive'
      });
    }
  };
  
  const handleRatingChange = async (rating: number) => {
    if (!book || !userBook) return;
    
    try {
      const updatedUserBook = {
        ...userBook,
        rating,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('user_books')
        .update(updatedUserBook)
        .eq('id', userBook.id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setUserBook(data);
        
        toast({
          title: 'Rating updated',
          description: `You rated this book ${rating} stars`
        });
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to update rating',
        variant: 'destructive'
      });
    }
  };
  
  const saveNotes = async () => {
    if (!book || !userBook) return;
    
    try {
      const updatedUserBook = {
        ...userBook,
        notes,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('user_books')
        .update(updatedUserBook)
        .eq('id', userBook.id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setUserBook(data);
        
        toast({
          title: 'Notes saved',
          description: 'Your notes have been saved'
        });
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateProgress = async (bookId: string, progress: number, startDate?: string) => {
    if (!book || !userBook) return;
    
    try {
      const updatedUserBook = {
        ...userBook,
        progress,
        start_date: startDate || userBook.start_date,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('user_books')
        .update(updatedUserBook)
        .eq('id', userBook.id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setUserBook(data);
        
        toast({
          title: 'Progress updated',
          description: `Progress updated to ${progress}%`
        });
        
        setProgressModalOpen(false);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update progress',
        variant: 'destructive'
      });
    }
  };
  
  const handlePrivacyChange = async (isPublic: boolean) => {
    if (!book || !userBook) return;
    
    try {
      const updatedUserBook = {
        ...userBook,
        is_public: isPublic,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('user_books')
        .update(updatedUserBook)
        .eq('id', userBook.id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setUserBook(data);
        setIsPublic(isPublic);
        
        toast({
          title: 'Privacy updated',
          description: isPublic ? 'Book is now public' : 'Book is now private'
        });
      }
    } catch (error) {
      console.error('Error updating privacy:', error);
      toast({
        title: 'Error',
        description: 'Failed to update privacy settings',
        variant: 'destructive'
      });
    }
  };
  
  const submitReview = async () => {
    if (!book || !user || !newReview || reviewRating === 0) return;
    
    try {
      const review = {
        book_id: book.id,
        user_id: user.id,
        content: newReview,
        rating: reviewRating,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        spoiler: false,
        recommended: true
      };
      
      const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select('*, profiles(*)')
        .single();
      
      if (error) throw error;
      
      if (data) {
        const newFormattedReview = {
          id: data.id,
          bookId: data.book_id,
          userId: data.user_id,
          userName: data.profiles?.display_name || 'You',
          userAvatar: data.profiles?.avatar_url || '',
          rating: data.rating,
          content: data.content,
          datePosted: data.created_at,
          likes: 0,
          spoiler: false,
          recommended: true
        };
        
        setReviews([newFormattedReview, ...reviews]);
        setNewReview('');
        setReviewRating(0);
        
        toast({
          title: 'Review submitted',
          description: 'Your review has been posted'
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
      
      {isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="w-1/3 h-8 bg-muted rounded animate-pulse" />
          <div className="flex gap-6">
            <div className="w-[150px] h-[225px] bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-4">
              <div className="w-full h-4 bg-muted rounded animate-pulse" />
              <div className="w-3/4 h-4 bg-muted rounded animate-pulse" />
              <div className="w-1/2 h-4 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      ) : book ? (
        <motion.div
          initial={animateEntry ? "hidden" : "visible"}
          animate="visible"
          variants={containerVariants}
        >
          {/* Book Header */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              <img 
                src={book.coverImage || 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=300'} 
                alt={book.title} 
                className="w-[150px] h-[225px] object-cover rounded-md shadow-md" 
              />
              
              {/* Add to Bookshelf Button (Only shown when not in collection) */}
              {user && !isInCollection && (
                <Button 
                  className="w-full mt-4 flex items-center justify-center gap-2" 
                  onClick={addToBookshelf}
                >
                  <Bookmark size={16} />
                  Add to Bookshelf
                </Button>
              )}
            </div>
            
            {/* Book Details */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{book.title}</h1>
              <p className="text-lg text-muted-foreground">{book.author}</p>
              
              {/* Book Rating */}
              <div className="flex items-center gap-2 mt-2">
                <Rating value={book.averageRating || 0} readOnly />
                <span className="text-sm text-muted-foreground">
                  {book.ratingsCount ? `(${book.ratingsCount} ratings)` : '(No ratings yet)'}
                </span>
              </div>
              
              {/* Book Status Controls (Only shown when in collection) */}
              {user && isInCollection && (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={userBook?.status === 'want-to-read' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange('want-to-read')}
                    >
                      Want to Read
                    </Button>
                    <Button 
                      variant={userBook?.status === 'currently-reading' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange('currently-reading')}
                    >
                      Currently Reading
                    </Button>
                    <Button 
                      variant={userBook?.status === 'finished' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange('finished')}
                    >
                      Finished
                    </Button>
                  </div>
                  
                  {/* Progress Update (Only for Currently Reading) */}
                  {userBook?.status === 'currently-reading' && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-primary h-full" 
                          style={{ width: `${userBook?.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{userBook?.progress || 0}%</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setProgressModalOpen(true)}
                      >
                        Update
                      </Button>
                    </div>
                  )}
                  
                  {/* User Rating */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">My Rating:</span>
                    <Rating 
                      value={userBook?.rating || 0} 
                      onChange={handleRatingChange} 
                    />
                  </div>
                  
                  {/* Privacy Setting */}
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="public-private" 
                      checked={isPublic}
                      onCheckedChange={handlePrivacyChange}
                    />
                    <Label htmlFor="public-private" className="flex items-center gap-1">
                      {isPublic ? (
                        <>
                          <Unlock size={14} />
                          Public
                        </>
                      ) : (
                        <>
                          <Lock size={14} />
                          Private
                        </>
                      )}
                    </Label>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Tabs Section */}
          <div className="mt-8">
            <Tabs defaultValue="details">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                {user && isInCollection && (
                  <TabsTrigger value="notes">My Notes</TabsTrigger>
                )}
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium">About this book</h3>
                    <p className="mt-2 text-muted-foreground">{book.description || "No description available."}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Book Information</h3>
                    
                    <div>
                      <span className="text-sm font-medium">Author:</span>
                      <span className="text-sm text-muted-foreground ml-2">{book.author}</span>
                    </div>
                    
                    {book.publishedDate && (
                      <div>
                        <span className="text-sm font-medium">Published:</span>
                        <span className="text-sm text-muted-foreground ml-2">{book.publishedDate}</span>
                      </div>
                    )}
                    
                    {book.publisher && (
                      <div>
                        <span className="text-sm font-medium">Publisher:</span>
                        <span className="text-sm text-muted-foreground ml-2">{book.publisher}</span>
                      </div>
                    )}
                    
                    {book.pageCount && (
                      <div>
                        <span className="text-sm font-medium">Pages:</span>
                        <span className="text-sm text-muted-foreground ml-2">{book.pageCount}</span>
                      </div>
                    )}
                    
                    {book.isbn && (
                      <div>
                        <span className="text-sm font-medium">ISBN:</span>
                        <span className="text-sm text-muted-foreground ml-2">{book.isbn}</span>
                      </div>
                    )}
                    
                    {book.genres && book.genres.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Genres:</span>
                        <span className="text-sm text-muted-foreground ml-2">{book.genres.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {user && isInCollection && (
                <TabsContent value="notes">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">My Notes</h3>
                    <Textarea
                      placeholder="Add your private notes about this book here..."
                      className="min-h-[200px]"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <Button onClick={saveNotes} className="flex items-center gap-2">
                      <Edit size={16} />
                      Save Notes
                    </Button>
                  </div>
                </TabsContent>
              )}
              
              <TabsContent value="reviews">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Reviews</h3>
                  
                  {/* Add Review Form */}
                  {user && (
                    <div className="bg-muted/30 p-4 rounded-lg space-y-3 border">
                      <h4 className="font-medium">Write a Review</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Rating:</span>
                        <Rating value={reviewRating} onChange={setReviewRating} />
                      </div>
                      <Textarea
                        placeholder="Share your thoughts about this book..."
                        className="min-h-[100px]"
                        value={newReview}
                        onChange={(e) => setNewReview(e.target.value)}
                      />
                      <Button 
                        onClick={submitReview} 
                        disabled={!newReview || reviewRating === 0}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare size={16} />
                        Submit Review
                      </Button>
                    </div>
                  )}
                  
                  {/* Reviews List */}
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-background p-4 rounded-lg border space-y-2">
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
                            <Rating value={review.rating} readOnly />
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No reviews yet. Be the first to review this book!</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <ReadingProgressModal
            isOpen={progressModalOpen}
            onClose={() => setProgressModalOpen(false)}
            bookId={book.id}
            currentProgress={userBook?.progress || 0}
            startDate={userBook?.start_date}
            onUpdateProgress={handleUpdateProgress}
          />
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

export default BookDetail;
