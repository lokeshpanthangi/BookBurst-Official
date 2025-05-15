import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  useUserById, 
  useUserAllBooks
} from "@/services/communityService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Star, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { data: user, isLoading: isLoadingUser } = useUserById(userId || "");
  const { data: userBooksData, isLoading: isLoadingBooks } = useUserAllBooks(userId || "");
  
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Filter books based on active tab
  const filteredBooks = userBooksData?.books?.filter(book => {
    if (activeTab === "all") return true;
    if (activeTab === "reading") return book.status === "currently-reading";
    if (activeTab === "want-to-read") return book.status === "want-to-read";
    if (activeTab === "finished") return book.status === "finished";
    return true;
  });



  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8">
        {/* User Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {isLoadingUser ? (
            <>
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
            </>
          ) : (
            <>
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.avatar || ''} alt={user?.username} />
                <AvatarFallback className="text-2xl">{user?.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h1 className="text-3xl font-bold">{user?.username}</h1>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    Joined {formatDistanceToNow(new Date(user?.joinedDate || ""), { addSuffix: true })}
                  </div>
                </div>
                
                <p className="text-sm">
                  {user?.bio || "No bio available"}
                </p>
                
                {user?.readingStats && (
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="bg-card rounded-lg p-3 border">
                      <div className="font-medium">{user.readingStats.booksRead}</div>
                      <div className="text-xs text-muted-foreground">Books Read</div>
                    </div>
                    
                    <div className="bg-card rounded-lg p-3 border">
                      <div className="font-medium">{user.readingStats.booksCurrentlyReading}</div>
                      <div className="text-xs text-muted-foreground">Currently Reading</div>
                    </div>
                    
                    <div className="bg-card rounded-lg p-3 border">
                      <div className="font-medium flex items-center">
                        {user.readingStats.averageRating}
                        <Star className="h-3 w-3 ml-1 fill-primary text-primary" />
                      </div>
                      <div className="text-xs text-muted-foreground">Average Rating</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* User's Bookshelf */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Bookshelf</h2>
            
            {userId !== currentUser?.id && (
              <div className="text-sm text-muted-foreground">
                Showing public books
              </div>
            )}
          </div>
          
          <Tabs 
            defaultValue="all" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="reading">Reading</TabsTrigger>
              <TabsTrigger value="want-to-read">Want to Read</TabsTrigger>
              <TabsTrigger value="finished">Finished</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="space-y-4">
              {isLoadingBooks ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Array(10).fill(0).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-56 w-full rounded-md" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : filteredBooks?.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-1">No books found</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "all" 
                      ? "This user hasn't added any books to their bookshelf yet."
                      : activeTab === "reading"
                      ? "This user isn't currently reading any books."
                      : activeTab === "want-to-read"
                      ? "This user doesn't have any books they want to read."
                      : "This user hasn't finished any books yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {filteredBooks?.map((book) => (
                    <Link 
                      key={book.userBookId} 
                      to={`/book/${book.id}`}
                      className="group"
                    >
                      <Card className="h-full overflow-hidden border group-hover:border-primary transition-colors">
                        <div className="relative pt-[140%]">
                          <img 
                            src={book.coverImage || '/placeholder-book.png'} 
                            alt={book.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          {book.is_private && (
                            <Badge variant="secondary" className="absolute top-2 right-2">
                              Private
                            </Badge>
                          )}
                        </div>
                        
                        <CardContent className="p-3">
                          <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                            {book.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {book.author}
                          </p>
                        </CardContent>
                        
                        <CardFooter className="p-3 pt-0 flex flex-col items-start gap-2">
                          {book.status === 'currently-reading' && (
                            <div className="w-full">
                              <div className="flex justify-between text-xs mb-1">
                                <span>In Progress</span>
                                <span>{book.progress || 0}%</span>
                              </div>
                              <Progress value={book.progress || 0} className="h-1" />
                            </div>
                          )}
                          
                          {book.status === 'finished' && book.userRating && (
                            <div className="flex items-center">
                              <Star className="h-3 w-3 mr-1 fill-primary text-primary" />
                              <span className="text-xs">{book.userRating}</span>
                            </div>
                          )}
                          
                          {book.status === 'want-to-read' && (
                            <Badge variant="outline" className="text-xs bg-background">
                              Want to Read
                            </Badge>
                          )}
                        </CardFooter>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
