
import { useState } from "react";
import { Book } from "@/types/book";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Search, BookPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";

interface AddBookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBook: (book: Book) => void;
}

const GENRE_OPTIONS = [
  "Fiction", "Fantasy", "Science Fiction", "Mystery", "Thriller", 
  "Romance", "Historical Fiction", "Non-Fiction", "Biography", 
  "Self-Help", "Horror", "Adventure", "Classics", "Young Adult",
  "Philosophy", "Psychology", "Poetry", "Drama", "Humor",
];

const AddBookModal = ({ open, onOpenChange, onAddBook }: AddBookModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'manual' | 'search'>('manual');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: "",
    author: "",
    coverImage: "https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=300",
    description: "",
    genres: [],
    publishedDate: "",
    publisher: "",
    pageCount: 0,
    isbn: "",
    language: "en",
  });
  
  const [status, setStatus] = useState<'want-to-read' | 'currently-reading' | 'finished'>('want-to-read');
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [addError, setAddError] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewBook({
      ...newBook,
      [name]: name === "pageCount" ? parseInt(value) || 0 : value,
    });
  };
  
  const handleGenreChange = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      if (selectedGenres.length < 5) {
        setSelectedGenres([...selectedGenres, genre]);
      } else {
        toast({
          title: "Maximum genres reached",
          description: "You can only select up to 5 genres",
          variant: "destructive"
        });
      }
    }
    
    setNewBook({
      ...newBook,
      genres: selectedGenres,
    });
  };
  
  const searchBooks = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      // Use Google Books API instead of OpenLibrary
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=10&key=AIzaSyBbS-GTBq4Mji-l6u-VOm8JsBj9j7trdIw`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Map the Google Books data to our Book format
      const books = data.items ? data.items.map((item: any) => {
        const volumeInfo = item.volumeInfo;
        
        return {
          id: item.id,
          title: volumeInfo.title || 'Unknown Title',
          author: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author',
          coverImage: volumeInfo.imageLinks?.thumbnail || 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=300',
          description: volumeInfo.description || 'No description available',
          publishedDate: volumeInfo.publishedDate || '',
          publisher: volumeInfo.publisher || '',
          pageCount: volumeInfo.pageCount || 0,
          isbn: volumeInfo.industryIdentifiers?.[0]?.identifier || '',
          language: volumeInfo.language || '',
          genres: volumeInfo.categories || [],
          averageRating: volumeInfo.averageRating || 0,
          ratingsCount: volumeInfo.ratingsCount || 0
        };
      }) : [];
      
      setSearchResults(books);
      setIsSearching(false);
    } catch (error) {
      console.error('Error searching books:', error);
      toast({
        title: "Error searching books",
        description: "Failed to search for books. Please try again.",
        variant: "destructive"
      });
      setIsSearching(false);
    }
  };
  
  const selectSearchResult = (book: Book) => {
    setNewBook({
      ...book,
      id: undefined, // Remove the temporary ID since we'll generate a new one on save
    });
    setSelectedGenres(book.genres || []);
    setStep('manual'); // Switch back to manual form with pre-filled data
  };
  
  const handleAddBook = async () => {
    if (!newBook.title || !newBook.author) {
      toast({
        title: "Missing information",
        description: "Title and author are required",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    setAddError(null);
    
    try {
      // Get the current user's ID first (we'll need it for checking duplicates)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to add a book to your collection');
      }

      // First, check if a book with the same title and author already exists
      const { data: existingBooks } = await supabase
        .from('books')
        .select('id')
        .eq('title', newBook.title)
        .eq('author', newBook.author);
      
      let bookId;
      
      if (existingBooks && existingBooks.length > 0) {
        // Book already exists, check if user already has this book
        const { data: existingUserBook } = await supabase
          .from('user_books')
          .select('id')
          .eq('book_id', existingBooks[0].id)
          .eq('user_id', user.id);
        
        if (existingUserBook && existingUserBook.length > 0) {
          throw new Error(`You already have "${newBook.title}" in your collection`);
        }
        
        // Use existing book ID
        bookId = existingBooks[0].id;
      } else {
        // Book doesn't exist, create it
        // Step 1: Add the book to the books table
        const bookData = {
          title: newBook.title,
          author: newBook.author,
          cover_image: newBook.coverImage || "https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=300",
          description: newBook.description || "",
          published_date: newBook.publishedDate || null,
          publisher: newBook.publisher || null,
          page_count: newBook.pageCount || null,
          isbn: newBook.isbn || null,
          language: newBook.language || 'en',
          average_rating: 0,
          ratings_count: 0
        };
        
        // Insert the book into the books table
        const { data: bookResult, error: bookError } = await supabase
          .from('books')
          .insert(bookData)
          .select()
          .single();
        
        if (bookError) {
          console.error('Error adding book:', bookError);
          throw new Error(`Failed to add book: ${bookError.message}`);
        }
        
        if (!bookResult) {
          throw new Error('Failed to add book: No data returned');
        }
        
        bookId = bookResult.id;
      }
      
      // Now we have a valid bookId to use
      
      // Step 2: Add genres to the book_genres table if any are selected
      if (selectedGenres.length > 0) {
        // First, get or create genre IDs
        for (const genreName of selectedGenres) {
          // Check if genre exists
          const { data: existingGenre } = await supabase
            .from('genres')
            .select('id')
            .eq('name', genreName)
            .single();
          
          let genreId;
          
          if (existingGenre) {
            genreId = existingGenre.id;
          } else {
            // Create new genre
            const { data: newGenre, error: genreError } = await supabase
              .from('genres')
              .insert({ name: genreName })
              .select()
              .single();
              
            if (genreError) {
              console.error(`Error creating genre ${genreName}:`, genreError);
              continue; // Skip this genre but continue with others
            }
            
            genreId = newGenre?.id;
          }
          
          if (genreId) {
            // Check if this book-genre relationship already exists
            const { data: existingBookGenre } = await supabase
              .from('book_genres')
              .select('id')
              .eq('book_id', bookId)
              .eq('genre_id', genreId);
              
            if (!existingBookGenre || existingBookGenre.length === 0) {
              // Link book to genre only if it doesn't already exist
              await supabase
                .from('book_genres')
                .insert({
                  book_id: bookId,
                  genre_id: genreId
                });
            }
          }
        }
      }
      
      // Step 3: Add book to user's collection with the selected status
      const { data: userBookData, error: userBookError } = await supabase
        .from('user_books')
        .insert({
          user_id: user.id, // Add the user_id field to satisfy RLS policy
          book_id: bookId,
          status: status,
          progress: status === 'currently-reading' ? readingProgress : 0,
          start_date: status === 'currently-reading' || status === 'finished' ? new Date().toISOString() : null,
          finish_date: status === 'finished' ? new Date().toISOString() : null
        })
        .select()
        .single();
      
      if (userBookError) {
        console.error('Error adding user book:', userBookError);
        throw new Error(`Failed to add book to your collection: ${userBookError.message}`);
      }
      
      // Fetch the complete book details for UI display
      const { data: bookDetails, error: bookDetailsError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();
        
      if (bookDetailsError || !bookDetails) {
        console.error('Error fetching book details:', bookDetailsError);
        throw new Error(`Failed to fetch book details: ${bookDetailsError?.message || 'No data returned'}`);
      }
      
      // Map the database book to our Book type for the UI
      const book: Book = {
        id: bookDetails.id,
        title: bookDetails.title,
        author: bookDetails.author,
        coverImage: bookDetails.cover_image,
        description: bookDetails.description,
        publishedDate: bookDetails.published_date,
        publisher: bookDetails.publisher,
        pageCount: bookDetails.page_count,
        isbn: bookDetails.isbn,
        language: bookDetails.language,
        genres: selectedGenres,
        averageRating: bookDetails.average_rating || 0,
        ratingsCount: bookDetails.ratings_count || 0
      };
      
      // Only notify parent component with the book data, but don't trigger another add operation
      // Pass a flag to indicate the book has already been added to the database
      onAddBook({...book, alreadyAdded: true});
      
      toast({
        title: "Book added",
        description: `${book.title} has been added to your shelf`,
      });
      
      // Reset form
      setNewBook({
        title: "",
        author: "",
        coverImage: "https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=300",
        description: "",
        genres: [],
        publishedDate: "",
        publisher: "",
        pageCount: 0,
        isbn: "",
        language: "en"
      });
      setSelectedGenres([]);
      setStatus('want-to-read');
      setReadingProgress(0);
      onOpenChange(false);
    } catch (error: any) {
      setAddError(error.message);
      toast({
        title: "Error adding book",
        description: error.message || "Failed to add book. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BookPlus className="h-6 w-6" /> Add a New Book
          </DialogTitle>
          <DialogDescription>
            Add a book to your bookshelf by searching or entering details manually.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-2 mb-4">
          <Button 
            variant={step === 'manual' ? "default" : "outline"} 
            onClick={() => setStep('manual')}
            className="flex-1 transition-all duration-300"
          >
            Manual Entry
          </Button>
          <Button 
            variant={step === 'search' ? "default" : "outline"} 
            onClick={() => setStep('search')}
            className="flex-1 transition-all duration-300"
          >
            Search
          </Button>
        </div>
        
        {step === 'search' ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search for books by title or author"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchBooks()}
              />
              <Button type="button" onClick={searchBooks} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="search-status" className="text-right">
                Reading Status
              </Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as 'want-to-read' | 'currently-reading' | 'finished')}
              >
                <SelectTrigger id="search-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want-to-read">Want to Read</SelectItem>
                  <SelectItem value="currently-reading">Currently Reading</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {status === 'currently-reading' && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="search-readingProgress" className="text-right">
                    Reading Progress
                  </Label>
                  <span className="text-sm text-muted-foreground">{readingProgress}%</span>
                </div>
                <Slider
                  id="search-readingProgress"
                  min={0}
                  max={100}
                  step={1}
                  value={[readingProgress]}
                  onValueChange={(values) => setReadingProgress(values[0])}
                />
              </div>
            )}
            
            {isSearching ? (
              <div className="py-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">Searching for books...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((book) => (
                  <div 
                    key={book.id} 
                    className="flex gap-4 p-3 border rounded-md cursor-pointer hover:bg-accent/10 transition-all duration-200"
                    onClick={() => selectSearchResult(book)}
                  >
                    <div className="w-16 h-24 overflow-hidden rounded-sm flex-shrink-0">
                      <img 
                        src={book.coverImage} 
                        alt={book.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback for image loading errors
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=300";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                      {book.publishedDate && (
                        <p className="text-xs text-muted-foreground">Published: {book.publishedDate}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {book.genres?.slice(0, 2).map((genre) => (
                          <span 
                            key={genre} 
                            className="px-2 py-0.5 text-xs rounded-full bg-secondary/20 text-secondary-foreground"
                          >
                            {genre}
                          </span>
                        ))}
                        {(book.genres?.length || 0) > 2 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-muted">
                            +{(book.genres?.length || 0) - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {searchResults.length === 0 && !isSearching && searchQuery && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No books found matching your search.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setStep('manual')}
                    >
                      Add Manually
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 py-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-right">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={newBook.title}
                  onChange={handleInputChange}
                  placeholder="Book title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="author" className="text-right">
                  Author <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="author"
                  name="author"
                  value={newBook.author}
                  onChange={handleInputChange}
                  placeholder="Author name"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={newBook.description}
                onChange={handleInputChange}
                placeholder="Book description"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status" className="text-right">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={status} 
                onValueChange={(value: 'want-to-read' | 'currently-reading' | 'finished') => setStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want-to-read">Want to Read</SelectItem>
                  <SelectItem value="currently-reading">Currently Reading</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === 'currently-reading' && (
              <div className="space-y-2">
                <Label className="text-right flex justify-between">
                  <span>Reading Progress</span>
                  <span>{readingProgress}%</span>
                </Label>
                <Slider 
                  value={[readingProgress]} 
                  onValueChange={(values) => setReadingProgress(values[0])} 
                  max={100} 
                  step={1}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-right">
                Genres (Select up to 5)
              </Label>
              <div className="flex flex-wrap gap-2">
                {GENRE_OPTIONS.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => handleGenreChange(genre)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${
                      selectedGenres.includes(genre)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary/10 text-secondary-foreground hover:bg-secondary/20"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publishedDate" className="text-right">
                  Publication Date
                </Label>
                <Input
                  id="publishedDate"
                  name="publishedDate"
                  value={newBook.publishedDate}
                  onChange={handleInputChange}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="publisher" className="text-right">
                  Publisher
                </Label>
                <Input
                  id="publisher"
                  name="publisher"
                  value={newBook.publisher}
                  onChange={handleInputChange}
                  placeholder="Publisher name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pageCount" className="text-right">
                  Page Count
                </Label>
                <Input
                  id="pageCount"
                  name="pageCount"
                  type="number"
                  value={newBook.pageCount || ""}
                  onChange={handleInputChange}
                  placeholder="Number of pages"
                  min={1}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="isbn" className="text-right">
                  ISBN
                </Label>
                <Input
                  id="isbn"
                  name="isbn"
                  value={newBook.isbn}
                  onChange={handleInputChange}
                  placeholder="ISBN number"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="coverImage" className="text-right">
                Cover Image URL
              </Label>
              <Input
                id="coverImage"
                name="coverImage"
                value={newBook.coverImage}
                onChange={handleInputChange}
                placeholder="URL to cover image"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status" className="text-right">
                Reading Status
              </Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as 'want-to-read' | 'currently-reading' | 'finished')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want-to-read">Want to Read</SelectItem>
                  <SelectItem value="currently-reading">Currently Reading</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {status === 'currently-reading' && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="readingProgress" className="text-right">
                    Reading Progress
                  </Label>
                  <span className="text-sm text-muted-foreground">{readingProgress}%</span>
                </div>
                <Slider
                  id="readingProgress"
                  min={0}
                  max={100}
                  step={1}
                  value={[readingProgress]}
                  onValueChange={(values) => setReadingProgress(values[0])}
                />
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleAddBook} 
            disabled={isSubmitting || !newBook.title || !newBook.author}
            className="relative overflow-hidden"
          >
            {isSubmitting && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            <span className={isSubmitting ? "opacity-0" : "opacity-100"}>
              Add Book
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookModal;
