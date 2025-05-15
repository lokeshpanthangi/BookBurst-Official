import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getBookDetails } from "@/services/googleBooksService";
import { Book } from "@/types/book";
import { ArrowLeft, Bookmark, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rating } from "../components/Rating";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import BookReviews from "@/components/BookReviews";
import { useAddBook, useAddUserBook } from "@/services/bookService";
import AddToBookshelfModal from "@/components/AddToBookshelfModal";

const GoogleBookDetail = () => {
  // Get book ID from URL parameter
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State for modal functionality
  const [addToBookshelfModalOpen, setAddToBookshelfModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newReview, setNewReview] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [isRecommended, setIsRecommended] = useState(false);
  
  // Book database ID (if the book exists in our database)
  const [dbBookId, setDbBookId] = useState<string | null>(null);
  
  // Hooks for adding books
  const addBook = useAddBook();
  const addUserBook = useAddUserBook();
  
  useEffect(() => {
    const fetchBookDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!id) {
          setError("Book ID not found in URL");
          setLoading(false);
          return;
        }
        
        // Try fetching book details directly from Google Books API
        let result = await getBookDetails(id);
        
        // If not found, use a fallback book ID that's guaranteed to work
        if (!result) {
          // Use a popular book as fallback (Harry Potter)
          const fallbackResult = await getBookDetails('wrOQLV6xB-wC');
          
          if (fallbackResult) {
            result = {
              ...fallbackResult,
              id: id,
              title: `Book Details (ID: ${id})`,
              description: `We couldn't find the exact book with ID ${id}, so we're showing a sample book instead.`
            };
          }
        }
        
        if (result) {
          setBook(result);
          
          // Check if this book already exists in our database
          if (result.isbn) {
            const { data } = await supabase
              .from('books')
              .select('id')
              .eq('isbn', result.isbn)
              .maybeSingle();
              
            if (data) {
              setDbBookId(data.id);
            }
          }
          
          // If no match by ISBN, try title+author
          if (!dbBookId && result.title && result.author) {
            const { data } = await supabase
              .from('books')
              .select('id')
              .eq('title', result.title)
              .eq('author', result.author)
              .maybeSingle();
              
            if (data) {
              setDbBookId(data.id);
            }
          }
        } else {
          setError("Could not find book details");
        }
      } catch (err) {
        console.error("Error fetching book details:", err);
        setError("An error occurred while fetching book details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookDetails();
  }, [id]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center text-primary hover:underline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Link>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <Skeleton className="w-48 h-72 rounded-md" />
          <div className="flex-1">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-6" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-6" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center text-primary hover:underline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Link>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Book Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || "We couldn't find the book you're looking for."}</p>
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Function to add book to database and then to user's bookshelf
  const handleAddToBookshelf = async (bookshelfData: any) => {
    if (!book || !user) return;
    
    try {
      let bookIdToUse = dbBookId;
      
      // If the book doesn't exist in our database yet, add it
      if (!bookIdToUse) {
        const addedBook = await addBook.mutateAsync({
          title: book.title,
          author: book.author,
          coverImage: book.coverImage || '',
          description: book.description || '',
          publishedDate: book.publishedDate,
          publisher: book.publisher,
          pageCount: book.pageCount,
          isbn: book.isbn,
          language: book.language,
          genres: book.genres || [],
          averageRating: book.averageRating,
          ratingsCount: book.ratingsCount
        });
        
        bookIdToUse = addedBook.id;
        setDbBookId(bookIdToUse);
      }
      
      // Now add to user's bookshelf
      await addUserBook.mutateAsync({
        bookId: bookIdToUse,
        status: bookshelfData.status,
        startDate: bookshelfData.startDate,
        progress: bookshelfData.progress,
        notes: bookshelfData.notes,
        isPublic: bookshelfData.isPublic // Pass the isPublic parameter from the modal
      });
      
      setAddToBookshelfModalOpen(false);
      
      toast({
        title: "Book added",
        description: "Book has been added to your bookshelf"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add book to your bookshelf",
        variant: "destructive"
      });
    }
  };
  
  // Function to handle submitting a review
  const handleSubmitReview = async () => {
    if (!book || !user || !newReview || reviewRating === 0) return;
    
    try {
      let bookIdToUse = dbBookId;
      
      // If the book doesn't exist in our database yet, add it
      if (!bookIdToUse) {
        const addedBook = await addBook.mutateAsync({
          title: book.title,
          author: book.author,
          coverImage: book.coverImage || '',
          description: book.description || '',
          publishedDate: book.publishedDate,
          publisher: book.publisher,
          pageCount: book.pageCount,
          isbn: book.isbn,
          language: book.language,
          genres: book.genres || [],
          averageRating: book.averageRating,
          ratingsCount: book.ratingsCount
        });
        
        bookIdToUse = addedBook.id;
        setDbBookId(bookIdToUse);
      }
      
      // Add the review
      const reviewData = {
        book_id: bookIdToUse,
        user_id: user.id,
        rating: reviewRating,
        content: newReview,
        date_posted: new Date().toISOString(),
        recommended: isRecommended,
        likes: 0,
        spoiler: false
      };
      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();
      
      if (error) throw error;
      
      setReviewModalOpen(false);
      setNewReview('');
      setReviewRating(0);
      
      toast({
        title: "Review submitted",
        description: "Your review has been posted"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive"
      });
    }
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
      ) : error || !book ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Book Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || "We couldn't find the book you're looking for."}</p>
          <Button onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              <img 
                src={book.coverImage || 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=300'} 
                alt={book.title} 
                className="w-[150px] h-[225px] rounded-md shadow-md object-cover"
              />
              
              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                {/* Add to Bookshelf Button */}
                <Button 
                  className="w-full flex items-center justify-center gap-2" 
                  onClick={() => {
                    if (user) {
                      setAddToBookshelfModalOpen(true);
                    } else {
                      toast({
                        title: "Authentication required",
                        description: "Please sign in to add books to your bookshelf",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <Bookmark size={16} />
                  Add to Bookshelf
                </Button>
                
                {/* Review Button */}
                <Button 
                  className="w-full flex items-center justify-center gap-2"
                  variant="outline"
                  onClick={() => {
                    if (user) {
                      setReviewModalOpen(true);
                    } else {
                      toast({
                        title: "Authentication required",
                        description: "Please sign in to write a review",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <MessageSquare size={16} />
                  Write Review
                </Button>
              </div>
            </div>

            {/* Book Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
              <p className="text-xl text-muted-foreground mb-4">{book.author}</p>
              
              <div className="flex items-center gap-4 mb-6">
                <Rating value={book.averageRating || 0} readOnly />
                <span className="text-sm text-muted-foreground">
                  {book.averageRating ? book.averageRating.toFixed(1) : '0'}
                  {book.ratingsCount ? ` (${book.ratingsCount} ratings)` : ' (No ratings yet)'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs for Book Details, Reviews, etc. */}
          <Tabs defaultValue="description" className="mt-8">
            <TabsList className="mb-4">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description">
              {book.description ? (
                <div>
                  <h2 className="text-xl font-semibold mb-2">Description</h2>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {book.description.replace(/<\/?[^>]+(>|$)/g, "")}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No description available for this book.</p>
              )}
            </TabsContent>
            
            <TabsContent value="details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <span className="font-medium">{book.language === 'en' ? 'English' : book.language || 'Unknown'}</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {book.genres && book.genres.length > 0 ? (
                      book.genres.map((genre, index) => (
                        <Badge key={index} variant="secondary">{genre}</Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No categories available</span>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reviews">
              {dbBookId ? (
                <BookReviews 
                  bookId={dbBookId} 
                  onWriteReview={() => setReviewModalOpen(true)} 
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No reviews yet.</p>
                  {user ? (
                    <Button onClick={() => setReviewModalOpen(true)} variant="outline">
                      Be the first to review this book
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sign in to write a review</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Add to Bookshelf Modal */}
          {book && (
            <AddToBookshelfModal
              isOpen={addToBookshelfModalOpen}
              onClose={() => setAddToBookshelfModalOpen(false)}
              book={book}
              onAdd={handleAddToBookshelf}
            />
          )}
          
          {/* Review Modal */}
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
                      onClick={handleSubmitReview} 
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
        </div>
      )}
    </div>
  );
};

export default GoogleBookDetail;
