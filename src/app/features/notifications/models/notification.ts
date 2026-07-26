import { PublicUserProfile } from '../../users/models/public-user-profile';

export type NotificationType =
  | 'friend_request'
  | 'friend_request_accepted'
  | 'suggestion_received'
  | 'shared_list_invite'
  | 'shared_list_comment'
  | 'comment_reply'
  | 'wheel_invite'
  | 'shared_item_updated';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actor?: PublicUserProfile;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationsOverview {
  items: NotificationItem[];
  unreadCount: number;
}

export interface MarkAllNotificationsResponse {
  updatedCount: number;
}
