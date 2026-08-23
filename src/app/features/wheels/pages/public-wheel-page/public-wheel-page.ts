import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PublicWheelsService } from '../../data-access/public-wheels.service';
import { PublicWheelDetails } from '../../models/wheel';

@Component({
  selector: 'app-public-wheel-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './public-wheel-page.html',
  styleUrl: './public-wheel-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicWheelPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicWheels = inject(PublicWheelsService);
  protected readonly wheel = signal<PublicWheelDetails | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly enabledItems = computed(
    () => this.wheel()?.items.filter((item) => item.isEnabled) ?? [],
  );

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const publicSlug = this.route.snapshot.paramMap.get('publicSlug') ?? '';
    if (!publicSlug) {
      this.error.set('This wheel link is invalid.');
      this.loading.set(false);
      return;
    }
    try {
      this.wheel.set(await this.publicWheels.get(publicSlug));
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'This wheel is unavailable.');
    } finally {
      this.loading.set(false);
    }
  }
}
