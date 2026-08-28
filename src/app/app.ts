import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { environment } from '../environments/environment';
import { AuthenticationService } from './core/auth/authentication.service';
import { NotificationsService } from './features/notifications/data-access/notifications.service';
import { SettingsService } from './features/settings/data-access/settings.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.scss', './app-mobile-nav.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly appName = environment.appName;
  protected readonly authentication = inject(AuthenticationService);
  protected readonly notifications = inject(NotificationsService);
  private readonly settings = inject(SettingsService);
  protected readonly notificationBadge = computed(() => {
    const count = this.notifications.unreadCount();
    return count === 0 ? null : count > 99 ? '99+' : String(count);
  });
  protected readonly notificationLabel = computed(() => {
    const count = this.notifications.unreadCount();
    return count === 0
      ? 'Notifications'
      : `Notifications, ${count} unread`;
  });
  protected readonly routeAnnouncement = signal('');
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (this.authentication.isAuthenticated()) {
        void this.notifications.refresh().catch(() => undefined);
      } else {
        this.notifications.clear();
        this.settings.clear();
      }
    });
  }

  protected handleRouteActivation(): void {
    queueMicrotask(() => {
      const main = this.document.getElementById('main-content');
      const heading = main?.querySelector<HTMLElement>('h1');
      const focusTarget = heading ?? main;

      if (!focusTarget) {
        return;
      }

      const hadTabIndex = focusTarget.hasAttribute('tabindex');
      if (!hadTabIndex) {
        focusTarget.setAttribute('tabindex', '-1');
      }

      focusTarget.classList.add('route-focus-target');
      focusTarget.addEventListener(
        'blur',
        () => {
          focusTarget.classList.remove('route-focus-target');
          if (!hadTabIndex) {
            focusTarget.removeAttribute('tabindex');
          }
        },
        { once: true },
      );
      focusTarget.focus();
      const pageName = heading?.textContent?.trim();
      this.routeAnnouncement.set(
        pageName ? `${pageName} page loaded` : 'Page loaded',
      );
    });
  }

  protected async signOut(): Promise<void> {
    if (await this.authentication.signOut()) {
      await this.router.navigate(['/login']);
    }
  }
}
