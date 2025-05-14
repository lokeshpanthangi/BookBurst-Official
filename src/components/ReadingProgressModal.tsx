import { useState } from "react";
import { UserBook } from "@/types/book";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Calendar as CalendarIcon, Loader2, Book, BookOpen } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface ReadingProgressModalProps {
  bookId: string;
  isOpen: boolean;
  onClose: () => void;
  initialProgress: number;
  onProgressUpdate: (progress: number) => void;
}

const ReadingProgressModal = ({ 
  book, 
  open, 
  onOpenChange, 
  onUpdateProgress 
}: ReadingProgressModalProps) => {
  const { toast } = useToast();
  const [progress, setProgress] = useState(book.progress || 0);
  const [startDate, setStartDate] = useState<Date | undefined>(
    book.startDate ? new Date(book.startDate) : undefined
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [pageInput, setPageInput] = useState<string>("");
  const [totalPages, setTotalPages] = useState(book.pageCount || 100);
  
  // Update progress when page input changes
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pageValue = parseInt(e.target.value) || 0;
    setPageInput(e.target.value);
    
    if (pageValue > 0 && totalPages > 0) {
      const calculatedProgress = Math.min(100, Math.round((pageValue / totalPages) * 100));
      setProgress(calculatedProgress);
    }
  };
  
  // Update page input when progress slider changes
  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress);
    
    if (totalPages > 0) {
      const calculatedPage = Math.round((newProgress / 100) * totalPages);
      setPageInput(calculatedPage.toString());
    }
  };
  
  const handleTotalPagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTotalPages = parseInt(e.target.value) || 100;
    setTotalPages(newTotalPages);
    
    // Recalculate page input based on current progress percentage
    const calculatedPage = Math.round((progress / 100) * newTotalPages);
    setPageInput(calculatedPage.toString());
  };
  
  const handleSubmit = async () => {
    setIsUpdating(true);
    
    try {
      // Update the book's reading progress
      onUpdateProgress(
        book.id, 
        progress, 
        startDate ? format(startDate, "yyyy-MM-dd") : undefined
      );
      
      toast({
        title: "Progress updated",
        description: `Progress for ${book.title} updated to ${progress}%`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error updating progress",
        description: "Failed to update reading progress. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="h-6 w-6" /> Update Reading Progress
          </DialogTitle>
          <DialogDescription>
            Track your reading progress for "{book.title}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4 animate-fade-in">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-right mb-2">Progress ({progress}%)</Label>
              <div className="pt-4">
                <Slider
                  value={[progress]}
                  max={100}
                  step={1}
                  onValueChange={handleProgressChange}
                  className="cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="currentPage">Current Page</Label>
                <Input
                  id="currentPage"
                  type="number"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  placeholder="Current page"
                  min={0}
                  max={totalPages}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="totalPages">Total Pages</Label>
                <Input
                  id="totalPages"
                  type="number"
                  value={totalPages}
                  onChange={handleTotalPagesChange}
                  placeholder="Total pages"
                  min={1}
                />
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-1">
                Setting a start date helps track your reading pace
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={isUpdating}
            className="relative overflow-hidden"
          >
            {isUpdating && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            <span className={isUpdating ? "opacity-0" : "opacity-100"}>
              Save Progress
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReadingProgressModal;
