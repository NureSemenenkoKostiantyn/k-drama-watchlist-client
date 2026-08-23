export type LibraryVisibility = 'private' | 'friends' | 'public';
export type ActivityVisibility = 'private' | 'friends' | 'public';

export interface UserSettings {
  libraryVisibility: LibraryVisibility;
  activityVisibility: ActivityVisibility;
}

export interface UpdateUserSettings {
  libraryVisibility?: LibraryVisibility;
  activityVisibility?: ActivityVisibility;
}
