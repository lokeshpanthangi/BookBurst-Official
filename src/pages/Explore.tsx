
import { useState, useEffect } from "react";
import { Book } from "@/types/book";
import ExploreCard from "@/components/ExploreCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Mock explore books data
const mockExploreBooks: Book[] = [
  {
    id: "101",
    title: "Tomorrow, and Tomorrow, and Tomorrow",
    author: "Gabrielle Zevin",
    coverImage: "https://images.unsplash.com/photo-1629992101753-56d196c8aabb?auto=format&fit=crop&q=80&w=300",
    description: "A modern classic about two friends who come together as creative partners in the world of video game design.",
    averageRating: 4.3,
    ratingsCount: 7840,
    genres: ["Contemporary Fiction", "Technology"]
  },
  {
    id: "102",
    title: "The Invisible Life of Addie LaRue",
    author: "V.E. Schwab",
    coverImage: "https://images.unsplash.com/photo-1633477189729-9290b3261d0a?auto=format&fit=crop&q=80&w=300",
    description: "A woman makes a Faustian bargain to live forever, but is cursed to be forgotten by everyone she meets.",
    averageRating: 4.5,
    ratingsCount: 15632,
    genres: ["Fantasy", "Historical Fantasy"]
  },
  {
    id: "103",
    title: "Project Hail Mary",
    author: "Andy Weir",
    coverImage: "https://images.unsplash.com/photo-1629992101753-56d196c8aabb?auto=format&fit=crop&q=80&w=300",
    description: "A lone astronaut must save the earth from disaster in this incredible new science-based thriller.",
    averageRating: 4.8,
    ratingsCount: 9254,
    genres: ["Science Fiction", "Space"]
  },
  {
    id: "104",
    title: "Klara and the Sun",
    author: "Kazuo Ishiguro",
    coverImage: "https://images.unsplash.com/photo-1589409514187-c21d14df0d04?auto=format&fit=crop&q=80&w=300",
    description: "From the Nobel Prize winner, a novel that looks at our rapidly changing world through the eyes of an unforgettable narrator.",
    averageRating: 4.1,
    ratingsCount: 6128,
    genres: ["Literary Fiction", "Science Fiction"]
  },
  {
    id: "105",
    title: "A Court of Silver Flames",
    author: "Sarah J. Maas",
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300",
    description: "The latest installment in the Court of Thorns and Roses series.",
    averageRating: 4.6,
    ratingsCount: 12039,
    genres: ["Fantasy", "Romance"]
  },
  {
    id: "106",
    title: "The Four Winds",
    author: "Kristin Hannah",
    coverImage: "https://images.unsplash.com/photo-1535398089889-dd807df1dfaa?auto=format&fit=crop&q=80&w=300",
    description: "A powerful American epic about love and heroism and hope, set during the Great Depression.",
    averageRating: 4.4,
    ratingsCount: 8142,
    genres: ["Historical Fiction", "Fiction"]
  },
  {
    id: "107",
    title: "The Sanatorium",
    author: "Sarah Pearse",
    coverImage: "https://images.unsplash.com/photo-1613922110088-8412b50d5eef?auto=format&fit=crop&q=80&w=300",
    description: "A chilling debut in which a detective must investigate a string of murders in a closed community.",
    averageRating: 3.9,
    ratingsCount: 4527,
    genres: ["Mystery", "Thriller"]
  },
  {
    id: "108",
    title: "The Paris Library",
    author: "Janet Skeslien Charles",
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300",
    description: "Based on the true World War II story of the heroic librarians at the American Library in Paris.",
    averageRating: 4.2,
    ratingsCount: 5815,
    genres: ["Historical Fiction", "World War II"]
  }
];

// More mock data for different tabs
const mockTrending = mockExploreBooks.slice(0, 4);
const mockNewReleases = mockExploreBooks.slice(4, 8);
const mockForYou = mockExploreBooks.filter((_, i) => i % 2 === 0); // Just alternate books for example

const Explore = () => {
  const [trending, setTrending] = useState<Book[]>([]);
  const [newReleases, setNewReleases] = useState<Book[]>([]);
  const [forYou, setForYou] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setTrending(mockTrending);
      setNewReleases(mockNewReleases);
      setForYou(mockForYou);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleAddToShelf = (book: Book) => {
    // In a real app, this would add the book to the user's shelf
    toast({
      title: "Added to your shelf",
      description: `${book.title} has been added to your "Want to Read" shelf.`,
      duration: 3000,
    });
  };
  
  const renderBookGrid = (books: Book[]) => {
    if (isLoading) {
      return (
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
        <p className="text-muted-foreground">
          Discover new books, trending titles, and personalized recommendations.
        </p>
      </div>
      
      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="new-releases">New Releases</TabsTrigger>
          <TabsTrigger value="for-you">For You</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default Explore;
