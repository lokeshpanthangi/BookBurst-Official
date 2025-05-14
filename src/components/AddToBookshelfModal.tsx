import { useState } from "react";
import { Book } from "@/types/book";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Calendar as CalendarIcon, Loader2, BookOpen, BookMarked, CheckCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Rating } from "@/components/Rating";
import { Switch } from "@/components/ui/switch";

interface AddToBookshelfModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onAddToBookshelf: (bookData: {
    status: string;
    rating?: number;
    progress?: number;
    startDate?: string;
    finishDate?: string;
    notes?: string;
    isPublic: boolean;
  }) => void;
}

const AddToBookshelfModal = ({ 
  book, 
  isOpen, 
  onClose, 
  onAddToBookshelf 
}: AddToBookshelfModalProps) => {
  const [status, setStatus] = useState<string>("want-to-read");
  const [rating, setRating] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [finishDate, setFinishDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { toast } = useToast();
  
  const handleSubmit = () => {
    setIsSubmitting(true);
    
    try {
      onAddToBookshelf({
        status,
        rating: rating > 0 ? rating : undefined,
        progress: status === "currently-reading" ? progress : undefined,
        startDate: startDate ? startDate.toISOString() : undefined,
        finishDate: finishDate ? finishDate.toISOString() : undefined,
        notes: notes.trim() || undefined,
        isPublic
      });
      
      toast({
        title: "Success",
        description: "Book added to your bookshelf",
      });
      
      onClose();
    } catch (error) {
      console.error("Error adding book to bookshelf:", error);
      toast({
        title: "Error",
        description: "Failed to add book to your bookshelf",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Your Bookshelf</DialogTitle>
          <DialogDescription>
            Add "{book.title}" by {book.author} to your bookshelf
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Reading Status</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                if (value === "currently-reading" && !startDate) {
                  setStartDate(new Date());
                }
                if (value === "finished" && !finishDate) {
                  setFinishDate(new Date());
                }
              }}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="want-to-read">
                  <div className="flex items-center">
                    <BookMarked className="mr-2 h-4 w-4 text-blue-500" />
                    <span>Want to Read</span>
                  </div>
                </SelectItem>
                <SelectItem value="currently-reading">
                  <div className="flex items-center">
                    <BookOpen className="mr-2 h-4 w-4 text-amber-500" />
                    <span>Currently Reading</span>
                  </div>
                </SelectItem>
                <SelectItem value="finished">
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    <span>Finished</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {status === "currently-reading" && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="progress">Reading Progress</Label>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Slider
                id="progress"
                min={0}
                max={100}
                step={1}
                value={[progress]}
                onValueChange={(value) => setProgress(value[0])}
                className="w-full"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Your Rating</Label>
            <div className="flex items-center">
              <Rating value={rating} onChange={setRating} size="lg" />
              <span className="ml-2 text-sm text-muted-foreground">
                {rating > 0 ? `${rating} stars` : "No rating"}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
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
            </div>
            
            {status === "finished" && (
              <div className="space-y-2">
                <Label>Finish Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {finishDate ? format(finishDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={finishDate}
                      onSelect={setFinishDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add your private notes about this book..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="public">Make this book public in your profile</Label>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add to Bookshelf"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddToBookshelfModal;
