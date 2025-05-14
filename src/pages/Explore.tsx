
import { useState, useEffect } from "react";
import { Book } from "@/types/book";
import ExploreCard from "@/components/ExploreCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { fetchTrendingBooks, fetchNewReleases, fetchRecommendedBooks } from "@/services/googleBooksService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { searchBooks } from "@/services/googleBooksService";
import { useAddUserBook } from "@/services/bookService";

const Explore = () => {
  const [trending, setTrending] = useState<Book[]>([]);
  const [newReleases, setNewReleases] = useState<Book[]>([]);
  const [forYou, setForYou] = useState<Book[]>([]);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("trending");
  const { toast } = useToast();
  const addUserBook = useAddUserBook();
  
  useEffect(() => {
    const loadBooks = async () => {
      setIsLoading(true);
      try {
        const [trendingData, newReleasesData, forYouData] = await Promise.all([
          fetchTrendingBooks(),
          fetchNewReleases(),
          fetchRecommendedBooks()
        ]);
        
        setTrending(trendingData);
        setNewReleases(newReleasesData);
        setForYou(forYouData);
      } catch (error) {
        console.error("Error loading books:", error);
        toast({
          title: "Failed to load books",
          description: "There was an error loading the book data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBooks();
  }, [toast]);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setActiveTab("search");
    
    try {
      const results = await searchBooks(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching books:", error);
      toast({
        title: "Search failed",
        description: "There was an error searching for books. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleAddToShelf = (book: Book) => {
    addUserBook.mutate({
      bookId: book.id,
      status: "want-to-read"
    }, {
      onSuccess: () => {
        toast({
          title: "Added to your shelf",
          description: `${book.title} has been added to your "Want to Read" shelf.`,
          duration: 3000,
        });
      },
      onError: (error) => {
        toast({
          title: "Failed to add book",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };
  
  const renderBookGrid = (books: Book[]) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="book-card animate-pulse">
              <div className="book-card-image bg-muted h-[300px]"></div>
              <div className="p-3">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (books.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No books found</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <ExploreCard 
            key={book.id} 
            book={book} 
            onAddToShelf={() => handleAddToShelf(book)}
          />
        ))}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-playfair font-bold mb-2">Explore Books</h1>
        <p className="text-muted-foreground mb-6">
          Discover new books, trending titles, and personalized recommendations.
        </p>
        
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search by title, author, or genre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-md"
          />
          <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="new-releases">New Releases</TabsTrigger>
          <TabsTrigger value="for-you">For You</TabsTrigger>
          {searchResults.length > 0 && (
            <TabsTrigger value="search">Search Results</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="trending">
          <div className="mb-6">
            <h2 className="text-2xl font-playfair font-semibold mb-2">Trending This Week</h2>
            <p className="text-muted-foreground">
              Books that are popular with readers right now.
            </p>
          </div>
          {renderBookGrid(trending)}
        </TabsContent>
        
        <TabsContent value="new-releases">
          <div className="mb-6">
            <h2 className="text-2xl font-playfair font-semibold mb-2">New Releases</h2>
            <p className="text-muted-foreground">
              The latest books that have just hit the shelves.
            </p>
          </div>
          {renderBookGrid(newReleases)}
        </TabsContent>
        
        <TabsContent value="for-you">
          <div className="mb-6">
            <h2 className="text-2xl font-playfair font-semibold mb-2">Recommended For You</h2>
            <p className="text-muted-foreground">
              Personalized recommendations based on your reading history.
            </p>
          </div>
          {renderBookGrid(forYou)}
        </TabsContent>
        
        {searchResults.length > 0 && (
          <TabsContent value="search">
            <div className="mb-6">
              <h2 className="text-2xl font-playfair font-semibold mb-2">Search Results</h2>
              <p className="text-muted-foreground">
                Found {searchResults.length} results for "{searchQuery}"
              </p>
            </div>
            {isSearching ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              renderBookGrid(searchResults)
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Explore;
