import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const UserBookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(false);
      
      try {
        console.log('Fetching book with ID:', id);
        
        // Fetch the book directly from the database
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .single();
        
        if (bookError) {
          console.error('Error fetching book:', bookError);
          setError(true);
          toast({
            title: 'Error',
            description: 'Failed to load book details',
            variant: 'destructive'
          });
          return;
        }
        
        if (!bookData) {
          console.error('Book not found');
          setError(true);
          toast({
            title: 'Book not found',
            description: 'The requested book could not be found',
            variant: 'destructive'
          });
          return;
        }
        
        console.log('Book data:', bookData);
        setBook(bookData);
      } catch (error) {
        console.error('Error in fetchBookDetails:', error);
        setError(true);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookDetails();
  }, [id, toast]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
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
      ) : error ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Error Loading Book</h2>
          <p className="text-muted-foreground mt-2">There was an error loading the book details. Please try again.</p>
          <Button onClick={() => navigate('/bookshelf')} className="mt-4">
            Go to My Bookshelf
          </Button>
        </div>
      ) : book ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <img 
                src={book.cover_image || 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=300'} 
                alt={book.title} 
                className="w-[150px] h-[225px] object-cover rounded-md shadow-md" 
              />
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{book.title}</h1>
              <p className="text-muted-foreground mb-4">By {book.author}</p>
              
              {book.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-medium mb-2">Description</h2>
                  <p className="text-muted-foreground">{book.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {book.publisher && (
                  <div>
                    <h3 className="text-sm font-medium">Publisher</h3>
                    <p className="text-muted-foreground">{book.publisher}</p>
                  </div>
                )}
                
                {book.published_date && (
                  <div>
                    <h3 className="text-sm font-medium">Published Date</h3>
                    <p className="text-muted-foreground">{book.published_date}</p>
                  </div>
                )}
                
                {book.page_count && (
                  <div>
                    <h3 className="text-sm font-medium">Pages</h3>
                    <p className="text-muted-foreground">{book.page_count}</p>
                  </div>
                )}
                
                {book.language && (
                  <div>
                    <h3 className="text-sm font-medium">Language</h3>
                    <p className="text-muted-foreground">{book.language}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Book not found</h2>
          <p className="text-muted-foreground mt-2">The book you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/bookshelf')} className="mt-4">
            Go to My Bookshelf
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserBookDetail;
