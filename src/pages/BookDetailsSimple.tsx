import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bookmark, MessageSquare } from "lucide-react";
import { UserBook } from "@/types/book";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/StarRating";
import { cn } from "@/lib/utils";

// Mock book data for testing
const mockBooks = [
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

const BookDetailsSimple = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<UserBook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with 500ms delay
    setLoading(true);
    setTimeout(() => {
      // For OpenLibrary books (IDs starting with "OL")
      if (id && id.startsWith('OL')) {
        const openLibraryBook: UserBook = {
          id,
          title: `OpenLibrary Book (ID: ${id})`,
          author: "OpenLibrary Author",
          coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300",
          description: "This is a book from OpenLibrary. In a real implementation, we would fetch the actual details from the OpenLibrary API.",
          status: "want-to-read",
          genres: ["Fiction", "Literature"],
          publishedDate: "2023",
          publisher: "OpenLibrary Publishers",
          pageCount: 300,
        };
        setBook(openLibraryBook);
      } else {
        // Look for the book in our mock data
        const foundBook = mockBooks.find(b => b.id === id);
        if (foundBook) {
          const typedBook: UserBook = {
            ...foundBook,
            status: foundBook.status as "want-to-read" | "currently-reading" | "finished"
          };
          setBook(typedBook);
        }
      }
      setLoading(false);
    }, 500);
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

  if (!book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center text-primary hover:underline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Link>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Book Not Found</h2>
          <p className="text-muted-foreground mb-6">We couldn't find the book you're looking for.</p>
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center text-primary hover:underline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Book Cover */}
        <div className="flex-shrink-0">
          <img 
            src={book.coverImage} 
            alt={book.title} 
            className="w-48 h-auto rounded-md shadow-md"
          />
          
          {/* Action Buttons */}
          <div className="mt-4 space-y-2">
            {/* Add to Bookshelf Button */}
            <Button 
              className="w-full flex items-center justify-center gap-2" 
              onClick={() => alert('Add to Bookshelf functionality will be implemented')}
            >
              <Bookmark size={16} />
              Add to Bookshelf
            </Button>
            
            {/* Review Button */}
            <Button 
              className="w-full flex items-center justify-center gap-2"
              variant="outline"
              onClick={() => alert('Write Review functionality will be implemented')}
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
            {book.userRating && (
              <div className="flex items-center">
                <StarRating rating={book.userRating} readOnly size="md" interactive={false} />
                <span className="ml-2 text-sm">{book.userRating.toFixed(1)}</span>
              </div>
            )}
            
            {book.status && (
              <Badge 
                className={cn(
                  book.status === 'currently-reading' && 'bg-blue-100 text-blue-800',
                  book.status === 'want-to-read' && 'bg-yellow-100 text-yellow-800',
                  book.status === 'finished' && 'bg-green-100 text-green-800'
                )}
              >
                {book.status.replace('-', ' ')}
              </Badge>
            )}
          </div>

          {book.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground">{book.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {book.publishedDate && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Published</h3>
                <p>{book.publishedDate}</p>
              </div>
            )}

            {book.publisher && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Publisher</h3>
                <p>{book.publisher}</p>
              </div>
            )}

            {book.pageCount && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Pages</h3>
                <p>{book.pageCount}</p>
              </div>
            )}

            {book.isbn && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">ISBN</h3>
                <p>{book.isbn}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Genres */}
      {book.genres && book.genres.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Genres</h2>
          <div className="flex flex-wrap gap-2">
            {book.genres.map(genre => (
              <Badge key={genre} variant="secondary">{genre}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Reading Progress */}
      {book.status === 'currently-reading' && book.progress && (
        <div className="mb-8 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Reading Progress</h2>
          <div className="w-full bg-secondary/20 rounded-full h-2.5 mb-2">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${book.progress}%` }}
            ></div>
          </div>
          <p className="text-right text-sm text-muted-foreground">{book.progress}% complete</p>
        </div>
      )}

      <div className="flex justify-center mt-8">
        <Button asChild className="mr-4">
          <Link to="/">Back to Books</Link>
        </Button>
      </div>
    </div>
  );
};

export default BookDetailsSimple;
