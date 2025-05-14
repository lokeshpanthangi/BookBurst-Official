
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

// Error handling wrapper for API calls
const fetchWithErrorHandling = async (url: string): Promise<any> => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      
      if (response.status === 429) {
        throw new Error("API quota exceeded. Please try again later.");
      }
      
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

// Fetch trending books (using bestsellers or high rated books)
export const fetchTrendingBooks = async (): Promise<Book[]> => {
  try {
    const data = await fetchWithErrorHandling(
      `${BASE_URL}?q=subject:fiction+orderBy=relevance&maxResults=8&key=${API_KEY}`
    );
    
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
    const data = await fetchWithErrorHandling(
      `${BASE_URL}?q=subject:fiction+inpublisher:${currentYear}&orderBy=newest&maxResults=8&key=${API_KEY}`
    );
    
    if (!data.items) return [];
    
    return data.items.map(mapToBook);
  } catch (error) {
    console.error("Error fetching new releases:", error);
    return [];
  }
};

// Fetch personalized recommendations (this would typically use user preferences, but for demo we'll use popular genres)
export const fetchRecommendedBooks = async (preferredGenres?: string[]): Promise<Book[]> => {
  // If user has preferred genres, use one of them randomly, otherwise use popular genres
  const genres = preferredGenres && preferredGenres.length > 0 
    ? preferredGenres 
    : ["fantasy", "mystery", "romance", "science fiction"];
  
  const randomGenre = genres[Math.floor(Math.random() * genres.length)];
  
  try {
    const data = await fetchWithErrorHandling(
      `${BASE_URL}?q=subject:${randomGenre}&orderBy=relevance&maxResults=8&key=${API_KEY}`
    );
    
    if (!data.items) return [];
    
    return data.items.map(mapToBook);
  } catch (error) {
    console.error("Error fetching recommended books:", error);
    return [];
  }
};

// Search books by query with pagination
export const searchBooks = async (query: string, page: number = 0, pageSize: number = 20): Promise<{books: Book[], totalItems: number}> => {
  if (!query.trim()) return { books: [], totalItems: 0 };
  
  try {
    const startIndex = page * pageSize;
    
    const data = await fetchWithErrorHandling(
      `${BASE_URL}?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=${pageSize}&key=${API_KEY}`
    );
    
    if (!data.items) return { books: [], totalItems: data.totalItems || 0 };
    
    const books = data.items.map(mapToBook);
    
    return {
      books,
      totalItems: data.totalItems || books.length
    };
  } catch (error) {
    console.error("Error searching books:", error);
    return { books: [], totalItems: 0 };
  }
};

// Search books by ISBN
export const searchBookByISBN = async (isbn: string): Promise<Book | null> => {
  if (!isbn.trim()) return null;
  
  try {
    const data = await fetchWithErrorHandling(
      `${BASE_URL}?q=isbn:${encodeURIComponent(isbn)}&maxResults=1&key=${API_KEY}`
    );
    
    if (!data.items || data.items.length === 0) return null;
    
    return mapToBook(data.items[0]);
  } catch (error) {
    console.error("Error searching book by ISBN:", error);
    return null;
  }
};

// Search books by author
export const searchBooksByAuthor = async (author: string, page: number = 0, pageSize: number = 20): Promise<{books: Book[], totalItems: number}> => {
  if (!author.trim()) return { books: [], totalItems: 0 };
  
  try {
    const startIndex = page * pageSize;
    
    const data = await fetchWithErrorHandling(
      `${BASE_URL}?q=inauthor:${encodeURIComponent(author)}&startIndex=${startIndex}&maxResults=${pageSize}&key=${API_KEY}`
    );
    
    if (!data.items) return { books: [], totalItems: data.totalItems || 0 };
    
    const books = data.items.map(mapToBook);
    
    return {
      books,
      totalItems: data.totalItems || books.length
    };
  } catch (error) {
    console.error("Error searching books by author:", error);
    return { books: [], totalItems: 0 };
  }
};

// Get book details by ID
export const getBookDetails = async (bookId: string): Promise<Book | null> => {
  if (!bookId.trim()) return null;
  
  try {
    const data = await fetchWithErrorHandling(
      `${BASE_URL}/${bookId}?key=${API_KEY}`
    );
    
    if (!data) return null;
    
    return mapToBook(data);
  } catch (error) {
    console.error("Error fetching book details:", error);
    return null;
  }
};
