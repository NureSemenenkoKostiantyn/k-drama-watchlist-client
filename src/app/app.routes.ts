import { Routes } from '@angular/router';

import { anonymousOnlyGuard, onboardingGuard, profileCompleteGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'activity',
    title: 'Friends activity · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/activity/pages/activity-page/activity-page').then(
        ({ ActivityPage }) => ActivityPage,
      ),
  },
  {
    path: 'statistics',
    title: 'Your statistics · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/statistics/pages/statistics-page/statistics-page').then(
        ({ StatisticsPage }) => StatisticsPage,
      ),
  },
  {
    path: 'login',
    title: 'Log in · Drama Watch',
    canActivate: [anonymousOnlyGuard],
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page').then(({ LoginPage }) => LoginPage),
  },
  {
    path: 'mcp/consent',
    title: 'Connect an application · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/auth/pages/mcp-consent-page/mcp-consent-page').then(
        ({ McpConsentPage }) => McpConsentPage,
      ),
  },
  {
    path: 'register',
    title: 'Create account · Drama Watch',
    canActivate: [anonymousOnlyGuard],
    loadComponent: () =>
      import('./features/auth/pages/register-page/register-page').then(
        ({ RegisterPage }) => RegisterPage,
      ),
  },
  {
    path: 'onboarding',
    title: 'Choose a username · Drama Watch',
    canActivate: [onboardingGuard],
    loadComponent: () =>
      import('./features/auth/pages/onboarding-page/onboarding-page').then(
        ({ OnboardingPage }) => OnboardingPage,
      ),
  },
  {
    path: 'search',
    title: 'Search · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/search/pages/search-page/search-page').then(
        ({ SearchPage }) => SearchPage,
      ),
  },
  {
    path: 'media/:mediaType/:tmdbId',
    title: 'Media details · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/search/pages/media-details-page/media-details-page').then(
        ({ MediaDetailsPage }) => MediaDetailsPage,
      ),
  },
  {
    path: 'library',
    pathMatch: 'full',
    redirectTo: 'library/to-watch',
  },
  {
    path: 'library/to-watch',
    title: 'To watch · Drama Watch',
    canActivate: [profileCompleteGuard],
    data: { status: 'to_watch' },
    loadComponent: () =>
      import('./features/library/pages/library-page/library-page').then(
        ({ LibraryPage }) => LibraryPage,
      ),
  },
  {
    path: 'library/watching',
    title: 'Watching · Drama Watch',
    canActivate: [profileCompleteGuard],
    data: { status: 'watching' },
    loadComponent: () =>
      import('./features/library/pages/library-page/library-page').then(
        ({ LibraryPage }) => LibraryPage,
      ),
  },
  {
    path: 'library/watched',
    title: 'Watched · Drama Watch',
    canActivate: [profileCompleteGuard],
    data: { status: 'watched' },
    loadComponent: () =>
      import('./features/library/pages/library-page/library-page').then(
        ({ LibraryPage }) => LibraryPage,
      ),
  },
  {
    path: 'priority',
    title: 'Priority board · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/priority/pages/priority-page/priority-page').then(
        ({ PriorityPage }) => PriorityPage,
      ),
  },
  {
    path: 'friends',
    title: 'Friends · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/users/pages/people-search-page/people-search-page').then(
        ({ PeopleSearchPage }) => PeopleSearchPage,
      ),
  },
  {
    path: 'suggestions',
    title: 'Suggestions · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/suggestions/pages/suggestions-page/suggestions-page').then(
        ({ SuggestionsPage }) => SuggestionsPage,
      ),
  },
  {
    path: 'notifications',
    title: 'Notifications - Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/notifications/pages/notifications-page/notifications-page').then(
        ({ NotificationsPage }) => NotificationsPage,
      ),
  },
  {
    path: 'profile',
    title: 'Your profile · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/users/pages/public-profile-page/public-profile-page').then(
        ({ PublicProfilePage }) => PublicProfilePage,
      ),
  },
  {
    path: 'users/:userId/library',
    title: 'Shared library - Drama Watch',
    loadComponent: () =>
      import('./features/users/pages/friend-library-page/friend-library-page').then(
        ({ FriendLibraryPage }) => FriendLibraryPage,
      ),
  },
  {
    path: 'users/:userId',
    title: 'Profile · Drama Watch',
    loadComponent: () =>
      import('./features/users/pages/public-profile-page/public-profile-page').then(
        ({ PublicProfilePage }) => PublicProfilePage,
      ),
  },
  {
    path: 'verify-email',
    title: 'Verify email - Drama Watch',
    loadComponent: () =>
      import('./features/auth/pages/verify-email-page/verify-email-page').then(
        ({ VerifyEmailPage }) => VerifyEmailPage,
      ),
  },
  {
    path: 'forgot-password',
    title: 'Forgot password - Drama Watch',
    loadComponent: () =>
      import('./features/auth/pages/forgot-password-page/forgot-password-page').then(
        ({ ForgotPasswordPage }) => ForgotPasswordPage,
      ),
  },
  {
    path: 'reset-password',
    title: 'Reset password - Drama Watch',
    loadComponent: () =>
      import('./features/auth/pages/reset-password-page/reset-password-page').then(
        ({ ResetPasswordPage }) => ResetPasswordPage,
      ),
  },
  {
    path: 'wheels',
    title: 'Wheels · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/wheels/pages/wheels-page/wheels-page').then(
        ({ WheelsPage }) => WheelsPage,
      ),
  },
  {
    path: 'wheels/public/:publicSlug',
    title: 'Shared wheel · Drama Watch',
    loadComponent: () =>
      import('./features/wheels/pages/public-wheel-page/public-wheel-page').then(
        ({ PublicWheelPage }) => PublicWheelPage,
      ),
  },
  {
    path: 'wheels/:wheelId',
    title: 'Wheel · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/wheels/pages/wheel-page/wheel-page').then(({ WheelPage }) => WheelPage),
  },
  {
    path: 'lists',
    title: 'Shared lists · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/shared-lists/pages/shared-lists-page/shared-lists-page').then(
        ({ SharedListsPage }) => SharedListsPage,
      ),
  },
  {
    path: 'lists/discover',
    title: 'Discover public watchlists · Drama Watch',
    loadComponent: () =>
      import('./features/shared-lists/pages/public-shared-list-discovery-page/public-shared-list-discovery-page').then(
        ({ PublicSharedListDiscoveryPage }) => PublicSharedListDiscoveryPage,
      ),
  },
  {
    path: 'lists/public/:publicSlug',
    title: 'Shared watchlist · Drama Watch',
    loadComponent: () =>
      import('./features/shared-lists/pages/public-shared-list-page/public-shared-list-page').then(
        ({ PublicSharedListPage }) => PublicSharedListPage,
      ),
  },
  {
    path: 'lists/invitations/:inviteId',
    title: 'Join shared list · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/shared-lists/pages/shared-list-invite-page/shared-list-invite-page').then(
        ({ SharedListInvitePage }) => SharedListInvitePage,
      ),
  },
  {
    path: 'lists/invites/:token',
    title: 'Join shared list · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/shared-lists/pages/shared-list-invite-page/shared-list-invite-page').then(
        ({ SharedListInvitePage }) => SharedListInvitePage,
      ),
  },
  {
    path: 'lists/:listId',
    title: 'Shared list · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/shared-lists/pages/shared-list-page/shared-list-page').then(
        ({ SharedListPage }) => SharedListPage,
      ),
  },
  {
    path: '',
    title: 'Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page').then(({ HomePage }) => HomePage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
