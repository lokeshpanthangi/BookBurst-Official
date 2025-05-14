
import { useState, useEffect } from "react";
import { User, ReadingGoal } from "@/types/user";
import { UserBook } from "@/types/book";
import StarRating from "@/components/StarRating";
import BookCover from "@/components/BookCover";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, Award, Library, ChevronRight } from "lucide-react";
import { useUserProfile } from "@/services/userService";
import { useReadingGoal } from "@/services/userService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Profile = () => {
  const { user: authUser } = useAuth();
  const { data: profileData, isLoading: isProfileLoading, error: profileError } = useUserProfile();
  const { data: readingGoalData, isLoading: isGoalLoading } = useReadingGoal();
  
  const [currentlyReading, setCurrentlyReading] = useState<UserBook[]>([]);
  const [recentlyFinished, setRecentlyFinished] = useState<UserBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch user's books
  useEffect(() => {
    const fetchUserBooks = async () => {
      if (!authUser) return;
      
      try {
        setIsLoading(true);
        
        // Fetch currently reading books
        const { data: readingBooks, error: readingError } = await supabase
          .from('user_books')
          .select('*, books(*)')
          .eq('user_id', authUser.id)
          .eq('status', 'reading')
          .order('updated_at', { ascending: false })
          .limit(4);
        
        if (readingError) throw readingError;
        
        // Fetch recently finished books
        const { data: finishedBooks, error: finishedError } = await supabase
          .from('user_books')
          .select('*, books(*)')
          .eq('user_id', authUser.id)
          .eq('status', 'completed')
          .order('updated_at', { ascending: false })
          .limit(4);
        
        if (finishedError) throw finishedError;
        
        // Format the books data
        const formattedReadingBooks = readingBooks?.map(item => ({
          id: item.books.id,
          title: item.books.title,
          author: item.books.author,
          coverImage: item.books.cover_image || '',
          description: item.books.description || '',
          status: 'currently-reading' as const, // Cast to the expected enum type
          progress: item.progress || 0,
          userRating: item.rating,
          userBookId: item.id
        })) || [];
        
        const formattedFinishedBooks = finishedBooks?.map(item => ({
          id: item.books.id,
          title: item.books.title,
          author: item.books.author,
          coverImage: item.books.cover_image || '',
          description: item.books.description || '',
          status: 'finished' as const, // Cast to the expected enum type
          finishDate: item.finish_date,
          userRating: item.rating,
          userBookId: item.id
        })) || [];
        
        setCurrentlyReading(formattedReadingBooks);
        setRecentlyFinished(formattedFinishedBooks);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching user books:', err);
        setError(err.message || 'Failed to load your books');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserBooks();
  }, [authUser]);
  
  if (isProfileLoading || isGoalLoading || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-32 h-32 bg-muted rounded-full"></div>
            <div className="flex-1">
              <div className="h-8 bg-muted rounded w-48 mb-2"></div>
              <div className="h-4 bg-muted rounded w-32 mb-4"></div>
              <div className="h-20 bg-muted rounded w-full"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-40 bg-muted rounded"></div>
            <div className="h-40 bg-muted rounded"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
          
          <div className="h-80 bg-muted rounded"></div>
          <div className="h-80 bg-muted rounded"></div>
        </div>
      </div>
    );
  }
  
  if (profileError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {profileError instanceof Error ? profileError.message : "Failed to load profile"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't load the profile information.
          </p>
        </div>
      </div>
    );
  }
  
  const goalProgress = readingGoalData ? Math.min(100, (readingGoalData.current || 0) / (readingGoalData.target || 1) * 100) : 0;
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* User Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-muted border">
          {profileData.avatar ? (
            <img src={profileData.avatar} alt={profileData.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground">
              {profileData.name.charAt(0)}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h1 className="text-3xl font-playfair font-bold mb-1">{profileData.name}</h1>
          <p className="text-muted-foreground mb-4">@{profileData.username}</p>
          
          {profileData.bio && <p className="mb-4">{profileData.bio}</p>}
          
          <div className="flex flex-wrap gap-2 mb-4">
            {profileData.preferences?.favoriteGenres?.map((genre) => (
              <span 
                key={genre}
                className="px-2 py-1 bg-primary/10 rounded-full text-xs text-primary"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Reading Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border rounded-lg p-5 md:p-6 flex flex-col">
          <div className="flex items-center mb-2">
            <BookOpen className="h-5 w-5 text-primary mr-2" />
            <h3 className="font-semibold">Books Read</h3>
          </div>
          <span className="text-3xl font-playfair">{profileData.readingStats?.booksRead || 0}</span>
          <span className="text-sm text-muted-foreground mt-1">Total books</span>
        </div>
        
        <div className="bg-card border rounded-lg p-5 md:p-6 flex flex-col">
          <div className="flex items-center mb-2">
            <Calendar className="h-5 w-5 text-secondary mr-2" />
            <h3 className="font-semibold">Reading Goal</h3>
          </div>
          {readingGoalData ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-playfair">{readingGoalData.current || 0}/{readingGoalData.target || 0}</span>
                <span>{goalProgress.toFixed()}%</span>
              </div>
              <Progress value={goalProgress} className="mt-2" />
              <span className="text-sm text-muted-foreground mt-2">Books in {readingGoalData.year}</span>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-playfair">0/0</span>
                <span>0%</span>
              </div>
              <Progress value={0} className="mt-2" />
              <span className="text-sm text-muted-foreground mt-2">No reading goal set</span>
            </>
          )}
        </div>
        
        <div className="bg-card border rounded-lg p-5 md:p-6 flex flex-col">
          <div className="flex items-center mb-2">
            <Award className="h-5 w-5 text-accent mr-2" />
            <h3 className="font-semibold">Average Rating</h3>
          </div>
          <div className="flex items-center">
            <span className="text-3xl font-playfair mr-2">{profileData.readingStats?.averageRating || 0}</span>
            <StarRating rating={profileData.readingStats?.averageRating || 0} readOnly size="sm" />
          </div>
          <span className="text-sm text-muted-foreground mt-2">Based on rated books</span>
        </div>
      </div>
      
      {/* Currently Reading */}
      <div className="bg-card border rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-playfair font-semibold">Currently Reading</h2>
          <Button variant="link" size="sm" className="p-0" asChild>
            <Link to="/bookshelf" className="flex items-center">
              <span className="mr-1">View all</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {currentlyReading.map((book) => (
            <Link to={`/book/${book.id}`} key={book.id} className="group">
              <div className="relative">
                <BookCover src={book.coverImage} alt={book.title} />
                {book.progress && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex justify-between text-xs text-white mb-1">
                      <span>Progress</span>
                      <span>{book.progress}%</span>
                    </div>
                    <div className="progress-bar bg-white/30">
                      <div 
                        className="progress-bar-fill bg-white" 
                        style={{ width: `${book.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              <h3 className="font-medium mt-2 group-hover:text-primary transition-colors">
                {book.title}
              </h3>
              <p className="text-sm text-muted-foreground">{book.author}</p>
            </Link>
          ))}
          
          {currentlyReading.length === 0 && (
            <div className="col-span-full text-center py-8">
              <Library className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Not currently reading any books</p>
              <Button variant="link" asChild>
                <Link to="/explore">Find books to read</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Recently Finished */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-playfair font-semibold">Recently Finished</h2>
          <Button variant="link" size="sm" className="p-0" asChild>
            <Link to="/bookshelf" className="flex items-center">
              <span className="mr-1">View all</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recentlyFinished.map((book) => (
            <Link to={`/book/${book.id}`} key={book.id} className="group">
              <BookCover src={book.coverImage} alt={book.title} />
              <h3 className="font-medium mt-2 group-hover:text-primary transition-colors">
                {book.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-1">{book.author}</p>
              <StarRating rating={book.userRating || 0} size="sm" readOnly interactive={false} />
            </Link>
          ))}
          
          {recentlyFinished.length === 0 && (
            <div className="col-span-full text-center py-8">
              <Library className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No finished books yet</p>
              <Button variant="link" asChild>
                <Link to="/bookshelf">Update your bookshelf</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
