
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-32 h-40 shadow-lg rounded-md transform -rotate-12 bg-accent/5 border"></div>
            <div className="absolute -top-3 -left-3 w-32 h-40 shadow-lg rounded-md transform rotate-6 bg-secondary/5 border"></div>
            <div className="relative w-32 h-40 shadow-xl rounded-md bg-card border transform rotate-0 flex items-center justify-center">
              <span className="font-playfair text-4xl text-primary font-bold">404</span>
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl font-playfair font-bold mb-4">Page Not Found</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Oops! It seems this page is missing from our library.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/explore">
              <BookOpen className="mr-2 h-4 w-4" />
              Explore Books
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
