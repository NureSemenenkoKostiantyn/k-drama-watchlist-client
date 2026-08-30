import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface TelegramWebApp {
  expand(): void;
  ready(): void;
}

interface TelegramWindow extends Window {
  Telegram?: { WebApp?: TelegramWebApp };
}

@Component({
  selector: 'app-telegram-mini-app-page',
  imports: [RouterLink],
  templateUrl: './telegram-mini-app-page.html',
  styleUrl: './telegram-mini-app-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelegramMiniAppPage implements OnInit {
  private readonly document = inject(DOCUMENT);
  protected readonly isInsideTelegram = signal(false);

  ngOnInit(): void {
    const telegram = (this.document.defaultView as TelegramWindow | null)?.Telegram?.WebApp;
    if (!telegram) return;

    this.isInsideTelegram.set(true);
    telegram.ready();
    telegram.expand();
  }
}

