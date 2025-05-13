
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserBook } from "@/types/book";
import { Review } from "@/types/review";
import BookDetailHeader from "@/components/BookDetailHeader";
import ReviewCard from "@/components/ReviewCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Bookmark } from "lucide-react";
import { motion } from "framer-motion";
import ReadingProgressModal from "@/components/ReadingProgressModal";

// Mock book data
const mockBooks: UserBook[] = [
  {
    id: "1",
    title: "The Midnight Library",
    author: "Matt Haig",
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300",
    description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. While we all wonder how our lives might have been, what if you had the chance to go to the library and see for yourself? Would any of these other lives truly be better? In The Midnight Library, Matt Haig's enchanting blockbuster novel, Nora Seed finds herself faced with this decision.",
    status: "currently-reading",
    progress: 45,
    userRating: 4,
    genres: ["Fiction", "Fantasy", "Self-Help"],
    publishedDate: "2020-08-13",
    publisher: "Canongate Books",
    pageCount: 304,
    isbn: "9781786892720",
  },
  {
    id: "2",
    title: "Atomic Habits",
    author: "James Clear",
    coverImage: "https://images.unsplash.com/photo-1535398089889-dd807df1dfaa?auto=format&fit=crop&q=80&w=300",
    description: "No matter your goals, Atomic Habits offers a proven framework for improving--every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.",
    status: "finished",
    finishDate: "2023-03-15",
    userRating: 5,
    genres: ["Self-Help", "Psychology", "Productivity"],
    publishedDate: "2018-10-16",
    publisher: "Avery",
    pageCount: 320,
    isbn: "9780735211292",
  },
];

// Mock reviews data
const mockReviews: Review[] = [
  {
    id: "101",
    bookId: "1",
    userId: "user1",
    userName: "Jane Reader",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
    rating: 4.5,
    content: "I couldn't put this book down! The concept of a library containing books that represent different possible lives is both fascinating and thought-provoking. Matt Haig's writing is beautiful and the way he explores depression, regret, and hope is incredibly moving. Highly recommended for anyone who's ever wondered 'what if'.",
    datePosted: "2023-05-10T14:30:00Z",
    likes: 24,
    spoiler: false,
    recommended: true,
  },
  {
    id: "102",
    bookId: "1",
    userId: "user2",
    userName: "BookWorm42",
    userAvatar: "",
    rating: 3,
    content: "While the premise is interesting, I found the execution a bit lacking. The characters felt somewhat flat to me, and the resolution was predictable. That said, it's a quick read with an uplifting message about appreciating the life you have.",
    datePosted: "2023-04-22T09:15:00Z",
    likes: 7,
    spoiler: false,
    recommended: false,
  },
];

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<UserBook | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [animateEntry, setAnimateEntry] = useState(true);
  
  useEffect(() => {
    // Simulate loading the book data
    setIsLoading(true);
    setAnimateEntry(true);
    
    setTimeout(() => {
      const foundBook = mockBooks.find(b => b.id === id);
      if (foundBook) {
        setBook(foundBook);
        setNotes(foundBook.notes || "");
        
        // Load reviews for this book
        const bookReviews = mockReviews.filter(r => r.bookId === id);
        setReviews(bookReviews);
      }
      
      setIsLoading(false);
    }, 800);
  }, [id]);
  
  const handleStatusChange = (status: UserBook["status"]) => {
    if (!book) return;
    
    setBook({
      ...book,
      status,
    });
    
    toast({
      title: "Status updated",
      description: `Book moved to "${status.replace('-', ' ')}"`,
    });
  };
  
  const handleRatingChange = (rating: number) => {
    if (!book) return;
    
    setBook({
      ...book,
      userRating: rating,
    });
    
    toast({
      title: "Rating updated",
      description: `You rated this book ${rating} stars`,
    });
  };
  
  const saveNotes = () => {
    if (!book) return;
    
    setBook({
      ...book,
      notes,
    });
    
    toast({
      title: "Notes saved",
      description: "Your notes have been saved",
    });
  };

  const handleUpdateProgress = (bookId: string, progress: number, startDate?: string) => {
    if (!book) return;
    
    setBook({
      ...book,
      progress,
      startDate: startDate || book.startDate,
    });
    
    toast({
      title: "Progress updated",
      description: `Progress updated to ${progress}%`,
    });
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren", 
        staggerChildren: 0.2 
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };
  
  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="bg-card border-b">
            <div className="container mx-auto px-4 py-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0 w-48 h-72 bg-muted rounded"></div>
                <div className="flex-1">
                  <div className="h-10 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-6 bg-muted rounded w-1/2 mb-6"></div>
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/3 mb-6"></div>
                  <div className="h-10 bg-muted rounded w-36 mt-8"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!book) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Book not found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find the book you're looking for.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      variants={containerVariants}
      initial={animateEntry ? "hidden" : "visible"}
      animate="visible"
      exit="exit"
    >
      <BookDetailHeader
        book={book}
        onStatusChange={handleStatusChange}
        onRatingChange={handleRatingChange}
      />
      
      <div className="container mx-auto py-8 px-4">
        {book.status === "currently-reading" && (
          <motion.div 
            variants={childVariants}
            className="mb-8"
          >
            <div className="bg-card border rounded-lg p-6 flex flex-col md:flex-row items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Reading Progress</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 max-w-md">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{book.progress || 0}%</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className="progress-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${book.progress || 0}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      ></motion.div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {book.startDate ? `Started on ${book.startDate}` : "Start date not set"}
                </p>
              </div>
              <Button 
                onClick={() => setProgressModalOpen(true)} 
                variant="outline"
                className="mt-4 md:mt-0 md:ml-4 transition-transform duration-300 hover:scale-105"
              >
                <Edit className="mr-2 h-4 w-4" /> Update Progress
              </Button>
            </div>
          </motion.div>
        )}
        
        <motion.div variants={childVariants}>
          <Tabs defaultValue="details" className="animate-fade-in">
            <TabsList className="mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              <motion.div 
                className="bg-card border rounded-lg p-6"
                variants={childVariants}
                initial="hidden"
                animate="visible"
              >
                <h2 className="font-playfair text-2xl font-semibold mb-4">About this book</h2>
                <p className="text-muted-foreground mb-6">{book.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {book.publishedDate && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Published</h3>
                      <p>{book.publishedDate}</p>
                    </div>
                  )}
                  
                  {book.publisher && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Publisher</h3>
                      <p>{book.publisher}</p>
                    </div>
                  )}
                  
                  {book.pageCount && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Pages</h3>
                      <p>{book.pageCount}</p>
                    </div>
                  )}
                  
                  {book.isbn && (
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">ISBN</h3>
                      <p>{book.isbn}</p>
                    </div>
                  )}
                </div>
              </motion.div>
              
              {book.genres && book.genres.length > 0 && (
                <motion.div 
                  className="bg-card border rounded-lg p-6"
                  variants={childVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <h2 className="font-playfair text-2xl font-semibold mb-4">Genres</h2>
                  <div className="flex flex-wrap gap-2">
                    {book.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-3 py-1.5 bg-secondary/10 rounded-full text-sm text-secondary-foreground transition-all duration-300 hover:bg-secondary/20"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </TabsContent>
            
            <TabsContent value="notes">
              <motion.div 
                className="bg-card border rounded-lg p-6"
                variants={childVariants}
                initial="hidden"
                animate="visible"
              >
                <h2 className="font-playfair text-2xl font-semibold mb-4">Your Notes</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your personal notes, thoughts, and reflections about this book.
                </p>
                
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write your notes here..."
                  className="min-h-[200px] mb-4 transition-all duration-300 focus:border-primary"
                />
                
                <Button 
                  onClick={saveNotes}
                  className="transition-transform duration-300 hover:scale-105"
                >
                  Save Notes
                </Button>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="reviews">
              <motion.div 
                className="space-y-6"
                variants={childVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="bg-card border rounded-lg p-6">
                  <h2 className="font-playfair text-2xl font-semibold mb-4">Reviews</h2>
                  
                  {reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <motion.div 
                          key={review.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                          <ReviewCard review={review} />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No reviews yet</p>
                      <Button className="transition-all duration-300 hover:scale-105">
                        Write the first review
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
      
      <ReadingProgressModal
        book={book}
        open={progressModalOpen}
        onOpenChange={setProgressModalOpen}
        onUpdateProgress={handleUpdateProgress}
      />
    </motion.div>
  );
};

export default BookDetail;
