import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UserAvatar } from '../user-avatar/user-avatar';

@Component({
  selector: 'app-public-user-link',
  imports: [RouterLink, UserAvatar],
  templateUrl: './public-user-link.html',
  styleUrl: './public-user-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicUserLink {
  readonly userId = input.required<string>();
  readonly username = input.required<string>();
  readonly name = input.required<string>();
  readonly image = input<string | null>();
  readonly showAvatar = input(false);
  readonly showName = input(false);
  readonly avatarSize = input('2.5rem');
}
