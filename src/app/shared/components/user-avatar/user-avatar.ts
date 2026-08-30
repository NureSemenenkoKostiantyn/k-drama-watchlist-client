import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.html',
  styleUrl: './user-avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--ui-avatar-size]': 'size()',
  },
})
export class UserAvatar {
  readonly name = input.required<string>();
  readonly image = input<string | null>();
  readonly size = input('2.5rem');
  readonly decorative = input(true);

  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toLocaleUpperCase() || '?',
  );
}
