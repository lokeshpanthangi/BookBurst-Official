
import { Book } from "@/types/book";

const API_KEY = "AIzaSyDcGJIOArv2hy2bPWCfJwVXUeXgFc6xnso";
const BASE_URL = "https://www.googleapis.com/books/v1/volumes";

// Convert Google Books API response to our Book type
const mapToBook = (item: any): Book => {
  const volumeInfo = item.volumeInfo;
  
  return {
    id: item.id,
    title: volumeInfo.title || "Unknown Title",
    author: volumeInfo.authors ? volumeInfo.authors.join(", ") : "Unknown Author",
    coverImage: volumeInfo.imageLinks?.thumbnail || "https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=300",
    description: volumeInfo.description || "No description available",
    publishedDate: volumeInfo.publishedDate,
    publisher: volumeInfo.publisher,
    pageCount: volumeInfo.pageCount,
    isbn: volumeInfo.industryIdentifiers?.[0]?.identifier,
    language: volumeInfo.language,
    genres: volumeInfo.categories || [],
    averageRating: volumeInfo.averageRating,
    ratingsCount: volumeInfo.ratingsCount || 0
  };
};

// Fetch trending books (using bestsellers or high rated books)
export const fetchTrendingBooks = async (): Promise<Book[]> => {
  try {
    const response = await fetch(`${BASE_URL}?q=subject:fiction+orderBy=relevance&maxResults=8&key=${API_KEY}`);
    const data = await response.json();
    
    if (!data.items) return [];
    
    return data.items.map(mapToBook);
  } catch (error) {
    console.error("Error fetching trending books:", error);
    return [];
  }
};

// Fetch new releases (using recent publishing dates)
export const fetchNewReleases = async (): Promise<Book[]> => {
  const currentYear = new Date().getFullYear();
  
  try {
    const response = await fetch(
      `${BASE_URL}?q=subject:fiction+inpublisher:${currentYear}&orderBy=newest&maxResults=8&key=${API_KEY}`
    );
    const data = await response.json();
    
    if (!data.items) return [];
    
    return data.items.map(mapToBook);
  } catch (error) {
    console.error("Error fetching new releases:", error);
    return [];
  }
};

// Fetch personalized recommendations (this would typically use user preferences, but for demo we'll use popular genres)
export const fetchRecommendedBooks = async (): Promise<Book[]> => {
  // This could be modified to use actual user preferences in the future
  const popularGenres = ["fantasy", "mystery", "romance", "science fiction"];
  const randomGenre = popularGenres[Math.floor(Math.random() * popularGenres.length)];
  
  try {
    const response = await fetch(
      `${BASE_URL}?q=subject:${randomGenre}&orderBy=relevance&maxResults=8&key=${API_KEY}`
    );
    const data = await response.json();
    
    if (!data.items) return [];
    
    return data.items.map(mapToBook);
  } catch (error) {
    console.error("Error fetching recommended books:", error);
    return [];
  }
};

// Search books by query
export const searchBooks = async (query: string): Promise<Book[]> => {
  if (!query.trim()) return [];
  
  try {
    const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=20&key=${API_KEY}`);
    const data = await response.json();
    
    if (!data.items) return [];
    
    return data.items.map(mapToBook);
  } catch (error) {
    console.error("Error searching books:", error);
    return [];
  }
};
