
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Bookmark, Compass, Clock, ArrowRight } from "lucide-react";

const Index = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-card py-20 px-6 md:px-12 relative overflow-hidden border-b">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/10"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        ></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div
              className={`max-w-xl transition-all duration-1000 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Discover, Track, and Share Your Reading Journey
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                BookBurst is your personal bookshelf in the cloud. Track what you're reading, discover new books, and connect with a community of readers.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link to="/bookshelf">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Start Your Bookshelf
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/explore">
                    <Compass className="mr-2 h-5 w-5" />
                    Explore Books
                  </Link>
                </Button>
              </div>
            </div>
            <div
              className={`hidden md:block transition-all duration-1000 delay-300 ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-8"
              }`}
            >
              <div className="relative">
                <div className="absolute top-6 -left-6 w-60 h-72 shadow-lg rounded-md transform -rotate-6 bg-accent/5 border"></div>
                <div className="absolute top-3 -left-3 w-60 h-72 shadow-lg rounded-md transform rotate-3 bg-secondary/5 border"></div>
                <div className="relative w-60 h-72 shadow-xl rounded-md bg-card border transform rotate-0">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-primary/40" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 md:px-12">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-playfair text-3xl font-bold text-center mb-12">
            Your Reading Journey Starts Here
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bookmark className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-playfair text-xl font-semibold mb-3">
                Track Your Reading
              </h3>
              <p className="text-muted-foreground mb-4">
                Organize your books by reading status - Currently Reading, Want to Read, or Finished - and keep your digital bookshelf always at hand.
              </p>
              <Button variant="link" asChild className="p-0">
                <Link to="/bookshelf" className="flex items-center">
                  <span>View your bookshelf</span>
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <Compass className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="font-playfair text-xl font-semibold mb-3">
                Discover New Books
              </h3>
              <p className="text-muted-foreground mb-4">
                Explore trending books, new releases, and personalized recommendations based on your reading history and preferences.
              </p>
              <Button variant="link" asChild className="p-0">
                <Link to="/explore" className="flex items-center">
                  <span>Explore books</span>
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-playfair text-xl font-semibold mb-3">
                Visualize Your Progress
              </h3>
              <p className="text-muted-foreground mb-4">
                See your reading journey on a beautiful timeline, track your progress, and celebrate your reading milestones.
              </p>
              <Button variant="link" asChild className="p-0">
                <Link to="/timeline" className="flex items-center">
                  <span>View your timeline</span>
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 md:px-12 bg-gradient-to-br from-primary/10 to-secondary/10 border-t">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="font-playfair text-3xl font-bold mb-6">
            Ready to Start Your Reading Journey?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join BookBurst today and transform how you discover, track, and share your reading experiences.
          </p>
          <Button size="lg" asChild>
            <Link to="/bookshelf">
              <BookOpen className="mr-2 h-5 w-5" />
              Create Your Bookshelf
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <BookOpen className="h-5 w-5 text-primary mr-2" />
              <span className="font-playfair font-bold text-lg">BookBurst</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BookBurst. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
