
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Navigation from "@/components/Navigation";
import Bookshelf from "./pages/Bookshelf";
import BookDetail from "./pages/BookDetail";
import UserBookDetail from "./pages/UserBookDetail";
import MyReviews from "./pages/MyReviews";
import GoogleBookDetail from "./pages/GoogleBookDetail";
import Explore from "./pages/Explore";
import Timeline from "./pages/Timeline";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Community from "./pages/Community";
import UserProfile from "./pages/UserProfile";
import Analytics from "./pages/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-1 bg-background">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/bookshelf" element={
                  <ProtectedRoute>
                    <Bookshelf />
                  </ProtectedRoute>
                } />
                <Route path="/book/:id" element={<UserBookDetail />} />
                <Route path="/google-book/:id" element={<GoogleBookDetail />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/timeline" element={
                  <ProtectedRoute>
                    <Timeline />
                  </ProtectedRoute>
                } />
                <Route path="/my-reviews" element={
                  <ProtectedRoute>
                    <MyReviews />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/community" element={<Community />} />
                <Route path="/community/:userId" element={<UserProfile />} />
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
