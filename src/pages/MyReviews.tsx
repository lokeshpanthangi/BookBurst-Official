import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Star, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MyReviews = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUserReviews = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      setLoading(true);
      setError(false);
      
      try {
        console.log('Fetching reviews for user:', user.id);
        
        const { data, error } = await supabase
          .from('reviews')
          .select('*, books(*)')
          .eq('user_id', user.id)
          .order('date_posted', { ascending: false });
        
        if (error) {
          console.error('Error fetching reviews:', error);
          setError(true);
          toast({
            title: 'Error',
            description: 'Failed to load your reviews',
            variant: 'destructive'
          });
          return;
        }
        
        console.log('Found reviews:', data?.length || 0);
        setReviews(data || []);
      } catch (error) {
        console.error('Error in fetchUserReviews:', error);
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
    
    fetchUserReviews();
  }, [user, toast, navigate]);

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
      
      <h1 className="text-3xl font-bold mb-6">My Reviews</h1>
      
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Error Loading Reviews</h2>
          <p className="text-muted-foreground mt-2">There was an error loading your reviews. Please try again.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go to Home
          </Button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 border rounded-md bg-muted/20">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-2 text-xl font-medium">No Reviews Yet</h2>
          <p className="text-muted-foreground">You haven't written any reviews yet.</p>
          <Button onClick={() => navigate('/explore')} className="mt-4">
            Explore Books to Review
          </Button>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-6"
        >
          {reviews.map(review => (
            <div key={review.id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.date_posted).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={16}
                      className={star <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}
                    />
                  ))}
                </div>
              </div>
              
              <div className="mt-4 flex items-start gap-4">
                <div 
                  className="flex-shrink-0 w-16 h-24 bg-cover bg-center rounded"
                  style={{ 
                    backgroundImage: `url(${review.books?.cover_image || 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=300'})` 
                  }}
                />
                <div>
                  <h3 className="font-medium">{review.books?.title}</h3>
                  <p className="text-sm text-muted-foreground">by {review.books?.author}</p>
                  <p className="mt-2 text-sm">{review.content}</p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto mt-1 text-sm"
                    onClick={() => navigate(`/book/${review.book_id}`)}
                  >
                    View Book
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default MyReviews;
