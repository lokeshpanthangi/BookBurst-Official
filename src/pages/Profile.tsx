
import { useState, useEffect } from "react";
import { User } from "@/types/user";
import { UserBook } from "@/types/book";
import StarRating from "@/components/StarRating";
import BookCover from "@/components/BookCover";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Award, Library, BookMarked, BookOpenCheck, BookPlus } from "lucide-react";
import { useUserProfile } from "@/services/userService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const { user: authUser } = useAuth();
  const { data: profileData, isLoading: isProfileLoading, error: profileError } = useUserProfile();
  
  const [books, setBooks] = useState<UserBook[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch user's books
  useEffect(() => {
    const fetchUserBooks = async () => {
      if (!authUser) return;
      
      try {
        setIsLoading(true);
        
        // Fetch all user books
        const { data: userBooks, error: userBooksError } = await supabase
          .from('user_books')
          .select('*, books(*)')
          .eq('user_id', authUser.id)
          .order('updated_at', { ascending: false });
        
        if (userBooksError) throw userBooksError;
        
        // Format the books data
        const formattedBooks = userBooks?.map(item => {
          let status: 'currently-reading' | 'want-to-read' | 'finished';
          
          // Map database status values to our enum types
          switch (item.status) {
            case 'reading':
              status = 'currently-reading';
              break;
            case 'to_read':
            case 'to read':
            case 'want_to_read':
              status = 'want-to-read';
              break;
            case 'completed':
            case 'finished':
              status = 'finished';
              break;
            default:
              status = 'want-to-read';
          }
          
          return {
            id: item.books.id,
            title: item.books.title,
            author: item.books.author,
            coverImage: item.books.cover_image || '',
            description: item.books.description || '',
            status,
            progress: item.progress || 0,
            finishDate: item.finish_date,
            userRating: item.rating,
            userBookId: item.id
          };
        }) || [];
        
        setBooks(formattedBooks);
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
  
  if (isProfileLoading || isLoading) {
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-40 bg-muted rounded"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
          
          <div className="h-12 bg-muted rounded w-full"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
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

  // Filter books based on active tab
  const filteredBooks = books.filter(book => {
    if (activeTab === 'all') return true;
    if (activeTab === 'currently-reading') return book.status === 'currently-reading';
    if (activeTab === 'want-to-read') return book.status === 'want-to-read';
    if (activeTab === 'finished') return book.status === 'finished';
    return true;
  });
  
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
      
      {/* My Bookshelf */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-playfair font-semibold">My Bookshelf</h2>
        </div>
        
        <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <BookMarked className="h-4 w-4" />
              <span>All</span>
            </TabsTrigger>
            <TabsTrigger value="currently-reading" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>Reading</span>
            </TabsTrigger>
            <TabsTrigger value="want-to-read" className="flex items-center gap-1">
              <BookPlus className="h-4 w-4" />
              <span>Want to Read</span>
            </TabsTrigger>
            <TabsTrigger value="finished" className="flex items-center gap-1">
              <BookOpenCheck className="h-4 w-4" />
              <span>Finished</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredBooks.map((book) => (
                <Link to={`/book/${book.id}`} key={book.id} className="group">
                  <div className="relative">
                    <BookCover src={book.coverImage} alt={book.title} />
                    {book.status === 'currently-reading' && book.progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex justify-between text-xs text-white mb-1">
                          <span>{book.progress}%</span>
                        </div>
                        <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${book.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {book.status === 'finished' && (
                      <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                        ✓
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium mt-2 group-hover:text-primary transition-colors truncate">
                    {book.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                  {book.userRating > 0 && (
                    <StarRating rating={book.userRating} size="sm" readOnly interactive={false} />
                  )}
                </Link>
              ))}
              
              {filteredBooks.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <Library className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No books found</p>
                  <Button variant="link" asChild>
                    <Link to="/explore">Find books to read</Link>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="currently-reading" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredBooks.map((book) => (
                <Link to={`/book/${book.id}`} key={book.id} className="group">
                  <div className="relative">
                    <BookCover src={book.coverImage} alt={book.title} />
                    {book.progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex justify-between text-xs text-white mb-1">
                          <span>{book.progress}%</span>
                        </div>
                        <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${book.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium mt-2 group-hover:text-primary transition-colors truncate">
                    {book.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                </Link>
              ))}
              
              {filteredBooks.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">You're not currently reading any books</p>
                  <Button variant="link" asChild>
                    <Link to="/explore">Find books to read</Link>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="want-to-read" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredBooks.map((book) => (
                <Link to={`/book/${book.id}`} key={book.id} className="group">
                  <BookCover src={book.coverImage} alt={book.title} />
                  <h3 className="font-medium mt-2 group-hover:text-primary transition-colors truncate">
                    {book.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                </Link>
              ))}
              
              {filteredBooks.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <BookPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No books in your want-to-read list</p>
                  <Button variant="link" asChild>
                    <Link to="/explore">Find books to read</Link>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="finished" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredBooks.map((book) => (
                <Link to={`/book/${book.id}`} key={book.id} className="group">
                  <div className="relative">
                    <BookCover src={book.coverImage} alt={book.title} />
                    <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                      ✓
                    </div>
                  </div>
                  <h3 className="font-medium mt-2 group-hover:text-primary transition-colors truncate">
                    {book.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1 truncate">{book.author}</p>
                  {book.userRating > 0 && (
                    <StarRating rating={book.userRating} size="sm" readOnly interactive={false} />
                  )}
                </Link>
              ))}
              
              {filteredBooks.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <BookOpenCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">You haven't finished any books yet</p>
                  <Button variant="link" asChild>
                    <Link to="/bookshelf">Update your bookshelf</Link>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
