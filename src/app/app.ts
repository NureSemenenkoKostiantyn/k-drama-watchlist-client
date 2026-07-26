import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { environment } from '../environments/environment';
import { AuthenticationService } from './core/auth/authentication.service';

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
  private readonly router = inject(Router);

  protected async signOut(): Promise<void> {
    if (await this.authentication.signOut()) {
      await this.router.navigate(['/login']);
    }
  }
}
