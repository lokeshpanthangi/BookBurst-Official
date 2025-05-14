import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  BookOpen, 
  Clock, 
  Award, 
  BarChart2, 
  PieChart as PieChartIcon,
  Calendar
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Define types for analytics data
interface ReadingStats {
  totalBooks: number;
  totalPages: number;
  averageRating: number;
  booksFinished: number;
  booksInProgress: number;
  booksToRead: number;
  readingTime: number; // in minutes
  favoriteGenres: {name: string; count: number}[];
  readingByMonth: {month: string; count: number}[];
  ratingDistribution: {rating: number; count: number}[];
}

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Analytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    // Get the user ID from the URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const urlUserId = urlParams.get('userId');
    
    // Use the URL user ID if available, otherwise use the logged-in user's ID
    const targetUserId = urlUserId || (user ? user.id : null);
    setUserId(targetUserId);
    
    if (targetUserId) {
      fetchUserAnalytics(targetUserId);
      fetchUserName(targetUserId);
    } else {
      setLoading(false);
      toast({
        title: "Authentication required",
        description: "Please sign in to view analytics",
        variant: "destructive"
      });
      navigate('/login');
    }
  }, [user, navigate, toast]);

  const fetchUserName = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Safely access username with type checking
      if (data && typeof data === 'object') {
        setUserName((data as any).username || "User");
      } else {
        setUserName("User");
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };

  const fetchUserAnalytics = async (userId: string) => {
    setLoading(true);
    try {
      // Fetch all user books
      const { data: userBooks, error: userBooksError } = await supabase
        .from('user_books')
        .select('*, books(*)')
        .eq('user_id', userId);
      
      if (userBooksError) throw userBooksError;
      
      if (!userBooks || userBooks.length === 0) {
        setStats({
          totalBooks: 0,
          totalPages: 0,
          averageRating: 0,
          booksFinished: 0,
          booksInProgress: 0,
          booksToRead: 0,
          readingTime: 0,
          favoriteGenres: [],
          readingByMonth: [],
          ratingDistribution: []
        });
        setLoading(false);
        return;
      }
      
      // Calculate basic statistics
      const totalBooks = userBooks.length;
      const totalPages = userBooks.reduce((sum, book) => sum + (book.books.page_count || 0), 0);
      
      // Count books by status
      const booksFinished = userBooks.filter(book => 
        book.status === 'finished' || book.status === 'completed'
      ).length;
      
      const booksInProgress = userBooks.filter(book => 
        book.status === 'reading' || book.status === 'currently-reading' || book.status === 'currently_reading'
      ).length;
      
      const booksToRead = userBooks.filter(book => 
        book.status === 'to_read' || book.status === 'want-to-read' || book.status === 'want_to_read'
      ).length;
      
      // Calculate average rating
      const ratedBooks = userBooks.filter(book => book.rating && book.rating > 0);
      const averageRating = ratedBooks.length > 0 
        ? ratedBooks.reduce((sum, book) => sum + (book.rating || 0), 0) / ratedBooks.length 
        : 0;
      
      // Estimate reading time (assuming average reading speed of 250 words per minute and 300 words per page)
      const readingTime = userBooks
        .filter(book => book.status === 'finished' || book.status === 'completed')
        .reduce((sum, book) => sum + ((book.books.page_count || 0) * 300 / 250), 0);
      
      // Analyze genres
      const genreCounts: Record<string, number> = {};
      userBooks.forEach(book => {
        // Try to extract genres from the book
        // First check if there's a genres field directly
        let bookGenres: string[] = [];
        
        // Check if the book has a genres field that might be a string or array
        // Use type assertion to safely access potential genres property
        const bookData = book.books as any;
        if (bookData.genres) {
          try {
            const genres = typeof bookData.genres === 'string' 
              ? JSON.parse(bookData.genres) 
              : bookData.genres;
            
            if (Array.isArray(genres)) {
              bookGenres = genres;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        } 
        // If no genres field, try to extract from description or categories
        else if (bookData.description) {
          // Extract common genre keywords from description
          const genreKeywords = ['fiction', 'fantasy', 'sci-fi', 'mystery', 'thriller', 'romance', 'horror', 'biography'];
          const description = bookData.description.toLowerCase();
          
          bookGenres = genreKeywords.filter(genre => description.includes(genre));
        }
        
        // Update genre counts
        bookGenres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      });
      
      const favoriteGenres = Object.entries(genreCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Analyze reading by month
      const monthCounts: Record<string, number> = {};
      userBooks
        .filter(book => book.finish_date)
        .forEach(book => {
          if (book.finish_date) {
            const date = new Date(book.finish_date);
            const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
          }
        });
      
      // Get the last 6 months of data
      const readingByMonth = Object.entries(monthCounts)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => {
          const [aMonth, aYear] = a.month.split(' ');
          const [bMonth, bYear] = b.month.split(' ');
          return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
        })
        .slice(-6);
      
      // Analyze rating distribution
      const ratingCounts = [0, 0, 0, 0, 0, 0]; // Index 0 is not used, 1-5 for ratings
      userBooks.forEach(book => {
        if (book.rating && book.rating > 0 && book.rating <= 5) {
          ratingCounts[Math.floor(book.rating)] += 1;
        }
      });
      
      const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: ratingCounts[rating]
      }));
      
      setStats({
        totalBooks,
        totalPages,
        averageRating,
        booksFinished,
        booksInProgress,
        booksToRead,
        readingTime,
        favoriteGenres,
        readingByMonth,
        ratingDistribution
      });
      
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatReadingTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours % 24} hr${hours % 24 !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${Math.round(minutes % 60)} min${Math.round(minutes % 60) !== 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Loading Analytics...</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">No Data Available</h1>
        <p className="text-muted-foreground mb-6">
          We couldn't find any reading data to analyze.
        </p>
        <Button onClick={() => navigate('/explore')}>
          Explore Books
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{userName}'s Reading Analytics</h1>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-primary" />
              Total Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBooks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPages.toLocaleString()} pages in total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Award className="h-4 w-4 mr-2 text-primary" />
              Books Finished
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.booksFinished}</div>
            <p className="text-xs text-muted-foreground">
              {stats.booksInProgress} in progress, {stats.booksToRead} to read
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-primary" />
              Reading Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatReadingTime(stats.readingTime).split(' ')[0]}</div>
            <p className="text-xs text-muted-foreground">
              {formatReadingTime(stats.readingTime).split(' ').slice(1).join(' ')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Star className="h-4 w-4 mr-2 text-primary" />
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= Math.round(stats.averageRating)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="charts" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="charts" className="flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            <span>Charts</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-1">
            <PieChartIcon className="h-4 w-4" />
            <span>Insights</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reading Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Reading Progress</CardTitle>
                <CardDescription>
                  Distribution of books by reading status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Finished', value: stats.booksFinished },
                        { name: 'In Progress', value: stats.booksInProgress },
                        { name: 'To Read', value: stats.booksToRead }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: 'Finished', value: stats.booksFinished },
                        { name: 'In Progress', value: stats.booksInProgress },
                        { name: 'To Read', value: stats.booksToRead }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Rating Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>
                  How you've rated your books
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.ratingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Books" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Reading by Month Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Reading by Month</CardTitle>
                <CardDescription>
                  Books finished over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.readingByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Books Finished" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Favorite Genres Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Favorite Genres</CardTitle>
                <CardDescription>
                  Most common genres in your library
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={stats.favoriteGenres} 
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Books" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="insights">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Reading Pace
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  {stats.booksFinished > 0 ? (
                    <>
                      You've finished <span className="font-bold">{stats.booksFinished} books</span> so far.
                      {stats.readingByMonth.length > 0 && (
                        <> That's an average of <span className="font-bold">
                          {(stats.booksFinished / stats.readingByMonth.length).toFixed(1)} books per month
                        </span> based on your reading history.</>
                      )}
                    </>
                  ) : (
                    <>You haven't finished any books yet. Start marking books as finished to track your reading pace.</>
                  )}
                </p>
                {stats.booksInProgress > 0 && (
                  <p>
                    You're currently reading <span className="font-bold">{stats.booksInProgress} books</span>.
                    {stats.booksInProgress > 2 && " That's quite a few books at once!"}
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" />
                  Reading Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.favoriteGenres.length > 0 ? (
                  <div>
                    <p className="mb-2">Your top genres are:</p>
                    <ul className="list-disc pl-5 mb-4">
                      {stats.favoriteGenres.slice(0, 3).map((genre, index) => (
                        <li key={index} className="mb-1">
                          <span className="font-medium">{genre.name}</span> ({genre.count} books)
                        </li>
                      ))}
                    </ul>
                    <p>
                      {stats.favoriteGenres[0] && (
                        <>You seem to enjoy <span className="font-medium">{stats.favoriteGenres[0].name}</span> the most.</>
                      )}
                    </p>
                  </div>
                ) : (
                  <p>Add more books with genres to see your reading preferences.</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-primary" />
                  Rating Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.ratingDistribution.some(item => item.count > 0) ? (
                  <>
                    <p className="mb-4">
                      Your average rating is <span className="font-bold">{stats.averageRating.toFixed(1)}</span> stars.
                      {stats.averageRating > 4 ? (
                        " You're quite generous with your ratings!"
                      ) : stats.averageRating < 3 ? (
                        " You appear to be a critical reader."
                      ) : (
                        " You have balanced ratings."
                      )}
                    </p>
                    <p>
                      {stats.ratingDistribution.reduce((max, item) => item.count > max.count ? item : max, {rating: 0, count: 0}).rating > 0 && (
                        <>You give <span className="font-bold">
                          {stats.ratingDistribution.reduce((max, item) => item.count > max.count ? item : max, {rating: 0, count: 0}).rating} stars
                        </span> most frequently.</>
                      )}
                    </p>
                  </>
                ) : (
                  <p>Start rating books to see your rating patterns.</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-primary" />
                  Time Investment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  You've spent approximately <span className="font-bold">{formatReadingTime(stats.readingTime)}</span> reading.
                  {stats.totalPages > 0 && (
                    <> That's about <span className="font-bold">
                      {Math.round(stats.readingTime / stats.totalPages * 60)} minutes
                    </span> per page on average.</>
                  )}
                </p>
                {stats.booksToRead > 0 && (
                  <p>
                    Based on your reading speed, it would take approximately <span className="font-bold">
                      {formatReadingTime(stats.readingTime / stats.booksFinished * stats.booksToRead)}
                    </span> to finish all books in your to-read list.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;

// Helper component for star icon
function Star(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
