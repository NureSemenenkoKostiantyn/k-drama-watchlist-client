import { PublicUserProfile } from '../../users/models/public-user-profile';

export interface SharedListComment {
  id: string;
  listId: string;
  listItemId: string;
  author: PublicUserProfile;
  body?: string;
  hasSpoiler: boolean;
  parentCommentId?: string;
  isDeleted: boolean;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
}

export interface SaveCommentRequest {
  body: string;
  hasSpoiler: boolean;
  parentCommentId?: string;
}
