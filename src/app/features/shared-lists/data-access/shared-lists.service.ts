import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import { readApiErrorMessage } from '../../../core/api/api-error';
import { environment } from '../../../../environments/environment';
import {
  SharedList,
  SharedListDetails,
  SharedListInvite,
  SharedListPendingInvite,
  SharedListItem,
  SharedListMember,
  SharedListRole,
  SharedListVisibility,
  UpdateSharedListItemRequest,
} from '../models/shared-list';

@Injectable({ providedIn: 'root' })
export class SharedListsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/lists`;
  private readonly listsState = signal<SharedList[]>([]);
  private readonly activeListState = signal<SharedListDetails | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly lists = this.listsState.asReadonly();
  readonly activeList = this.activeListState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  async load(): Promise<boolean> {
    this.loadingState.set(true);
    this.errorState.set(null);
    try {
      this.listsState.set(await firstValueFrom(this.http.get<SharedList[]>(this.baseUrl)));
      return true;
    } catch (error: unknown) {
      return this.fail(error, 'Your shared lists are unavailable right now.');
    } finally {
      this.loadingState.set(false);
    }
  }

  async create(title: string, description?: string): Promise<SharedListDetails | null> {
    return this.request(
      this.http.post<SharedListDetails>(this.baseUrl, {
        title,
        ...(description ? { description } : {}),
      }),
      'The shared list could not be created.',
      (list) => this.sync(list),
    );
  }

  async loadList(listId: string): Promise<boolean> {
    this.loadingState.set(true);
    this.errorState.set(null);
    try {
      const list = await firstValueFrom(
        this.http.get<SharedListDetails>(`${this.baseUrl}/${listId}`),
      );
      this.activeListState.set(list);
      this.sync(list);
      return true;
    } catch (error: unknown) {
      this.activeListState.set(null);
      return this.fail(error, 'This shared list is unavailable.');
    } finally {
      this.loadingState.set(false);
    }
  }

  update(
    listId: string,
    input: {
      title?: string;
      description?: string | null;
      visibility?: SharedListVisibility;
    },
  ): Promise<SharedListDetails | null> {
    return this.request(
      this.http.patch<SharedListDetails>(`${this.baseUrl}/${listId}`, input),
      'The shared-list details could not be saved.',
      (list) => {
        this.activeListState.set(list);
        this.sync(list);
      },
    );
  }

  async delete(listId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${listId}`));
      this.listsState.update((lists) => lists.filter((list) => list.id !== listId));
      this.activeListState.set(null);
      return true;
    } catch (error: unknown) {
      return this.fail(error, 'The shared list could not be deleted.');
    }
  }

  createInvite(
    listId: string,
    username: string,
    role: Exclude<SharedListRole, 'owner'>,
  ): Promise<SharedListInvite | null> {
    return this.request(
      this.http.post<SharedListInvite>(`${this.baseUrl}/${listId}/invites`, { username, role }),
      'The invitation link could not be created.',
    );
  }

  async listInvites(listId: string): Promise<SharedListPendingInvite[] | null> {
    return this.request(
      this.http.get<SharedListPendingInvite[]>(`${this.baseUrl}/${listId}/invites`),
      'Pending invitations could not be loaded.',
    );
  }

  async revokeInvite(listId: string, inviteId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${listId}/invites/${inviteId}`));
      this.errorState.set(null);
      return true;
    } catch (error: unknown) {
      return this.fail(error, 'The invitation could not be revoked.');
    }
  }

  async acceptInvite(token: string): Promise<SharedListDetails | null> {
    return this.request(
      this.http.post<SharedListDetails>(
        `${environment.apiBaseUrl}/list-invites/${token}/accept`,
        {},
      ),
      'This invitation is invalid, expired, or already used.',
      (list) => {
        this.activeListState.set(list);
        this.sync(list);
      },
    );
  }

  async updateMember(
    listId: string,
    memberUserId: string,
    role: Exclude<SharedListRole, 'owner'>,
  ): Promise<SharedListMember | null> {
    const member = await this.request(
      this.http.patch<SharedListMember>(`${this.baseUrl}/${listId}/members/${memberUserId}`, {
        role,
      }),
      'The member role could not be changed.',
    );
    if (member) {
      this.updateMembers(listId, (members) =>
        members.map((candidate) => (candidate.user.id === member.user.id ? member : candidate)),
      );
    }
    return member;
  }

  async removeMember(listId: string, memberUserId: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.delete<void>(`${this.baseUrl}/${listId}/members/${memberUserId}`),
      );
      this.updateMembers(listId, (members) =>
        members.filter((member) => member.user.id !== memberUserId),
      );
      return true;
    } catch (error: unknown) {
      return this.fail(error, 'The member could not be removed from this list.');
    }
  }

  addItem(listId: string, mediaId: string): Promise<SharedListItem | null> {
    return this.itemRequest(
      listId,
      this.http.post<SharedListItem>(`${this.baseUrl}/${listId}/items`, { mediaId }),
      'The title could not be added to this list.',
      (items, item) => [...items, item],
    );
  }

  updateItem(
    listId: string,
    itemId: string,
    input: UpdateSharedListItemRequest,
  ): Promise<SharedListItem | null> {
    return this.itemRequest(
      listId,
      this.http.patch<SharedListItem>(`${this.baseUrl}/${listId}/items/${itemId}`, input),
      'The shared title could not be updated.',
      (items, item) => items.map((candidate) => (candidate.id === item.id ? item : candidate)),
    );
  }

  async deleteItem(listId: string, itemId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${listId}/items/${itemId}`));
      this.updateItems(listId, (items) =>
        items.filter((item) => item.id !== itemId).map((item, position) => ({ ...item, position })),
      );
      return true;
    } catch (error: unknown) {
      return this.fail(error, 'The title could not be removed from this list.');
    }
  }

  async reorder(listId: string, itemIds: string[]): Promise<boolean> {
    try {
      const items = await firstValueFrom(
        this.http.post<SharedListItem[]>(`${this.baseUrl}/${listId}/reorder`, { itemIds }),
      );
      this.updateItems(listId, () => items);
      return true;
    } catch (error: unknown) {
      return this.fail(error, 'The shared-list order could not be saved.');
    }
  }

  clearActive(): void {
    this.activeListState.set(null);
    this.errorState.set(null);
  }

  private async itemRequest(
    listId: string,
    request: Observable<SharedListItem>,
    fallback: string,
    update: (items: SharedListItem[], item: SharedListItem) => SharedListItem[],
  ): Promise<SharedListItem | null> {
    const item = await this.request(request, fallback);
    if (item) {
      this.updateItems(listId, (items) => update(items, item));
    }
    return item;
  }

  private async request<T>(
    request: Observable<T>,
    fallback: string,
    success?: (value: T) => void,
  ): Promise<T | null> {
    this.errorState.set(null);
    try {
      const value = await firstValueFrom(request);
      success?.(value);
      return value;
    } catch (error: unknown) {
      this.fail(error, fallback);
      return null;
    }
  }

  private updateItems(listId: string, update: (items: SharedListItem[]) => SharedListItem[]): void {
    this.activeListState.update((list) => {
      if (!list || list.id !== listId) return list;
      const items = update(list.items);
      const next = { ...list, items, itemCount: items.length };
      this.sync(next);
      return next;
    });
  }

  private updateMembers(
    listId: string,
    update: (members: SharedListMember[]) => SharedListMember[],
  ): void {
    this.activeListState.update((list) =>
      !list || list.id !== listId ? list : { ...list, members: update(list.members) },
    );
  }

  private sync(details: SharedListDetails): void {
    const summary: SharedList = {
      id: details.id,
      title: details.title,
      visibility: details.visibility,
      role: details.role,
      itemCount: details.itemCount,
      createdAt: details.createdAt,
      updatedAt: details.updatedAt,
      ...(details.description ? { description: details.description } : {}),
    };
    this.listsState.update((lists) =>
      lists.some((list) => list.id === summary.id)
        ? lists.map((list) => (list.id === summary.id ? summary : list))
        : [summary, ...lists],
    );
  }

  private fail(error: unknown, fallback: string): false {
    this.errorState.set(readApiErrorMessage(error, fallback));
    return false;
  }
}
