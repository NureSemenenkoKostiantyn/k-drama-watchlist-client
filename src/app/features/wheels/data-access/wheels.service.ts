import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../core/api/api-error';
import { environment } from '../../../../environments/environment';
import {
  AddWheelMemberRequest,
  CreateWheelRequest,
  UpdateWheelItemRequest,
  UpdateWheelRequest,
  Wheel,
  WheelDetails,
  WheelItem,
  WheelMember,
  WheelSpin,
  WheelSpinHistory,
} from '../models/wheel';

@Injectable({ providedIn: 'root' })
export class WheelsService {
  private readonly http = inject(HttpClient);
  private readonly wheelsState = signal<Wheel[]>([]);
  private readonly activeWheelState = signal<WheelDetails | null>(null);
  private readonly historyState = signal<WheelSpinHistory[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly wheels = this.wheelsState.asReadonly();
  readonly activeWheel = this.activeWheelState.asReadonly();
  readonly history = this.historyState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  async load(): Promise<boolean> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const wheels = await firstValueFrom(
        this.http.get<Wheel[]>(`${environment.apiBaseUrl}/wheels`),
      );
      this.wheelsState.set(wheels);
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Your wheels are unavailable right now.');
      return false;
    } finally {
      this.loadingState.set(false);
    }
  }

  async create(input: CreateWheelRequest): Promise<WheelDetails | null> {
    this.errorState.set(null);

    try {
      const wheel = await firstValueFrom(
        this.http.post<WheelDetails>(`${environment.apiBaseUrl}/wheels`, input),
      );
      this.wheelsState.update((wheels) => [toWheel(wheel), ...wheels]);
      return wheel;
    } catch (error: unknown) {
      this.setError(error, 'The wheel could not be created.');
      return null;
    }
  }

  async loadWheel(wheelId: string): Promise<boolean> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const wheel = await firstValueFrom(
        this.http.get<WheelDetails>(`${environment.apiBaseUrl}/wheels/${wheelId}`),
      );
      this.activeWheelState.set(wheel);
      this.syncSummary(wheel);
      return true;
    } catch (error: unknown) {
      this.activeWheelState.set(null);
      this.setError(error, 'The wheel is unavailable right now.');
      return false;
    } finally {
      this.loadingState.set(false);
    }
  }

  async update(
    wheelId: string,
    input: UpdateWheelRequest,
  ): Promise<WheelDetails | null> {
    this.errorState.set(null);

    try {
      const wheel = await firstValueFrom(
        this.http.patch<WheelDetails>(
          `${environment.apiBaseUrl}/wheels/${wheelId}`,
          input,
        ),
      );
      this.activeWheelState.set(wheel);
      this.syncSummary(wheel);
      return wheel;
    } catch (error: unknown) {
      this.setError(error, 'The wheel could not be updated.');
      return null;
    }
  }

  async delete(wheelId: string): Promise<boolean> {
    this.errorState.set(null);

    try {
      await firstValueFrom(
        this.http.delete<void>(`${environment.apiBaseUrl}/wheels/${wheelId}`),
      );
      this.wheelsState.update((wheels) =>
        wheels.filter((wheel) => wheel.id !== wheelId),
      );

      if (this.activeWheelState()?.id === wheelId) {
        this.activeWheelState.set(null);
        this.historyState.set([]);
      }

      return true;
    } catch (error: unknown) {
      this.setError(error, 'The wheel could not be deleted.');
      return false;
    }
  }

  async addMember(
    wheelId: string,
    input: AddWheelMemberRequest,
  ): Promise<WheelMember | null> {
    this.errorState.set(null);

    try {
      const member = await firstValueFrom(
        this.http.post<WheelMember>(
          `${environment.apiBaseUrl}/wheels/${wheelId}/members`,
          input,
        ),
      );
      this.updateActiveMembers(wheelId, (members) => [
        ...members,
        member,
      ]);
      return member;
    } catch (error: unknown) {
      this.setError(error, 'This friend could not be added to the wheel.');
      return null;
    }
  }

  async updateMember(
    wheelId: string,
    memberUserId: string,
    role: AddWheelMemberRequest['role'],
  ): Promise<WheelMember | null> {
    this.errorState.set(null);

    try {
      const member = await firstValueFrom(
        this.http.patch<WheelMember>(
          `${environment.apiBaseUrl}/wheels/${wheelId}/members/${memberUserId}`,
          { role },
        ),
      );
      this.updateActiveMembers(wheelId, (members) =>
        members.map((candidate) =>
          candidate.user.id === member.user.id ? member : candidate,
        ),
      );
      return member;
    } catch (error: unknown) {
      this.setError(error, 'The wheel member role could not be updated.');
      return null;
    }
  }

  async removeMember(
    wheelId: string,
    memberUserId: string,
  ): Promise<boolean> {
    this.errorState.set(null);

    try {
      await firstValueFrom(
        this.http.delete<void>(
          `${environment.apiBaseUrl}/wheels/${wheelId}/members/${memberUserId}`,
        ),
      );
      this.updateActiveMembers(wheelId, (members) =>
        members.filter((member) => member.user.id !== memberUserId),
      );
      return true;
    } catch (error: unknown) {
      this.setError(error, 'The friend could not be removed from this wheel.');
      return false;
    }
  }

  async addItem(
    wheelId: string,
    mediaId: string,
    weight = 1,
  ): Promise<WheelItem | null> {
    this.errorState.set(null);

    try {
      const item = await firstValueFrom(
        this.http.post<WheelItem>(
          `${environment.apiBaseUrl}/wheels/${wheelId}/items`,
          { mediaId, weight },
        ),
      );
      this.updateActiveItems(wheelId, (items) => [...items, item]);
      return item;
    } catch (error: unknown) {
      this.setError(error, 'The title could not be added to this wheel.');
      return null;
    }
  }

  async updateItem(
    wheelId: string,
    itemId: string,
    input: UpdateWheelItemRequest,
  ): Promise<WheelItem | null> {
    this.errorState.set(null);

    try {
      const item = await firstValueFrom(
        this.http.patch<WheelItem>(
          `${environment.apiBaseUrl}/wheels/${wheelId}/items/${itemId}`,
          input,
        ),
      );
      this.updateActiveItems(wheelId, (items) =>
        items.map((candidate) => (candidate.id === item.id ? item : candidate)),
      );
      return item;
    } catch (error: unknown) {
      this.setError(error, 'The wheel item could not be updated.');
      return null;
    }
  }

  async deleteItem(wheelId: string, itemId: string): Promise<boolean> {
    this.errorState.set(null);

    try {
      await firstValueFrom(
        this.http.delete<void>(
          `${environment.apiBaseUrl}/wheels/${wheelId}/items/${itemId}`,
        ),
      );
      this.updateActiveItems(wheelId, (items) =>
        items
          .filter((item) => item.id !== itemId)
          .map((item, position) => ({ ...item, position })),
      );
      this.historyState.update((history) =>
        history.filter((spin) => spin.selectedItem.wheelItemId !== itemId),
      );
      return true;
    } catch (error: unknown) {
      this.setError(error, 'The title could not be removed from this wheel.');
      return false;
    }
  }

  async reorderItems(wheelId: string, itemIds: string[]): Promise<boolean> {
    this.errorState.set(null);

    try {
      const items = await firstValueFrom(
        this.http.post<WheelItem[]>(
          `${environment.apiBaseUrl}/wheels/${wheelId}/reorder`,
          { itemIds },
        ),
      );
      this.updateActiveItems(wheelId, () => items);
      return true;
    } catch (error: unknown) {
      this.setError(error, 'The wheel order could not be saved.');
      return false;
    }
  }

  async spin(wheelId: string): Promise<WheelSpin | null> {
    this.errorState.set(null);

    try {
      const spin = await firstValueFrom(
        this.http.post<WheelSpin>(
          `${environment.apiBaseUrl}/wheels/${wheelId}/spin`,
          {},
        ),
      );
      this.updateActiveItems(wheelId, (items) =>
        items.map((item) =>
          item.id === spin.selectedItem.wheelItemId
            ? {
                ...item,
                lastSelectedAt: spin.createdAt,
                selectionCount: item.selectionCount + 1,
              }
            : item,
        ),
      );
      this.historyState.update((history) => [spin, ...history]);
      return spin;
    } catch (error: unknown) {
      this.setError(error, 'The wheel could not be spun.');
      return null;
    }
  }

  async loadHistory(wheelId: string): Promise<boolean> {
    this.errorState.set(null);

    try {
      const history = await firstValueFrom(
        this.http.get<WheelSpinHistory[]>(
          `${environment.apiBaseUrl}/wheels/${wheelId}/history`,
        ),
      );
      this.historyState.set(history);
      return true;
    } catch (error: unknown) {
      this.setError(error, 'The wheel history is unavailable.');
      return false;
    }
  }

  async resetHistory(wheelId: string): Promise<boolean> {
    this.errorState.set(null);

    try {
      await firstValueFrom(
        this.http.post<void>(
          `${environment.apiBaseUrl}/wheels/${wheelId}/reset-history`,
          {},
        ),
      );
      this.historyState.set([]);
      this.updateActiveItems(wheelId, (items) =>
        items.map((item) => {
          const resetItem = {
            ...item,
            selectionCount: 0,
          };
          delete resetItem.lastSelectedAt;
          return resetItem;
        }),
      );
      return true;
    } catch (error: unknown) {
      this.setError(error, 'The wheel history could not be reset.');
      return false;
    }
  }

  clearActiveWheel(): void {
    this.activeWheelState.set(null);
    this.historyState.set([]);
  }

  private updateActiveItems(
    wheelId: string,
    update: (items: WheelItem[]) => WheelItem[],
  ): void {
    this.activeWheelState.update((wheel) => {
      if (!wheel || wheel.id !== wheelId) {
        return wheel;
      }

      const items = update(wheel.items);
      const updated = {
        ...wheel,
        items,
        itemCount: items.length,
        enabledItemCount: items.filter((item) => item.isEnabled).length,
      };
      this.syncSummary(updated);
      return updated;
    });
  }

  private updateActiveMembers(
    wheelId: string,
    update: (members: WheelMember[]) => WheelMember[],
  ): void {
    this.activeWheelState.update((wheel) =>
      !wheel || wheel.id !== wheelId
        ? wheel
        : { ...wheel, members: update(wheel.members) },
    );
  }

  private syncSummary(wheel: WheelDetails): void {
    const summary = toWheel(wheel);
    this.wheelsState.update((wheels) => {
      const exists = wheels.some((candidate) => candidate.id === wheel.id);
      return exists
        ? wheels.map((candidate) => (candidate.id === wheel.id ? summary : candidate))
        : [summary, ...wheels];
    });
  }

  private setError(error: unknown, fallback: string): void {
    this.errorState.set(readApiErrorMessage(error, fallback));
  }
}

function toWheel(wheel: WheelDetails): Wheel {
  return {
    id: wheel.id,
    title: wheel.title,
    visibility: wheel.visibility,
    role: wheel.role,
    selectionMode: wheel.selectionMode,
    itemCount: wheel.itemCount,
    enabledItemCount: wheel.enabledItemCount,
    createdAt: wheel.createdAt,
    updatedAt: wheel.updatedAt,
    ...(wheel.description === undefined
      ? {}
      : { description: wheel.description }),
  };
}
