
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/AuthForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const Auth = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/bookshelf");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 px-4 flex justify-center items-center">
        <div className="animate-pulse space-y-8 w-full max-w-md">
          <div className="h-6 bg-muted rounded w-1/3 mx-auto"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const containerAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <motion.div 
        className="max-w-md mx-auto"
        variants={containerAnimation}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 
          className="text-3xl font-playfair font-bold text-center mb-6"
          variants={itemAnimation}
        >
          Join the Reading Journey
        </motion.h1>
        
        <motion.p 
          className="text-muted-foreground text-center mb-8"
          variants={itemAnimation}
        >
          Track your books, share reviews, and connect with fellow readers.
        </motion.p>
        
        <motion.div
          className="bg-card border rounded-lg p-6"
          variants={itemAnimation}
        >
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <AuthForm type="signin" onSuccess={() => navigate("/bookshelf")} />
            </TabsContent>
            
            <TabsContent value="signup">
              <AuthForm type="signup" onSuccess={() => navigate("/bookshelf")} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;
