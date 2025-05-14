import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MessageSquare, Star, X, FileText, Save, Loader2 } from "lucide-react";
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
  const [isRecommended, setIsRecommended] = useState(false);
  
  // User book state
  const [userBook, setUserBook] = useState<any>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [progress, setProgress] = useState(0);
  
  // Personal notes state
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [personalNotes, setPersonalNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Add a function to check valid status values in the database
  const checkValidStatusValues = async () => {
    try {
      console.log('Checking valid status values in the database...');
      
      // Query a few user_books records to see what status values are being used
      const { data, error } = await supabase
        .from('user_books')
        .select('status')
        .limit(10);
      
      if (error) {
        console.error('Error fetching status values:', error);
        return;
      }
      
      if (data && data.length > 0) {
        console.log('Found existing status values:', data.map(item => item.status));
        // Use the first status value we find as our selected status
        if (data[0].status) {
          setSelectedStatus(data[0].status);
        }
      } else {
        console.log('No existing user_books records found');
      }
    } catch (error) {
      console.error('Error checking status values:', error);
    }
  };
  
  useEffect(() => {
    // Check valid status values when component mounts
    checkValidStatusValues();
    
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
        
        // If user is logged in, check if they have this book in their bookshelf
        if (user) {
          fetchUserBook(bookData.id);
        }
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
    
    const fetchUserBook = async (bookId: string) => {
      if (!user) return;
      
      try {
        console.log('Checking if user has this book in their bookshelf');
        
        const { data: userBookData, error: userBookError } = await supabase
          .from('user_books')
          .select('*')
          .eq('user_id', user.id)
          .eq('book_id', bookId)
          .single();
        
        if (userBookError && userBookError.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
          console.error('Error fetching user book:', userBookError);
          return;
        }
        
        if (userBookData) {
          console.log('User has this book in their bookshelf:', userBookData);
          setUserBook(userBookData);
          setSelectedStatus(userBookData.status || '');
          setProgress(userBookData.progress || 0);
          setPersonalNotes(userBookData.notes || ''); // Load personal notes
        } else {
          console.log('User does not have this book in their bookshelf');
          setUserBook(null);
          setPersonalNotes('');
        }
      } catch (error) {
        console.error('Error checking user book:', error);
      }
    };
    
    fetchBookDetails();
  }, [id, toast, user]);

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
  
  // Function to open the status modal
  const openStatusModal = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'You need to sign in to update your reading status',
        variant: 'destructive'
      });
      return;
    }
    
    setStatusModalOpen(true);
  };
  
  // Function to open the notes modal
  const openNotesModal = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'You need to sign in to add personal notes',
        variant: 'destructive'
      });
      return;
    }
    
    setNotesModalOpen(true);
  };
  
  // Function to save personal notes
  const savePersonalNotes = async () => {
    if (!book || !user) {
      console.error('Missing book or user data');
      return;
    }
    
    setIsSavingNotes(true);
    
    try {
      console.log('Saving personal notes for book:', book.id);
      
      // Check if the user already has this book
      const { data: existingBooks, error: checkError } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', book.id);
      
      if (checkError) {
        console.error('Error checking if book exists:', checkError);
        throw checkError;
      }
      
      if (existingBooks && existingBooks.length > 0) {
        // Book exists, update the notes
        const existingBook = existingBooks[0];
        console.log('Updating notes for existing user book with ID:', existingBook.id);
        
        const { error } = await supabase
          .from('user_books')
          .update({
            notes: personalNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBook.id);
        
        if (error) {
          console.error('Error updating notes:', error);
          throw error;
        }
        
        console.log('Successfully updated notes');
        
        // Update local state
        setUserBook({
          ...existingBook,
          notes: personalNotes,
          updated_at: new Date().toISOString()
        });
        
        toast({
          title: 'Notes saved',
          description: 'Your personal notes have been saved',
        });
      } else {
        // Book doesn't exist, add it with notes
        console.log('Adding new user book with notes for book:', book.id);
        
        const { data, error } = await supabase
          .from('user_books')
          .insert({
            user_id: user.id,
            book_id: book.id,
            status: 'to-read', // Default status
            progress: 0,
            notes: personalNotes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (error) {
          console.error('Error inserting user book with notes:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log('Successfully added user book with notes:', data[0]);
          setUserBook(data[0]);
          setSelectedStatus(data[0].status || '');
          setProgress(data[0].progress || 0);
          
          toast({
            title: 'Notes saved',
            description: 'Book added to your bookshelf with personal notes',
          });
        }
      }
      
      setNotesModalOpen(false);
    } catch (error: any) {
      console.error('Error saving personal notes:', error);
      toast({
        title: 'Error',
        description: `Failed to save your notes: ${error.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    } finally {
      setIsSavingNotes(false);
    }
  };
  
  // Function to update the user's book status
  const updateBookStatus = async () => {
    if (!book || !user) {
      console.error('Missing book or user data');
      return;
    }
    
    try {
      console.log('Updating book status:', { book, user, selectedStatus, progress });
      
      // Prepare progress value - only non-zero for 'reading' status
      const progressValue = selectedStatus === 'reading' ? progress : 0;
      
      // First, check if the user already has this book
      const { data: existingBooks, error: checkError } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', book.id);
      
      if (checkError) {
        console.error('Error checking if book exists:', checkError);
        throw checkError;
      }
      
      if (existingBooks && existingBooks.length > 0) {
        // Book exists, update it
        const existingBook = existingBooks[0];
        console.log('Updating existing user book with ID:', existingBook.id);
        
        // Try a direct update with the exact values
        const { error } = await supabase
          .from('user_books')
          .update({
            status: selectedStatus,
            progress: progressValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBook.id);
        
        if (error) {
          console.error('Error updating user book:', error);
          throw error;
        }
        
        console.log('Successfully updated user book');
        
        // Update local state
        setUserBook({
          ...existingBook,
          status: selectedStatus,
          progress: progressValue,
          updated_at: new Date().toISOString()
        });
        
        toast({
          title: 'Status updated',
          description: 'Your reading status has been updated',
        });
      } else {
        // Book doesn't exist, insert it
        console.log('Adding new user book for book:', book.id);
        
        // Try a direct insert with the exact values
        const { data, error } = await supabase
          .from('user_books')
          .insert({
            user_id: user.id,
            book_id: book.id,
            status: selectedStatus,
            progress: progressValue,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (error) {
          console.error('Error inserting user book:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log('Successfully added user book:', data[0]);
          setUserBook(data[0]);
          
          toast({
            title: 'Book added',
            description: 'Book has been added to your bookshelf',
          });
        }
      }
      
      setStatusModalOpen(false);
    } catch (error: any) {
      console.error('Error updating book status:', error);
      toast({
        title: 'Error',
        description: `Failed to update your reading status: ${error.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    }
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
              
              <div className="mt-4 flex flex-wrap gap-2">
                <Button 
                  onClick={openReviewModal} 
                  className="flex items-center gap-2"
                >
                  <MessageSquare size={16} />
                  Add a Review
                </Button>
                
                <Button 
                  onClick={openStatusModal} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Star size={16} />
                  Edit Progress
                </Button>
                
                <Button 
                  onClick={openNotesModal} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileText size={16} />
                  Personal Notes
                </Button>
                
                <div className="w-full mt-2 p-3 border rounded-md bg-muted/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Status: <span className="font-normal">{userBook ? userBook.status || 'Not set' : 'Not started'}</span></p>
                      <p className="text-sm font-medium mt-1">Progress: <span className="font-normal">{userBook ? userBook.progress || 0 : 0}%</span></p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={openStatusModal}
                      className="text-xs"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
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
                  {userBook && userBook.notes && (
                    <TabsTrigger value="personal">Personal Notes</TabsTrigger>
                  )}
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
                          <div className="flex flex-col items-end">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  size={16}
                                  className={star <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}
                                />
                              ))}
                            </div>
                            {review.recommended && (
                              <span className="text-xs text-green-600 font-semibold mt-1 px-2 py-0.5 bg-green-50 rounded-full">Recommended</span>
                            )}
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
              
              <TabsContent value="personal" className="space-y-6">
                {userBook && userBook.notes ? (
                  <div className="border rounded-lg p-6 shadow-sm bg-card">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">My Notes</h3>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={openNotesModal}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="whitespace-pre-wrap">{userBook.notes}</div>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-muted/20">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">No personal notes yet</h3>
                    <p className="text-muted-foreground">Add your personal thoughts, quotes, or reflections about this book.</p>
                    <Button onClick={openNotesModal} className="mt-4">
                      Add Notes
                    </Button>
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
                
                <div className="flex items-center gap-2 mb-4">
                  <Switch
                    id="recommend"
                    checked={isRecommended}
                    onCheckedChange={setIsRecommended}
                  />
                  <Label htmlFor="recommend" className="cursor-pointer">Recommend this book</Label>
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
          
          {/* Status Modal */}
          {statusModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Update Reading Progress</h2>
                  <Button variant="ghost" size="icon" onClick={() => setStatusModalOpen(false)}>
                    <X size={18} />
                  </Button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Reading Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['to read', 'reading', 'completed'].map(status => (
                      <Button
                        key={status}
                        type="button"
                        variant={selectedStatus === status ? "default" : "outline"}
                        onClick={() => {
                          setSelectedStatus(status);
                          // Reset progress to 0 if not reading
                          if (status !== 'reading') {
                            setProgress(0);
                          }
                        }}
                        className="justify-start"
                      >
                        {status === 'to read' ? 'Want to Read' : 
                         status === 'reading' ? 'Reading' : 
                         'Completed'}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {selectedStatus === 'reading' && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium">Progress: {progress}%</p>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={updateBookStatus}
                    disabled={!selectedStatus}
                  >
                    Update Progress
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Personal Notes Modal */}
          {notesModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background rounded-lg p-6 max-w-2xl w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Personal Notes</h2>
                  <Button variant="ghost" size="icon" onClick={() => setNotesModalOpen(false)}>
                    <X size={18} />
                  </Button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Your private notes for "{book?.title}"</p>
                  <Textarea
                    value={personalNotes}
                    onChange={(e) => setPersonalNotes(e.target.value)}
                    placeholder="Add your personal thoughts, favorite quotes, or reflections about this book..."
                    className="min-h-[250px] w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-2">These notes are private and only visible to you.</p>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNotesModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={savePersonalNotes}
                    disabled={isSavingNotes}
                    className="flex items-center gap-2"
                  >
                    {isSavingNotes && <Loader2 size={16} className="animate-spin" />}
                    {isSavingNotes ? 'Saving...' : 'Save Notes'}
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
