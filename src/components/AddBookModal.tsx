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
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  
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
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a title or author to search",
        variant: "destructive"
      });
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Simulated API call to Google Books - in production, replace with actual API call
      // Example: const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}`);
      
      // For now, simulating search results after delay
      setTimeout(() => {
        const mockResults: Book[] = [
          {
            id: `search-${Date.now()}-1`,
            title: `${searchQuery} - The Novel`,
            author: "Famous Author",
            coverImage: "https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=300",
            description: "A fascinating book about many things related to your search.",
            genres: ["Fiction", "Adventure"],
            publishedDate: "2023",
            publisher: "Great Books Inc.",
            pageCount: 320,
            isbn: "9781234567897",
          },
          {
            id: `search-${Date.now()}-2`,
            title: `The ${searchQuery} Chronicles`,
            author: "Another Writer",
            coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300",
            description: "An epic tale spanning generations.",
            genres: ["Fantasy", "Science Fiction"],
            publishedDate: "2022",
            publisher: "Fantasy Press",
            pageCount: 450,
            isbn: "9781234567890",
          },
        ];
        
        setSearchResults(mockResults);
        setIsSearching(false);
      }, 1000);
    } catch (error) {
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
    
    try {
      // In a real app, you would save this to your database
      const book: Book = {
        id: `book-${Date.now()}`,
        title: newBook.title!,
        author: newBook.author!,
        coverImage: newBook.coverImage || "https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=300",
        description: newBook.description || "",
        genres: selectedGenres,
        publishedDate: newBook.publishedDate,
        publisher: newBook.publisher,
        pageCount: newBook.pageCount || 0,
        isbn: newBook.isbn,
        averageRating: 0,
        ratingsCount: 0,
      };
      
      // Add book to user's shelf (want-to-read by default)
      onAddBook(book);
      
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
      });
      setSelectedGenres([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error adding book",
        description: "Failed to add book. Please try again.",
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
          <div className="space-y-4 animate-fade-in">
            <div className="flex gap-2">
              <Input
                placeholder="Search by title, author, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={searchBooks} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            
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
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                      <div className="flex gap-1 mt-2">
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
            disabled={isSubmitting || (!newBook.title && !newBook.author)}
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
