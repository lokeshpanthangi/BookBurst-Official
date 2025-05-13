
import { useState, useEffect } from "react";
import { UserBook, BookView, BookshelfFilters, Book } from "@/types/book";
import BookCard from "@/components/BookCard";
import BookshelfControls from "@/components/BookshelfControls";
import EmptyState from "@/components/EmptyState";
import { Bookmark, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AddBookModal from "@/components/AddBookModal";
import { motion, AnimatePresence } from "framer-motion";

// Mock book data
const mockBooks: UserBook[] = [
  {
    id: "1",
    title: "The Midnight Library",
    author: "Matt Haig",
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300",
    description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
    status: "currently-reading",
    progress: 45,
    userRating: 4,
    genres: ["Fiction", "Fantasy", "Self-Help"]
  },
  {
    id: "2",
    title: "Atomic Habits",
    author: "James Clear",
    coverImage: "https://images.unsplash.com/photo-1535398089889-dd807df1dfaa?auto=format&fit=crop&q=80&w=300",
    description: "No matter your goals, Atomic Habits offers a proven framework for improving--every day.",
    status: "finished",
    finishDate: "2023-03-15",
    userRating: 5,
    genres: ["Self-Help", "Psychology", "Productivity"]
  },
  {
    id: "3",
    title: "Dune",
    author: "Frank Herbert",
    coverImage: "https://images.unsplash.com/photo-1589409514187-c21d14df0d04?auto=format&fit=crop&q=80&w=300",
    description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world.",
    status: "want-to-read",
    genres: ["Science Fiction", "Fantasy", "Classic"]
  },
  {
    id: "4",
    title: "Project Hail Mary",
    author: "Andy Weir",
    coverImage: "https://images.unsplash.com/photo-1629992101753-56d196c8aabb?auto=format&fit=crop&q=80&w=300",
    description: "Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the Earth itself will perish.",
    status: "currently-reading",
    progress: 78,
    userRating: 4.5,
    genres: ["Science Fiction", "Adventure", "Space"]
  },
  {
    id: "5",
    title: "The Song of Achilles",
    author: "Madeline Miller",
    coverImage: "https://images.unsplash.com/photo-1633477189729-9290b3261d0a?auto=format&fit=crop&q=80&w=300",
    description: "A tale of gods, kings, immortal fame, and the human heart, The Song of Achilles is a dazzling literary feat.",
    status: "want-to-read",
    genres: ["Historical Fiction", "Fantasy", "LGBT"]
  },
  {
    id: "6",
    title: "The Alchemist",
    author: "Paulo Coelho",
    coverImage: "https://images.unsplash.com/photo-1613922110088-8412b50d5eef?auto=format&fit=crop&q=80&w=300",
    description: "The Alchemist follows the journey of an Andalusian shepherd boy named Santiago.",
    status: "finished",
    finishDate: "2022-08-10",
    userRating: 4,
    genres: ["Fiction", "Philosophy", "Fantasy"]
  },
];

const Bookshelf = () => {
  const [books, setBooks] = useState<UserBook[]>(mockBooks);
  const [view, setView] = useState<BookView>(() => {
    // Try to get the view preference from localStorage
    const savedView = localStorage.getItem("bookshelf-view");
    return (savedView as BookView) || "grid";
  });
  
  const [filters, setFilters] = useState<BookshelfFilters>({
    status: "all",
    sort: "title",
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    // Save view preference to localStorage
    localStorage.setItem("bookshelf-view", view);
    
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [view]);
  
  // Filter books based on current filters
  const filteredBooks = books.filter(book => {
    // Filter by status
    if (filters.status && filters.status !== "all") {
      if (book.status !== filters.status) return false;
    }
    
    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesTitle = book.title.toLowerCase().includes(searchTerm);
      const matchesAuthor = book.author.toLowerCase().includes(searchTerm);
      if (!matchesTitle && !matchesAuthor) return false;
    }
    
    // Filter by genre
    if (filters.genre && filters.genre.length > 0) {
      if (!book.genres) return false;
      const hasMatchingGenre = book.genres.some(genre => 
        filters.genre?.includes(genre)
      );
      if (!hasMatchingGenre) return false;
    }
    
    return true;
  });
  
  // Sort books based on current sort option
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (filters.sort) {
      case "title":
        return a.title.localeCompare(b.title);
      case "author":
        return a.author.localeCompare(b.author);
      case "rating":
        const ratingA = a.userRating || 0;
        const ratingB = b.userRating || 0;
        return ratingB - ratingA; // Highest first
      // Additional sort options would be implemented here
      default:
        return a.title.localeCompare(b.title);
    }
  });

  const handleAddBook = (book: Book) => {
    // Convert Book to UserBook
    const newUserBook: UserBook = {
      ...book,
      status: "want-to-read", // Default status
    };
    
    // Add to books array
    setBooks([...books, newUserBook]);
  };
  
  const handleBookClick = (bookId: string) => {
    navigate(`/book/${bookId}`);
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const bookVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-playfair font-bold"
        >
          My Bookshelf
        </motion.h1>
        <Button 
          onClick={() => setAddBookModalOpen(true)}
          className="transition-all duration-300 hover:scale-105"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Book
        </Button>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <BookshelfControls
          view={view}
          setView={setView}
          filters={filters}
          setFilters={setFilters}
        />
      </motion.div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="book-card animate-pulse">
              <div className="book-card-image bg-muted"></div>
              <div className="p-3">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedBooks.length > 0 ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={
            view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              : "flex flex-col gap-4"
          }
        >
          <AnimatePresence>
            {sortedBooks.map((book) => (
              <motion.div 
                key={book.id}
                variants={bookVariants}
                onClick={() => handleBookClick(book.id)}
                className="cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                whileHover={{ y: -5 }}
              >
                <BookCard book={book} view={view} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState
          icon={<Bookmark className="h-8 w-8 text-muted-foreground" />}
          title="Your bookshelf is empty"
          description="Start adding books to your bookshelf to keep track of your reading journey."
          action={{
            label: "Add your first book",
            onClick: () => setAddBookModalOpen(true),
          }}
          className="my-12"
        />
      )}
      
      <AddBookModal
        open={addBookModalOpen}
        onOpenChange={setAddBookModalOpen}
        onAddBook={handleAddBook}
      />
    </div>
  );
};

export default Bookshelf;
