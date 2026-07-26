import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { environment } from '../environments/environment';
import { AuthenticationService } from './core/auth/authentication.service';
import { NotificationsService } from './features/notifications/data-access/notifications.service';

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
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (this.authentication.isAuthenticated()) {
        void this.notifications.refresh().catch(() => undefined);
      } else {
        this.notifications.clear();
      }
    });
  }

  protected async signOut(): Promise<void> {
    if (await this.authentication.signOut()) {
      await this.router.navigate(['/login']);
    }
  }
}
