import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAllUsers } from "@/services/communityService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, UserCheck, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Community = () => {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, error } = useAllUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Filter users based on search query
  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (user.bio && user.bio.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Community</h1>
          <p className="text-muted-foreground">
            Discover readers, follow their bookshelves, and connect with the BookBurst community
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name or bio..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>All Users</span>
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span>Following</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-9 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-destructive">Error loading users. Please try again.</p>
              </div>
            ) : filteredUsers?.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No users found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "Be the first to join the community!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers?.map(user => (
                  <Card key={user.id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar || ''} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{user.username}</CardTitle>
                        <CardDescription>
                          Joined {new Date(user.joinedDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm line-clamp-3">
                        {user.bio || "No bio available"}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => navigate(`/community/${user.id}`)}
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>View Bookshelf</span>
                      </Button>
                      {currentUser && currentUser.id !== user.id && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/community/${user.id}`)}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Follow
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-4">
            {!currentUser ? (
              <div className="p-8 text-center border rounded-lg">
                <h3 className="text-lg font-medium mb-2">Sign in to see who you're following</h3>
                <Button asChild>
                  <Link to="/auth?mode=login">Sign In</Link>
                </Button>
              </div>
            ) : (
              <div className="p-8 text-center">
                <UserCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Coming Soon</h3>
                <p className="text-muted-foreground">
                  The following tab will be available soon. For now, you can follow users from their profile page.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;
