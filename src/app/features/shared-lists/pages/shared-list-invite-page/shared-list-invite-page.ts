import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { SharedListsService } from '../../data-access/shared-lists.service';

@Component({
  selector: 'app-shared-list-invite-page',
  imports: [RouterLink],
  templateUrl: './shared-list-invite-page.html',
  styleUrl: './shared-list-invite-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedListInvitePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly sharedLists = inject(SharedListsService);
  protected readonly accepting = signal(true);

  ngOnInit(): void {
    void this.accept();
  }

  private async accept(): Promise<void> {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    if (token) {
      const list = await this.sharedLists.acceptInvite(token);
      if (list) {
        await this.router.navigate(['/lists', list.id], { replaceUrl: true });
        return;
      }
    }
    this.accepting.set(false);
  }
}
