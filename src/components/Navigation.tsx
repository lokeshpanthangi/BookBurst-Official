
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Search,
  Bookmark,
  Compass,
  User,
  Menu,
  X,
  BookOpen,
  Clock,
  LogOut,
  Settings,
  MessageSquare,
  Users,
} from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Define navigation items based on authentication status
  const authenticatedNavItems = [
    { path: "/bookshelf", icon: <Bookmark className="mr-2 h-4 w-4" />, label: "Bookshelf", requiresAuth: true },
    { path: "/explore", icon: <Compass className="mr-2 h-4 w-4" />, label: "Explore", requiresAuth: false },
    { path: "/community", icon: <Users className="mr-2 h-4 w-4" />, label: "Community", requiresAuth: false },
    { path: "/timeline", icon: <Clock className="mr-2 h-4 w-4" />, label: "Timeline", requiresAuth: true },
  ];
  
  // Filter navigation items based on authentication status
  const navigationItems = authenticatedNavItems.filter(item => 
    !item.requiresAuth || (item.requiresAuth && user)
  );

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-card shadow-sm sticky top-0 z-50 border-b">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link 
          to="/" 
          className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
        >
          <BookOpen className="h-6 w-6" />
          <span className="font-playfair text-xl font-bold tracking-tight">BookBurst</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {/* Only show navigation items */}
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "default" : "ghost"}
              size="sm"
              asChild
              className={cn(
                "transition-all",
                isActive(item.path) ? "bg-primary text-primary-foreground" : ""
              )}
            >
              <Link to={item.path}>
                {item.icon}
                {item.label}
              </Link>
            </Button>
          ))}
          
          <ThemeSwitcher />
          
          {/* Show login/signup buttons if user is not logged in */}
          {!user ? (
            <div className="flex items-center space-x-2 ml-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth?mode=login">
                  Login
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth?mode=signup">
                  Sign Up
                </Link>
              </Button>
            </div>
          ) : (
            /* Profile Dropdown for logged in users */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url || ''} />
                    <AvatarFallback>{user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer w-full">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-reviews" className="cursor-pointer w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    My Reviews
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMenu}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-card border-t animate-fade-in">
          <div className="container mx-auto py-2 px-4 flex flex-col">
            {/* Only show filtered navigation items */}
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "default" : "ghost"}
                size="sm"
                asChild
                className={cn(
                  "justify-start mt-1",
                  isActive(item.path) ? "bg-primary text-primary-foreground" : ""
                )}
              >
                <Link to={item.path} onClick={() => setIsMenuOpen(false)}>
                  {item.icon}
                  {item.label}
                </Link>
              </Button>
            ))}
            
            {/* Show login/signup buttons if user is not logged in */}
            {!user ? (
              <div className="mt-4 pt-4 border-t flex flex-col gap-2">
                <Button variant="outline" size="sm" asChild className="justify-start">
                  <Link to="/auth?mode=login" onClick={() => setIsMenuOpen(false)}>
                    Login
                  </Link>
                </Button>
                <Button size="sm" asChild className="justify-start">
                  <Link to="/auth?mode=signup" onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </Link>
                </Button>
              </div>
            ) : (
              /* Mobile Profile Options for logged in users */
              <>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center mb-2">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={user.user_metadata?.avatar_url || ''} />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-medium">{user.email}</div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="justify-start mt-1"
                >
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="justify-start mt-1"
                >
                  <Link to="/settings" onClick={() => setIsMenuOpen(false)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start mt-1 text-destructive hover:text-destructive"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            )}
            
            <div className="mt-4 flex justify-between items-center py-2 border-t">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
