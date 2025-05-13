
import { useState, useEffect } from "react";
import { User, ReadingGoal } from "@/types/user";
import { UserBook } from "@/types/book";
import StarRating from "@/components/StarRating";
import BookCover from "@/components/BookCover";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, Award, Library, ChevronRight } from "lucide-react";

// Mock user data
const mockUser: User = {
  id: "user1",
  name: "Alex Johnson",
  username: "alexreader",
  email: "alex@example.com",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300",
  bio: "Avid reader with a passion for science fiction, fantasy, and historical non-fiction. I read to explore new worlds and ideas.",
  joinedDate: "2022-01-15",
  readingStats: {
    booksRead: 24,
    pagesRead: 7856,
    booksCurrentlyReading: 2,
    averageRating: 4.2
  },
  preferences: {
    favoriteGenres: ["Science Fiction", "Fantasy", "Non-fiction", "Biography"],
    theme: "light"
  }
};

// Mock reading goal
const mockReadingGoal: ReadingGoal = {
  year: 2023,
  target: 30,
  current: 24
};

// Mock currently reading books
const mockCurrentlyReading: UserBook[] = [
  {
    id: "1",
    title: "The Midnight Library",
    author: "Matt Haig",
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300",
    description: "Between life and death there is a library, and within that library, the shelves go on forever.",
    status: "currently-reading",
    progress: 45,
    userRating: 4,
    genres: ["Fiction", "Fantasy", "Self-Help"]
  },
  {
    id: "4",
    title: "Project Hail Mary",
    author: "Andy Weir",
    coverImage: "https://images.unsplash.com/photo-1629992101753-56d196c8aabb?auto=format&fit=crop&q=80&w=300",
    description: "Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the Earth itself will perish.",
    status: "currently-reading",
    progress: 78,
    userRating: 4.5,
    genres: ["Science Fiction", "Adventure", "Space"]
  }
];

// Mock recently finished books
const mockRecentlyFinished: UserBook[] = [
  {
    id: "2",
    title: "Atomic Habits",
    author: "James Clear",
    coverImage: "https://images.unsplash.com/photo-1535398089889-dd807df1dfaa?auto=format&fit=crop&q=80&w=300",
    description: "No matter your goals, Atomic Habits offers a proven framework for improving--every day.",
    status: "finished",
    finishDate: "2023-03-15",
    userRating: 5,
    genres: ["Self-Help", "Psychology", "Productivity"]
  },
  {
    id: "6",
    title: "The Alchemist",
    author: "Paulo Coelho",
    coverImage: "https://images.unsplash.com/photo-1613922110088-8412b50d5eef?auto=format&fit=crop&q=80&w=300",
    description: "The Alchemist follows the journey of an Andalusian shepherd boy named Santiago.",
    status: "finished",
    finishDate: "2022-08-10",
    userRating: 4,
    genres: ["Fiction", "Philosophy", "Fantasy"]
  }
];

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [readingGoal, setReadingGoal] = useState<ReadingGoal | null>(null);
  const [currentlyReading, setCurrentlyReading] = useState<UserBook[]>([]);
  const [recentlyFinished, setRecentlyFinished] = useState<UserBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setUser(mockUser);
      setReadingGoal(mockReadingGoal);
      setCurrentlyReading(mockCurrentlyReading);
      setRecentlyFinished(mockRecentlyFinished);
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-32 h-32 bg-muted rounded-full"></div>
            <div className="flex-1">
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/4 mb-6"></div>
              <div className="h-20 bg-muted rounded w-full"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border rounded-lg p-6 h-24"></div>
            <div className="bg-card border rounded-lg p-6 h-24"></div>
            <div className="bg-card border rounded-lg p-6 h-24"></div>
          </div>
          
          <div className="bg-card border rounded-lg p-6">
            <div className="h-6 bg-muted rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-48 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!user || !readingGoal) {
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
  
  const goalProgress = Math.min(100, (readingGoal.current / readingGoal.target) * 100);
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* User Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-muted border">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground">
              {user.name.charAt(0)}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h1 className="text-3xl font-playfair font-bold mb-1">{user.name}</h1>
          <p className="text-muted-foreground mb-4">@{user.username}</p>
          
          {user.bio && <p className="mb-4">{user.bio}</p>}
          
          <div className="flex flex-wrap gap-2 mb-4">
            {user.preferences?.favoriteGenres.map((genre) => (
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
          <span className="text-3xl font-playfair">{user.readingStats?.booksRead}</span>
          <span className="text-sm text-muted-foreground mt-1">Total books</span>
        </div>
        
        <div className="bg-card border rounded-lg p-5 md:p-6 flex flex-col">
          <div className="flex items-center mb-2">
            <Calendar className="h-5 w-5 text-secondary mr-2" />
            <h3 className="font-semibold">Reading Goal</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-playfair">{readingGoal.current}/{readingGoal.target}</span>
            <span>{goalProgress.toFixed()}%</span>
          </div>
          <Progress value={goalProgress} className="mt-2" />
          <span className="text-sm text-muted-foreground mt-2">Books in {readingGoal.year}</span>
        </div>
        
        <div className="bg-card border rounded-lg p-5 md:p-6 flex flex-col">
          <div className="flex items-center mb-2">
            <Award className="h-5 w-5 text-accent mr-2" />
            <h3 className="font-semibold">Average Rating</h3>
          </div>
          <div className="flex items-center">
            <span className="text-3xl font-playfair mr-2">{user.readingStats?.averageRating}</span>
            <StarRating rating={user.readingStats?.averageRating || 0} readOnly size="sm" />
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
