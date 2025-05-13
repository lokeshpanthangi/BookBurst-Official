
export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  content: string;
  datePosted: string;
  likes: number;
  spoiler: boolean;
  recommended: boolean;
}
