
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AuthForm from "./AuthForm";
import { motion, AnimatePresence } from "framer-motion";

type AuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "signin" | "signup";
  onSuccess?: () => void;
};

const AuthModal = ({
  open,
  onOpenChange,
  defaultTab = "signin",
  onSuccess,
}: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);

  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-playfair">
            {activeTab === "signin" ? "Welcome Back" : "Create Account"}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs
          defaultValue={defaultTab}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "signin" | "signup")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === "signin" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === "signin" ? 20 : -20 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="signin">
                <AuthForm type="signin" onSuccess={handleSuccess} />
              </TabsContent>
              
              <TabsContent value="signup">
                <AuthForm type="signup" onSuccess={handleSuccess} />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
