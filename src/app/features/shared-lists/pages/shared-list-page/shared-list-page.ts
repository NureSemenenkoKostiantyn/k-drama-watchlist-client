import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DatePipe, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { LibraryService } from '../../../library/data-access/library.service';
import { FriendsService } from '../../../friends/data-access/friends.service';
import { UsersService } from '../../../users/data-access/users.service';
import { PublicUserProfile } from '../../../users/models/public-user-profile';
import {
  KeyboardReorderAction,
  KeyboardReorderControls,
} from '../../../../shared/components/keyboard-reorder-controls/keyboard-reorder-controls';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { SharedListComments } from '../../components/shared-list-comments/shared-list-comments';
import { SharedListsService } from '../../data-access/shared-lists.service';
import {
  SharedListItem,
  SharedListMember,
  SharedListPendingInvite,
  SharedListRole,
  SharedListVisibility,
} from '../../models/shared-list';

const mobileSharedListBreakpoint = '(max-width: 48rem)';

@Component({
  selector: 'app-shared-list-page',
  imports: [
    CdkDrag,
    CdkDropList,
    DatePipe,
    ConfirmationDialog,
    KeyboardReorderControls,
    ReactiveFormsModule,
    RouterLink,
    SharedListComments,
  ],
  templateUrl: './shared-list-page.html',
  styleUrls: [
    './shared-list-page.scss',
    './shared-list-invites.scss',
    './shared-list-items.scss',
    './shared-list-mobile.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedListPage implements OnInit {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly listId = this.route.snapshot.paramMap.get('listId') ?? '';
  protected readonly sharedLists = inject(SharedListsService);
  protected readonly library = inject(LibraryService);
  private readonly friendsService = inject(FriendsService);
  private readonly usersService = inject(UsersService);
  protected readonly list = this.sharedLists.activeList;
  protected readonly isSaving = signal(false);
  protected readonly isMobileSharedListLayout = toSignal(
    this.breakpointObserver
      .observe(mobileSharedListBreakpoint)
      .pipe(map((breakpointState) => breakpointState.matches)),
    { initialValue: false },
  );
  protected readonly pendingDelete = signal(false);
  protected readonly activeMemberId = signal<string | null>(null);
  protected readonly pendingMemberRemovalId = signal<string | null>(null);
  protected readonly invite = signal<{ url: string; expiresAt: string; target: string } | null>(
    null,
  );
  protected readonly copied = signal(false);
  protected readonly inviteFriends = signal<PublicUserProfile[]>([]);
  protected readonly inviteCandidates = signal<PublicUserProfile[]>([]);
  protected readonly pendingInvites = signal<SharedListPendingInvite[]>([]);
  protected readonly isInviting = signal(false);
  protected readonly isSearchingPeople = signal(false);
  protected readonly activeInviteId = signal<string | null>(null);
  protected readonly pendingInviteRevokeId = signal<string | null>(null);
  protected readonly inviteFeedback = signal<string | null>(null);
  protected readonly inviteError = signal<string | null>(null);
  protected readonly publicLinkCopied = signal(false);
  protected readonly reorderAnnouncement = signal('');
  protected readonly isOwner = computed(() => this.list()?.role === 'owner');
  protected readonly canEdit = computed(() =>
    ['owner', 'editor'].includes(this.list()?.role ?? ''),
  );
  protected readonly isItemDragDisabled = computed(
    () => this.isMobileSharedListLayout() || !this.canEdit() || this.isSaving(),
  );
  protected readonly publicUrl = computed(() => {
    const publicSlug = this.list()?.publicSlug;
    return publicSlug
      ? `${this.document.location.origin}/api/public/lists/share/${encodeURIComponent(publicSlug)}`
      : null;
  });
  protected readonly availableEntries = computed(() => {
    const used = new Set(this.list()?.items.map((item) => item.mediaId) ?? []);
    return this.library.entries().filter((entry) => !used.has(entry.mediaId));
  });
  protected readonly settingsForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(2000)]],
    visibility: this.formBuilder.nonNullable.control<SharedListVisibility>('private'),
  });
  protected readonly addForm = this.formBuilder.nonNullable.group({
    mediaId: ['', Validators.required],
  });
  protected readonly inviteForm = this.formBuilder.nonNullable.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9_.]+$/),
      ],
    ],
    role: this.formBuilder.nonNullable.control<Exclude<SharedListRole, 'owner'>>('viewer'),
  });

  ngOnInit(): void {
    if (!this.listId) {
      void this.router.navigate(['/lists']);
      return;
    }
    void this.load();
  }

  protected async saveSettings(): Promise<void> {
    if (!this.isOwner() || this.settingsForm.invalid || this.isSaving()) return;
    const value = this.settingsForm.getRawValue();
    this.isSaving.set(true);
    await this.sharedLists.update(this.listId, {
      title: value.title.trim(),
      description: value.description.trim() || null,
      visibility: value.visibility,
    });
    this.isSaving.set(false);
  }

  protected async addItem(): Promise<void> {
    if (!this.canEdit() || this.addForm.invalid || this.isSaving()) return;
    this.isSaving.set(true);
    const item = await this.sharedLists.addItem(this.listId, this.addForm.getRawValue().mediaId);
    this.isSaving.set(false);
    if (item) this.addForm.reset({ mediaId: '' });
  }

  protected async updateStatus(item: SharedListItem, event: Event): Promise<void> {
    const groupStatus = (event.target as HTMLSelectElement).value as
      'planned' | 'watching' | 'finished';
    await this.sharedLists.updateItem(this.listId, item.id, { groupStatus });
  }

  protected async updateNote(item: SharedListItem, event: Event): Promise<void> {
    const note = (event.target as HTMLTextAreaElement).value.trim();
    await this.sharedLists.updateItem(this.listId, item.id, { note: note || null });
  }

  protected async updateProgress(
    item: SharedListItem,
    season: string,
    episode: string,
  ): Promise<void> {
    await this.sharedLists.updateItem(this.listId, item.id, {
      groupProgress: {
        currentSeason: Math.max(0, Number(season) || 0),
        currentEpisode: Math.max(0, Number(episode) || 0),
      },
    });
  }

  protected async removeItem(itemId: string): Promise<void> {
    await this.sharedLists.deleteItem(this.listId, itemId);
  }

  protected async drop(event: CdkDragDrop<SharedListItem[]>): Promise<void> {
    if (!this.canEdit() || this.isSaving() || event.previousIndex === event.currentIndex) return;
    const ids = [...(this.list()?.items.map((item) => item.id) ?? [])];
    moveItemInArray(ids, event.previousIndex, event.currentIndex);
    this.isSaving.set(true);
    const saved = await this.sharedLists.reorder(this.listId, ids);
    this.isSaving.set(false);
    if (!saved) await this.sharedLists.loadList(this.listId);
  }

  protected async moveItemWithKeyboard(
    item: SharedListItem,
    action: KeyboardReorderAction,
  ): Promise<void> {
    if ((action !== 'before' && action !== 'after') || !this.canEdit() || this.isSaving()) {
      return;
    }

    const items = [...(this.list()?.items ?? [])];
    const currentIndex = items.findIndex((candidate) => candidate.id === item.id);
    const targetIndex = currentIndex + (action === 'before' ? -1 : 1);

    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= items.length) {
      return;
    }

    moveItemInArray(items, currentIndex, targetIndex);
    this.isSaving.set(true);
    const saved = await this.sharedLists.reorder(
      this.listId,
      items.map((candidate) => candidate.id),
    );
    this.isSaving.set(false);

    if (saved) {
      this.reorderAnnouncement.set(`${item.media.title} moved to position ${targetIndex + 1}.`);
    } else {
      await this.sharedLists.loadList(this.listId);
    }
  }

  protected async createInvite(): Promise<void> {
    if (!this.isOwner() || this.inviteForm.invalid || this.isInviting()) return;
    const value = this.inviteForm.getRawValue();
    this.isInviting.set(true);
    this.inviteFeedback.set(null);
    this.inviteError.set(null);
    const result = await this.sharedLists.createInvite(
      this.listId,
      value.username.trim(),
      value.role,
    );
    if (result) {
      this.invite.set({
        url: result.acceptUrl,
        expiresAt: result.expiresAt,
        target: result.target.displayUsername,
      });
      this.pendingInvites.update((invites) => [
        result,
        ...invites.filter((candidate) => candidate.target.id !== result.target.id),
      ]);
      this.inviteFeedback.set(`Invitation sent to @${result.target.displayUsername}.`);
    } else {
      this.inviteError.set(this.sharedLists.error() ?? 'The invitation could not be sent.');
    }
    this.isInviting.set(false);
  }

  protected async searchInvitePeople(): Promise<void> {
    const query = this.inviteForm.controls.username.value.trim();
    this.inviteFeedback.set(null);
    this.inviteError.set(null);
    if (query.length < 2) {
      this.inviteCandidates.set(this.inviteFriends());
      return;
    }

    this.isSearchingPeople.set(true);
    try {
      const friendIds = new Set(this.inviteFriends().map((friend) => friend.id));
      const candidates = await this.usersService.search(query, 8);
      this.inviteCandidates.set(
        [...candidates].sort(
          (left, right) => Number(friendIds.has(right.id)) - Number(friendIds.has(left.id)),
        ),
      );
    } catch {
      this.inviteCandidates.set([]);
      this.inviteError.set('People search is unavailable right now.');
    } finally {
      this.isSearchingPeople.set(false);
    }
  }

  protected selectInviteCandidate(candidate: PublicUserProfile): void {
    if (this.isListMember(candidate.id)) return;
    this.inviteForm.controls.username.setValue(candidate.username);
    this.inviteFeedback.set(`Selected @${candidate.displayUsername}.`);
  }

  protected isFriend(candidate: PublicUserProfile): boolean {
    return this.inviteFriends().some((friend) => friend.id === candidate.id);
  }

  protected isListMember(userId: string): boolean {
    return this.list()?.members.some((member) => member.user.id === userId) ?? false;
  }

  protected async revokeInvite(invite: SharedListPendingInvite): Promise<void> {
    if (this.pendingInviteRevokeId() !== invite.id) {
      this.pendingInviteRevokeId.set(invite.id);
      return;
    }

    this.activeInviteId.set(invite.id);
    this.inviteFeedback.set(null);
    this.inviteError.set(null);
    const revoked = await this.sharedLists.revokeInvite(this.listId, invite.id);
    if (revoked) {
      this.pendingInvites.update((invites) =>
        invites.filter((candidate) => candidate.id !== invite.id),
      );
      if (this.invite()?.target === invite.target.displayUsername) {
        this.invite.set(null);
      }
      this.inviteFeedback.set(`Invitation for @${invite.target.displayUsername} revoked.`);
      this.pendingInviteRevokeId.set(null);
    } else {
      this.inviteError.set(this.sharedLists.error() ?? 'The invitation could not be revoked.');
    }
    this.activeInviteId.set(null);
  }

  protected cancelInviteRevoke(): void {
    this.pendingInviteRevokeId.set(null);
  }

  protected async updateMember(member: SharedListMember, event: Event): Promise<void> {
    const role = (event.target as HTMLSelectElement).value as Exclude<SharedListRole, 'owner'>;
    if (!this.isOwner() || role === member.role || this.activeMemberId() !== null) return;
    this.activeMemberId.set(member.user.id);
    await this.sharedLists.updateMember(this.listId, member.user.id, role);
    this.activeMemberId.set(null);
  }

  protected async removeMember(member: SharedListMember): Promise<void> {
    if (!this.isOwner() || this.activeMemberId() !== null) return;
    if (this.pendingMemberRemovalId() !== member.user.id) {
      this.pendingMemberRemovalId.set(member.user.id);
      return;
    }
    this.activeMemberId.set(member.user.id);
    if (await this.sharedLists.removeMember(this.listId, member.user.id)) {
      this.pendingMemberRemovalId.set(null);
    }
    this.activeMemberId.set(null);
  }

  protected async copyInvite(): Promise<void> {
    const url = this.invite()?.url;
    if (!url) return;
    await navigator.clipboard.writeText(url);
    this.copied.set(true);
  }

  protected async copyPublicLink(): Promise<void> {
    const url = this.publicUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    this.publicLinkCopied.set(true);
  }

  protected async deleteList(): Promise<void> {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    if (await this.sharedLists.delete(this.listId)) {
      await this.router.navigate(['/lists']);
      return;
    }
    this.isSaving.set(false);
  }

  private async load(): Promise<void> {
    const [loaded] = await Promise.all([
      this.sharedLists.loadList(this.listId),
      this.library.load(),
    ]);
    const list = this.list();
    if (loaded && list?.role === 'owner') {
      this.settingsForm.setValue({
        title: list.title,
        description: list.description ?? '',
        visibility: list.visibility,
      });
      await this.loadInvitationWorkspace();
    }
  }

  private async loadInvitationWorkspace(): Promise<void> {
    this.inviteError.set(null);
    const [friendships, invites] = await Promise.all([
      this.friendsService.list().catch(() => null),
      this.sharedLists.listInvites(this.listId),
    ]);
    const friends = friendships?.friends.map((friendship) => friendship.user) ?? [];
    this.inviteFriends.set(friends);
    this.inviteCandidates.set(friends);
    if (invites) {
      this.pendingInvites.set(invites);
    } else {
      this.inviteError.set(this.sharedLists.error() ?? 'Pending invitations could not be loaded.');
    }
  }
}
