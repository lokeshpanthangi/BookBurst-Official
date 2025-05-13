
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navigationItems = [
    { path: "/bookshelf", icon: <Bookmark className="mr-2 h-4 w-4" />, label: "Bookshelf" },
    { path: "/explore", icon: <Compass className="mr-2 h-4 w-4" />, label: "Explore" },
    { path: "/timeline", icon: <Clock className="mr-2 h-4 w-4" />, label: "Timeline" },
    { path: "/profile", icon: <User className="mr-2 h-4 w-4" />, label: "Profile" },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
          <Button variant="ghost" size="sm" asChild>
            <Link to="/search">
              <Search className="h-4 w-4" />
              <span className="ml-2">Search</span>
            </Link>
          </Button>
          
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
            <Button variant="ghost" size="sm" asChild className="justify-start">
              <Link to="/search" onClick={() => setIsMenuOpen(false)}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Link>
            </Button>
            
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
            
            <div className="mt-2 flex justify-between items-center py-2 border-t">
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
