import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserBook } from "@/types/book";
import { Review } from "@/types/review";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Bookmark, Star, MessageSquare, Share2, Heart, Lock, Unlock, BookOpen, CheckCircle, BookMarked, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReadingProgressModal from "@/components/ReadingProgressModal";
import AddToBookshelfModal from "@/components/AddToBookshelfModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateUserBook, useAddUserBook, useBook, useUserBookDetails } from "@/services/bookService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rating } from "../components/Rating";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Using any type to accommodate the database structure which might have additional fields
  const [userBook, setUserBook] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isInCollection, setIsInCollection] = useState(false);
  const [notes, setNotes] = useState("");
  const [newReview, setNewReview] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [isRecommended, setIsRecommended] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [addToBookshelfModalOpen, setAddToBookshelfModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [animateEntry, setAnimateEntry] = useState(true);
  
  // Use a simpler approach to fetch book data
  const { data: book, isLoading: bookLoading, isError: bookError } = useBook(id || "");
  
  // Track loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  
  const updateUserBook = useUpdateUserBook();
  const addUserBook = useAddUserBook();

  useEffect(() => {
    // Set animation entry state
    setAnimateEntry(true);
    
    // Update loading and error states based on book query
    setIsLoading(bookLoading);
    setIsError(bookError);
    
    // If we have a book and user, check if it's in the user's collection
    if (book && user && !bookLoading) {
      const checkUserCollection = async () => {
        try {
          console.log('Checking if book is in user collection:', book.id);
          
          const { data: userBookData, error: userBookError } = await supabase
            .from('user_books')
            .select('*')
            .eq('book_id', book.id)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (userBookError) {
            console.error('Error checking user book:', userBookError);
          } else if (userBookData) {
            console.log('Found book in user collection:', userBookData);
            setUserBook(userBookData);
            setIsInCollection(true);
            setNotes(userBookData.notes || '');
            setIsPublic((userBookData as any)?.is_public ?? true);
            if (userBookData.rating) setUserRating(userBookData.rating);
          } else {
            console.log('Book not in user collection');
            setIsInCollection(false);
          }
        } catch (error) {
          console.error('Error checking user collection:', error);
        }
      };
      
      checkUserCollection();
      
      // Fetch reviews for this book
      const fetchReviews = async () => {
        try {
          console.log('Fetching reviews for book:', book.id);
          
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select('*, profiles(*)')
            .eq('book_id', book.id)
            .order('date_posted', { ascending: false });
          
          if (reviewsError) {
            console.error('Error fetching reviews:', reviewsError);
          } else if (reviewsData) {
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
      
      fetchReviews();
    }
    
    // If there's an error with the book data, show a toast
    if (bookError) {
      toast({
        title: 'Error',
        description: 'Failed to load book details',
        variant: 'destructive'
      });
    }
    
    // If the book doesn't exist and loading is complete, navigate back to bookshelf
    if (!bookLoading && !book && !bookError) {
      toast({
        title: 'Book not found',
        description: 'The requested book could not be found',
        variant: 'destructive'
      });
      navigate('/bookshelf');
    }
  }, [id, user, book, bookLoading, bookError, navigate, toast]);

  const openAddToBookshelfModal = () => {
    if (!book || !user) return;
    setAddToBookshelfModalOpen(true);
  };
  
  const addToBookshelf = async (bookData: {
    status: string;
    rating?: number;
    progress?: number;
    startDate?: string;
    finishDate?: string;
    notes?: string;
    isPublic: boolean;
  }) => {
    if (!book || !user) return;
    
    try {
      const newUserBook = {
        user_id: user.id,
        book_id: book.id,
        status: bookData.status,
        rating: bookData.rating,
        progress: bookData.progress,
        start_date: bookData.startDate,
        finish_date: bookData.finishDate,
        notes: bookData.notes,
        is_public: bookData.isPublic,
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
        setNotes(data.notes || '');
        // Using type assertion since the TypeScript type doesn't include is_public
        if ((data as any).is_public !== undefined) {
          setIsPublic((data as any).is_public);
        }
        if (data.rating) setUserRating(data.rating);
        
        toast({
          title: 'Book added',
          description: 'Book has been added to your bookshelf',
        });
        
        setAddToBookshelfModalOpen(false);
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
      // Create updates object with only the fields we want to update
      const updates: Partial<UserBook> = {
        status: status
      };
      
      // If status is 'currently-reading' and there's no start date, set it to today
      if (status === 'currently-reading' && !userBook.start_date) {
        updates.startDate = new Date().toISOString();
      }
      
      // If status is 'finished' and there's no finish date, set it to today
      if (status === 'finished') {
        if (!userBook.finish_date) {
          updates.finishDate = new Date().toISOString();
        }
        // If there's no progress or progress < 100, set it to 100%
        if (!userBook.progress || userBook.progress < 100) {
          updates.progress = 100;
        }
      }
      
      // Use the updateUserBook hook to update the book status
      const result = await updateUserBook.mutateAsync({
        id: userBook.id,
        updates: updates
      });
      
      if (result) {
        setUserBook(result);
        
        toast({
          title: 'Status updated',
          description: `Book is now marked as "${status.replace('-', ' ')}"`,
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
      // Use the updateUserBook hook to update the rating
      const result = await updateUserBook.mutateAsync({
        id: userBook.id,
        updates: {
          userRating: rating
        }
      });
      
      if (result) {
        setUserBook(result);
        setUserRating(rating);
        
        toast({
          title: 'Rating updated',
          description: `You rated this book ${rating} stars`,
        });
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to update book rating',
        variant: 'destructive'
      });
    }
  };
  
  const saveNotes = async () => {
    if (!book || !userBook) return;
    
    try {
      // Use the updateUserBook hook to update notes
      const result = await updateUserBook.mutateAsync({
        id: userBook.id,
        updates: {
          notes: notes
        }
      });
      
      if (result) {
        setUserBook(result);
        
        toast({
          title: 'Notes saved',
          description: 'Your notes have been saved',
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
  
  const handleUpdateProgress = async (progress: number) => {
    if (!book || !userBook) return;
    
    try {
      // Create updates object with the fields we want to update
      const updates: Partial<UserBook> = {
        progress: progress
      };
      
      // If progress is 100% and status is 'currently-reading', ask if they want to mark as finished
      if (progress === 100 && userBook.status === 'currently-reading') {
        // For now, we'll just automatically update the status to finished
        updates.status = 'finished';
        updates.finishDate = new Date().toISOString();
      }
      
      // If there's no start date, set it to today
      if (!userBook.start_date && progress > 0) {
        updates.startDate = new Date().toISOString();
      }
      
      // Use the updateUserBook hook to update the progress
      const result = await updateUserBook.mutateAsync({
        id: userBook.id,
        updates: updates
      });
      
      if (result) {
        setUserBook(result);
        setProgressModalOpen(false);
        
        toast({
          title: 'Progress updated',
          description: `Reading progress updated to ${progress}%`,
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reading progress',
        variant: 'destructive'
      });
    }
  };
    
    if (!userBook.start_date && progress > 0) {
      updates.startDate = new Date().toISOString();
    }
    
    // Use the updateUserBook hook to update the progress
    const result = await updateUserBook.mutateAsync({
      id: userBook.id,
      updates: updates
    });
    
    if (result) {
      setUserBook(result);
      setProgressModalOpen(false);
      
      toast({
        title: 'Progress updated',
        description: `Reading progress updated to ${progress}%`,
      });
    }
  } catch (error) {
    console.error('Error updating progress:', error);
    toast({
      title: 'Error',
      description: 'Failed to update reading progress',
      variant: 'destructive'
    });
  }
};

const handlePrivacyChange = async (isPublic: boolean) => {
  if (!book || !userBook) return;
  
  try {
    // We need to handle is_public differently since it's not part of the UserBook type
    // but is included in the database schema
    const { data, error } = await supabase
      .from('user_books')
      .update({
        is_public: isPublic,
        updated_at: new Date().toISOString()
      })
      .eq('id', userBook.id)
      .select()
      .single();
    
    if (error) throw error;
    
    if (data) {
      setUserBook(data);
      setIsPublic(isPublic);
      
      toast({
        title: 'Privacy updated',
        description: isPublic ? 'Book is now public' : 'Book is now private',
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
  
  const openReviewModal = () => {
    setReviewModalOpen(true);
  };

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
        recommended: isRecommended
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
          recommended: data.recommended
        };
        
        setReviews([newFormattedReview, ...reviews]);
        setNewReview('');
        setReviewRating(0);
        setReviewModalOpen(false);
        
        // Also update the user's rating for the book if they don't have one yet
        if (!userBook?.rating && userBook) {
          handleRatingChange(reviewRating);
        }
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
  
  // Helper function to get the status badge with appropriate color
  const getStatusBadge = () => {
    if (!userBook) return null;
    
    switch (userBook.status) {
      case 'currently-reading':
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            <span>Currently Reading</span>
          </Badge>
        );
      case 'want-to-read':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 flex items-center gap-1">
            <BookMarked className="h-3 w-3" />
            <span>Want to Read</span>
          </Badge>
        );
      case 'finished':
        return (
          <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Finished</span>
          </Badge>
        );
      default:
        return null;
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  // Add console logs for debugging
  console.log('BookDetail render:', { id, book, userBook, bookLoading, bookError, isLoading, isError });

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
      ) : isError ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Error Loading Book</h2>
          <p className="text-muted-foreground mt-2">There was an error loading the book details. Please try again.</p>
          <Button onClick={() => navigate('/bookshelf')} className="mt-4">
            Go to My Bookshelf
          </Button>
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
              
              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                {/* Add to Bookshelf Button (Always shown) */}
                <Button 
                  className="w-full flex items-center justify-center gap-2" 
                  onClick={openAddToBookshelfModal}
                >
                  <Bookmark size={16} />
                  Add to Bookshelf
                </Button>
                
                {/* Review Button */}
                <Button 
                  className="w-full flex items-center justify-center gap-2"
                  variant="outline"
                  onClick={openReviewModal}
                >
                  <MessageSquare size={16} />
                  Write Review
                </Button>
              </div>
            </div>
            
            {/* Book Details */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{book.title}</h1>
                {/* Status Badge */}
                {isInCollection && getStatusBadge()}
              </div>
              
              <p className="text-lg text-muted-foreground">{book.author}</p>
              
              {/* Book Rating */}
              <div className="flex items-center gap-2 mt-2">
                <Rating value={book.averageRating || 0} readOnly />
                <span className="text-sm text-muted-foreground">
                  {book.ratingsCount ? `(${book.ratingsCount} ratings)` : '(No ratings yet)'}
                </span>
              </div>
              
              {/* User Rating (Only shown when in collection) */}
              {user && isInCollection && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-medium">My Rating:</span>
                  <Rating 
                    value={userBook?.rating || 0} 
                    onChange={handleRatingChange}
                    className="animate-pulse-on-hover" 
                  />
                </div>
              )}
              
              {/* Book Status Controls (Only shown when in collection) */}
              {user && isInCollection && (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={userBook?.status === 'want-to-read' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange('want-to-read')}
                      className="flex items-center gap-1"
                    >
                      <BookMarked size={14} />
                      Want to Read
                    </Button>
                    <Button 
                      variant={userBook?.status === 'currently-reading' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange('currently-reading')}
                      className="flex items-center gap-1"
                    >
                      <BookOpen size={14} />
                      Currently Reading
                    </Button>
                    <Button 
                      variant={userBook?.status === 'finished' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange('finished')}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle size={14} />
                      Finished
                    </Button>
                  </div>
                  
                  {/* Progress Update (Only for Currently Reading) */}
                  {userBook?.status === 'currently-reading' && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                        <motion.div 
                          className="bg-amber-500 h-full" 
                          initial={{ width: 0 }}
                          animate={{ width: `${userBook?.progress || 0}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
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
          
          {/* Book Description */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground whitespace-pre-line">{book.description}</p>
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
              
              <TabsContent value="details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Book Details</h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Publisher</span>
                        <span className="font-medium">{book.publisher || 'Unknown'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Published Date</span>
                        <span className="font-medium">{book.publishedDate || 'Unknown'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Pages</span>
                        <span className="font-medium">{book.pageCount || 'Unknown'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">ISBN</span>
                        <span className="font-medium">{book.isbn || 'Unknown'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-muted-foreground">Language</span>
                        <span className="font-medium">{book.language || 'Unknown'}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {book.genres?.map((genre, index) => (
                        <Badge key={index} variant="outline">{genre}</Badge>
                      )) || <span className="text-muted-foreground">No categories available</span>}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {user && isInCollection && (
                <TabsContent value="notes">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">My Notes</h3>
                    <Textarea
                      placeholder="Add your private notes about this book..."
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Reviews</h3>
                    {user && isInCollection && (
                      <Button 
                        onClick={openReviewModal} 
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <MessageSquare size={14} />
                        Write Review
                      </Button>
                    )}
                  </div>
                  
                  {/* Reviews List */}
                  {reviews.length > 0 ? (
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
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No reviews yet.</p>
                      {user && isInCollection ? (
                        <Button onClick={openReviewModal} variant="outline">
                          Be the first to review this book
                        </Button>
                      ) : user ? (
                        <p className="text-sm text-muted-foreground">Add this book to your bookshelf to write a review</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sign in to write a review</p>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Reading Progress Modal */}
          {book && (
            <ReadingProgressModal
              isOpen={progressModalOpen}
              onClose={() => setProgressModalOpen(false)}
              bookId={book.id}
              initialProgress={userBook?.progress || 0}
              onProgressUpdate={handleUpdateProgress}
            />
          )}
          
          {/* Add to Bookshelf Modal */}
          {book && (
            <AddToBookshelfModal
              isOpen={addToBookshelfModalOpen}
              onClose={() => setAddToBookshelfModalOpen(false)}
              book={book}
              onAdd={addToBookshelf}
            />
          )}
          
          {/* Review Modal */}
          {book && (
            <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ${reviewModalOpen ? 'block' : 'hidden'}`}>
              <motion.div 
                className="bg-background rounded-lg shadow-lg w-full max-w-md overflow-hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: reviewModalOpen ? 1 : 0, scale: reviewModalOpen ? 1 : 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Write a Review</h3>
                    <Button variant="ghost" size="sm" onClick={() => setReviewModalOpen(false)}>
                      <X />
                      <span className="sr-only">Close</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Rating:</span>
                      <Rating value={reviewRating} onChange={setReviewRating} />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        id="recommend"
                        checked={isRecommended}
                        onCheckedChange={setIsRecommended}
                      />
                      <Label htmlFor="recommend" className="cursor-pointer">Recommend this book</Label>
                    </div>
                    
                    <Textarea
                      placeholder="Share your thoughts about this book..."
                      className="min-h-[150px]"
                      value={newReview}
                      onChange={(e) => setNewReview(e.target.value)}
                    />
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setReviewModalOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={submitReview} 
                        disabled={!newReview || reviewRating === 0}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare size={16} />
                        Submit Review
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
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

export default BookDetail;
