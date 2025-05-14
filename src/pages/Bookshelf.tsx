
import React, { useState, useEffect } from "react";
import { BookView, BookshelfFilters } from "@/types/book";
import BookCard from "@/components/BookCard";
import BookshelfControls from "@/components/BookshelfControls";
import EmptyState from "@/components/EmptyState";
import { Bookmark, Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AddBookModal from "@/components/AddBookModal";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useUserBooks, 
  useAddUserBook, 
  getViewPreference, 
  saveViewPreference,
  getLastSelectedTab,
  saveLastSelectedTab
} from "@/services/bookService";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ITEMS_PER_PAGE = 16;

const Bookshelf = () => {
  const [view, setView] = useState<BookView>(() => getViewPreference());
  const [filters, setFilters] = useState<BookshelfFilters>({
    status: "all",
    sort: "title",
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Get the default tab from cookies or use "all"
  const [activeTab, setActiveTab] = useState<string>(() => getLastSelectedTab() || "all");

  // Fetch user books with pagination and filters
  const { 
    data: booksData, 
    isLoading, 
    isError, 
    error 
  } = useUserBooks(filters, currentPage, ITEMS_PER_PAGE);

  const addUserBook = useAddUserBook();

  // Save view preference to cookies whenever it changes
  useEffect(() => {
    saveViewPreference(view);
  }, [view]);

  // Save active tab to cookies whenever it changes
  useEffect(() => {
    saveLastSelectedTab(activeTab);
    
    // Update filters when tab changes
    if (activeTab === "all" || activeTab === "currently-reading" || 
        activeTab === "want-to-read" || activeTab === "finished") {
      setFilters(prev => ({ ...prev, status: activeTab }));
    }
    
    // Reset to page 0 when filters change
    setCurrentPage(0);
  }, [activeTab]);

  const handleBookClick = (bookId: string) => {
    // Navigate to the specific book's detail page
    navigate(`/book/${bookId}`);
  };

  const handleAddBook = (book: any) => {
    // If the book has already been added to the database in the modal, don't add it again
    if (book.alreadyAdded) {
      // Just refresh the books list
      queryClient.invalidateQueries({ queryKey: ['userBooks'] });
      return;
    }
    
    const { status = 'want-to-read', progress = 0 } = book;

    addUserBook.mutate({
      bookId: book.id,
      status,
      progress,
      notes: book.notes
    });
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

  // Calculate total pages
  const totalPages = booksData ? Math.ceil(booksData.totalCount / ITEMS_PER_PAGE) : 0;
  
  // Get page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    
    // Show first page
    if (currentPage > 2) {
      pages.push(0);
    }
    
    // Show pages around current page
    for (let i = Math.max(0, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    
    // Show last page
    if (currentPage < totalPages - 3) {
      pages.push(totalPages - 1);
    }
    
    return pages;
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
        <h1 className="text-3xl font-bold mb-6">My Bookshelf</h1>
        <BookshelfControls
          view={view}
          setView={setView}
          filters={filters}
          setFilters={setFilters}
          onFilterChange={() => setCurrentPage(0)}
        />
      </motion.div>
      
      {isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load your books"}
          </AlertDescription>
        </Alert>
      )}
      
      
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
      ) : booksData && booksData.books.length > 0 ? (
        <>
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
              {booksData.books.map((book) => (
                <motion.div 
                  key={book.id}
                  variants={bookVariants}
                  onClick={() => handleBookClick(book.id)}
                  className="cursor-pointer transition-transform duration-300"
                  whileHover={{ y: -5 }}
                >
                  <BookCard book={book} view={view} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                {currentPage > 0 && (
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} 
                      className="cursor-pointer"
                    />
                  </PaginationItem>
                )}
                
                {getPageNumbers().map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index] - array[index - 1] > 1 && (
                      <PaginationItem>
                        <PaginationLink>...</PaginationLink>
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink 
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                        className="cursor-pointer"
                      >
                        {page + 1}
                      </PaginationLink>
                    </PaginationItem>
                  </React.Fragment>
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
