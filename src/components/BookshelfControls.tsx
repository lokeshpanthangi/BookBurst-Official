
import { useState } from "react";
import { LayoutGrid, List, Filter, SlidersHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BookView, BookshelfFilters } from "@/types/book";

interface BookshelfControlsProps {
  view: BookView;
  setView: (view: BookView) => void;
  filters: BookshelfFilters;
  setFilters: (filters: BookshelfFilters) => void;
}

const BookshelfControls = ({
  view,
  setView,
  filters,
  setFilters,
}: BookshelfControlsProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchTerm });
  };

  const handleStatusChange = (status: BookshelfFilters["status"]) => {
    setFilters({ ...filters, status });
  };

  const handleSortChange = (sort: BookshelfFilters["sort"]) => {
    setFilters({ ...filters, sort });
  };

  const getSortLabel = (sort: BookshelfFilters["sort"]) => {
    switch (sort) {
      case "title":
        return "Title";
      case "author":
        return "Author";
      case "dateAdded":
        return "Date Added";
      case "rating":
        return "Rating";
      case "recentlyUpdated":
        return "Recently Updated";
      default:
        return "Sort";
    }
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button
            variant={filters.status === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("all")}
          >
            All
          </Button>
          <Button
            variant={filters.status === "currently-reading" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("currently-reading")}
          >
            Currently Reading
          </Button>
          <Button
            variant={filters.status === "want-to-read" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("want-to-read")}
          >
            Want to Read
          </Button>
          <Button
            variant={filters.status === "finished" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("finished")}
          >
            Finished
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="search"
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-[200px] pl-8"
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </form>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-2">
                <h4 className="font-semibold">Sort by</h4>
                <div className="space-y-1">
                  {["title", "author", "dateAdded", "rating", "recentlyUpdated"].map((sort) => (
                    <Button
                      key={sort}
                      variant={filters.sort === sort ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleSortChange(sort as BookshelfFilters["sort"])}
                    >
                      {getSortLabel(sort as BookshelfFilters["sort"])}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="border-l h-8 mx-1"></div>

          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("grid")}
            className="rounded-r-none"
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("list")}
            className="rounded-l-none"
            title="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookshelfControls;
