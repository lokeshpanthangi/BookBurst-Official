
import { useState, useEffect } from "react";
import { UserBook } from "@/types/book";
import TimelineEvent from "@/components/TimelineEvent";
import EmptyState from "@/components/EmptyState";
import { Clock, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Mock books with activity data
const mockTimelineData: {book: UserBook; date: string}[] = [
  {
    book: {
      id: "2",
      title: "Atomic Habits",
      author: "James Clear",
      coverImage: "https://images.unsplash.com/photo-1535398089889-dd807df1dfaa?auto=format&fit=crop&q=80&w=300",
      description: "No matter your goals, Atomic Habits offers a proven framework for improving--every day.",
      status: "finished",
      finishDate: "2023-03-15",
      userRating: 5,
      genres: ["Self-Help", "Psychology", "Productivity"],
      notes: "This book completely changed how I think about habit formation. The concept of 1% improvements and identity-based habits resonated strongly with me. I've already started implementing the habit stacking technique with some success."
    },
    date: "2023-03-15T10:30:00Z"
  },
  {
    book: {
      id: "1",
      title: "The Midnight Library",
      author: "Matt Haig",
      coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300",
      description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
      status: "currently-reading",
      progress: 45,
      userRating: 4,
      genres: ["Fiction", "Fantasy", "Self-Help"]
    },
    date: "2023-02-28T15:45:00Z"
  },
  {
    book: {
      id: "6",
      title: "The Alchemist",
      author: "Paulo Coelho",
      coverImage: "https://images.unsplash.com/photo-1613922110088-8412b50d5eef?auto=format&fit=crop&q=80&w=300",
      description: "The Alchemist follows the journey of an Andalusian shepherd boy named Santiago.",
      status: "finished",
      finishDate: "2022-08-10",
      userRating: 4,
      genres: ["Fiction", "Philosophy", "Fantasy"]
    },
    date: "2022-08-10T21:15:00Z"
  },
  {
    book: {
      id: "3",
      title: "Dune",
      author: "Frank Herbert",
      coverImage: "https://images.unsplash.com/photo-1589409514187-c21d14df0d04?auto=format&fit=crop&q=80&w=300",
      description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world.",
      status: "want-to-read",
      genres: ["Science Fiction", "Fantasy", "Classic"]
    },
    date: "2022-07-15T09:20:00Z"
  }
];

const Timeline = () => {
  const [timelineData, setTimelineData] = useState<{book: UserBook; date: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setTimelineData(mockTimelineData);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const goToBookshelf = () => {
    navigate("/bookshelf");
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-playfair font-bold mb-2">Reading Timeline</h1>
        <p className="text-muted-foreground">
          Your reading journey visualized. See the history of the books you've read, started, and added to your shelves.
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col space-y-12 pl-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-20 bg-muted rounded mb-4"></div>
              <div className="bg-card border rounded-lg h-36"></div>
            </div>
          ))}
        </div>
      ) : timelineData.length > 0 ? (
        <div className="relative">
          {timelineData.map((item, index) => (
            <TimelineEvent 
              key={`${item.book.id}-${index}`} 
              book={item.book} 
              date={item.date} 
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Clock className="h-8 w-8 text-muted-foreground" />}
          title="Your timeline is empty"
          description="Add books to your shelves and start tracking your reading progress to build your timeline."
          action={{
            label: "Go to bookshelf",
            onClick: goToBookshelf,
          }}
          className="my-12"
        />
      )}
    </div>
  );
};

export default Timeline;
