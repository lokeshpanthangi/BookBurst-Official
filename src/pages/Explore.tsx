
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ExploreCard from "@/components/ExploreCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  Loader2, 
  BookOpenText,
  AlertCircle
} from "lucide-react";
import { Book } from "@/types/book";
import { motion } from "framer-motion";
import { useAddUserBook } from "@/services/bookService";
import { useToast } from "@/hooks/use-toast";
import { 
  useQuery, 
  useQueryClient 
} from "@tanstack/react-query";
import * as googleBooksService from "@/services/googleBooksService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const ITEMS_PER_PAGE = 20;

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("trending");
  const [searchPage, setSearchPage] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const addUserBook = useAddUserBook();

  // Fetch trending, new releases, and recommended books
  const trendingQuery = useQuery({
    queryKey: ['trending-books'],
    queryFn: () => googleBooksService.fetchTrendingBooks(),
  });

  const newReleasesQuery = useQuery({
    queryKey: ['new-releases'],
    queryFn: () => googleBooksService.fetchNewReleases(),
  });

  const recommendedQuery = useQuery({
    queryKey: ['recommended-books'],
    queryFn: () => googleBooksService.fetchRecommendedBooks(),
  });

  // Search books with pagination
  const searchBooksQuery = useQuery({
    queryKey: ['search-books', searchQuery, searchPage],
    queryFn: () => googleBooksService.searchBooks(searchQuery, searchPage, ITEMS_PER_PAGE),
    enabled: searchQuery.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab("search");
      setSearchPage(0);
      queryClient.invalidateQueries({ queryKey: ['search-books'] });
    }
  };

  const handleAddToShelf = (book: Book) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add books to your shelf",
        variant: "destructive",
      });
      return;
    }

    addUserBook.mutate({
      bookId: book.id,
      status: "want-to-read"
    }, {
      onSuccess: () => {
        toast({
          title: "Book added",
          description: `"${book.title}" has been added to your shelf`,
        });
      }
    });
  };

  // For pagination
  const totalPages = searchBooksQuery.data?.totalItems 
    ? Math.ceil(searchBooksQuery.data.totalItems / ITEMS_PER_PAGE) 
    : 0;

  const getPageNumbers = () => {
    if (totalPages <= 1) return [];
    
    const pages = [];
    
    // Show first page
    if (searchPage > 2) {
      pages.push(0);
    }
    
    // Show pages around current page
    const start = Math.max(0, searchPage - 1);
    const end = Math.min(Math.min(totalPages - 1, 10), searchPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Show last page if we're not close to it already
    if (searchPage < totalPages - 3 && totalPages > 5) {
      pages.push(Math.min(totalPages - 1, 10));
    }
    
    return pages;
  };

  // Display error message if any API call fails
  const renderErrorAlert = (error: unknown) => (
    <Alert variant="destructive" className="my-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error instanceof Error
          ? error.message
          : "An error occurred while fetching books. Please try again later."}
      </AlertDescription>
    </Alert>
  );

  // Loading state for book sections
  const renderLoadingState = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="book-card animate-pulse">
          <div className="h-64 bg-muted rounded"></div>
          <div className="p-3">
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-playfair font-bold mb-8"
      >
        Explore Books
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <Input
            placeholder="Search for books, authors, ISBNs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={searchQuery.length === 0}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>

        {!user && (
          <Alert className="mb-6">
            <BookOpenText className="h-4 w-4" />
            <AlertTitle>Sign in to save books</AlertTitle>
            <AlertDescription>
              <Link to="/auth" className="underline font-medium">
                Sign in or create an account
              </Link>{" "}
              to add books to your personal bookshelf.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="trending">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="new">
              <Calendar className="h-4 w-4 mr-2" />
              New Releases
            </TabsTrigger>
            <TabsTrigger value="recommended">
              <Sparkles className="h-4 w-4 mr-2" />
              Recommended
            </TabsTrigger>
            {searchBooksQuery.data && (
              <TabsTrigger value="search">
                <Search className="h-4 w-4 mr-2" />
                Search Results
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="trending">
            <h2 className="text-2xl font-medium mb-4">Trending Books</h2>
            {trendingQuery.isLoading ? (
              renderLoadingState()
            ) : trendingQuery.isError ? (
              renderErrorAlert(trendingQuery.error)
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {trendingQuery.data.map((book) => (
                  <ExploreCard
                    key={book.id}
                    book={book}
                    onAddToShelf={() => handleAddToShelf(book)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="new">
            <h2 className="text-2xl font-medium mb-4">New Releases</h2>
            {newReleasesQuery.isLoading ? (
              renderLoadingState()
            ) : newReleasesQuery.isError ? (
              renderErrorAlert(newReleasesQuery.error)
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {newReleasesQuery.data.map((book) => (
                  <ExploreCard
                    key={book.id}
                    book={book}
                    onAddToShelf={() => handleAddToShelf(book)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommended">
            <h2 className="text-2xl font-medium mb-4">Recommended For You</h2>
            {recommendedQuery.isLoading ? (
              renderLoadingState()
            ) : recommendedQuery.isError ? (
              renderErrorAlert(recommendedQuery.error)
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {recommendedQuery.data.map((book) => (
                  <ExploreCard
                    key={book.id}
                    book={book}
                    onAddToShelf={() => handleAddToShelf(book)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="search">
            <h2 className="text-2xl font-medium mb-4">
              Search Results for "{searchQuery}"
            </h2>
            {searchBooksQuery.isLoading ? (
              renderLoadingState()
            ) : searchBooksQuery.isError ? (
              renderErrorAlert(searchBooksQuery.error)
            ) : searchBooksQuery.data?.books.length ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                  {searchBooksQuery.data.books.map((book) => (
                    <ExploreCard
                      key={book.id}
                      book={book}
                      onAddToShelf={() => handleAddToShelf(book)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      {searchPage > 0 && (
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setSearchPage((p) => Math.max(0, p - 1))}
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
                              isActive={page === searchPage}
                              onClick={() => setSearchPage(page)}
                              className="cursor-pointer"
                            >
                              {page + 1}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      ))}

                      {searchPage < Math.min(totalPages - 1, 10) && (
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setSearchPage((p) => Math.min(Math.min(totalPages - 1, 10), p + 1))
                            }
                            className="cursor-pointer"
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No results found for "{searchQuery}". Try a different search term.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      <Separator className="my-12" />

      <div className="grid md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xl font-medium mb-3">Search by Genre</h3>
          <div className="flex flex-wrap gap-2">
            {["Fantasy", "Mystery", "Romance", "Sci-Fi", "Biography", "History", "Poetry", "Self-Help"].map(
              (genre) => (
                <Button
                  key={genre}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery(genre);
                    setActiveTab("search");
                    setSearchPage(0);
                    queryClient.invalidateQueries({ queryKey: ['search-books'] });
                  }}
                >
                  {genre}
                </Button>
              )
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-medium mb-3">Popular Authors</h3>
          <div className="flex flex-wrap gap-2">
            {["Stephen King", "J.K. Rowling", "James Patterson", "George R.R. Martin"].map(
              (author) => (
                <Button
                  key={author}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery(`author:${author}`);
                    setActiveTab("search");
                    setSearchPage(0);
                    queryClient.invalidateQueries({ queryKey: ['search-books'] });
                  }}
                >
                  {author}
                </Button>
              )
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-medium mb-3">Quick Links</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("bestsellers");
                setActiveTab("search");
                setSearchPage(0);
                queryClient.invalidateQueries({ queryKey: ['search-books'] });
              }}
            >
              Bestsellers
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("award winning");
                setActiveTab("search");
                setSearchPage(0);
                queryClient.invalidateQueries({ queryKey: ['search-books'] });
              }}
            >
              Award Winners
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const currentYear = new Date().getFullYear();
                setSearchQuery(`published:${currentYear}`);
                setActiveTab("search");
                setSearchPage(0);
                queryClient.invalidateQueries({ queryKey: ['search-books'] });
              }}
            >
              This Year's Releases
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
