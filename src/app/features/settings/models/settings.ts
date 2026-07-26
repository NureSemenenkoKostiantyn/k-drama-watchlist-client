export type LibraryVisibility = 'private' | 'friends' | 'public';

export interface UserSettings {
  libraryVisibility: LibraryVisibility;
}
