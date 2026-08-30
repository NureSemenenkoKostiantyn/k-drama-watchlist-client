import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

import { Button } from '../../../../shared/components/button/button';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { TelegramService } from '../../data-access/telegram.service';

@Component({
  selector: 'app-telegram-connection-settings',
  imports: [Button, ConfirmationDialog],
  templateUrl: './telegram-connection-settings.html',
  styleUrl: './telegram-connection-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelegramConnectionSettingsComponent implements OnInit {
  protected readonly telegram = inject(TelegramService);
  protected readonly link = signal<string | null>(null);
  protected readonly linkExpiresAt = signal<string | null>(null);
  protected readonly isCreatingLink = signal(false);
  protected readonly isDisconnecting = signal(false);
  protected readonly showDisconnectConfirmation = signal(false);

  ngOnInit(): void {
    void this.telegram.load();
  }

  protected async createLink(): Promise<void> {
    if (this.isCreatingLink()) return;

    this.isCreatingLink.set(true);
    const link = await this.telegram.createLink();

    if (link) {
      this.link.set(link.deepLink);
      this.linkExpiresAt.set(link.expiresAt);
    }

    this.isCreatingLink.set(false);
  }

  protected async disconnect(): Promise<void> {
    if (this.isDisconnecting()) return;

    this.isDisconnecting.set(true);
    const disconnected = await this.telegram.disconnect();
    this.isDisconnecting.set(false);

    if (disconnected) {
      this.link.set(null);
      this.linkExpiresAt.set(null);
      this.showDisconnectConfirmation.set(false);
    }
  }

  protected formattedExpiry(): string | null {
    const expiry = this.linkExpiresAt();
    if (!expiry) return null;

    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(expiry));
  }
}

