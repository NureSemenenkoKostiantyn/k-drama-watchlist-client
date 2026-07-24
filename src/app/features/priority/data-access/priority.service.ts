import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../core/api/api-error';
import { environment } from '../../../../environments/environment';
import {
  PriorityLane,
  PriorityLaneItemOrder,
} from '../models/priority';

@Injectable({ providedIn: 'root' })
export class PriorityService {
  private readonly http = inject(HttpClient);
  private readonly lanesState = signal<PriorityLane[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly lanes = this.lanesState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  async load(): Promise<boolean> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const lanes = await firstValueFrom(
        this.http.get<PriorityLane[]>(`${environment.apiBaseUrl}/priority-lanes`),
      );
      this.lanesState.set(lanes);
      return true;
    } catch (error: unknown) {
      this.errorState.set(
        readApiErrorMessage(error, 'Your priority board is unavailable right now.'),
      );
      return false;
    } finally {
      this.loadingState.set(false);
    }
  }

  async create(name: string): Promise<PriorityLane | null> {
    this.errorState.set(null);

    try {
      const lane = await firstValueFrom(
        this.http.post<PriorityLane>(`${environment.apiBaseUrl}/priority-lanes`, {
          name,
        }),
      );
      this.lanesState.update((lanes) => [...lanes, lane]);
      return lane;
    } catch (error: unknown) {
      this.errorState.set(
        readApiErrorMessage(error, 'The priority lane could not be created.'),
      );
      return null;
    }
  }

  async update(laneId: string, name: string): Promise<PriorityLane | null> {
    this.errorState.set(null);

    try {
      const lane = await firstValueFrom(
        this.http.patch<PriorityLane>(
          `${environment.apiBaseUrl}/priority-lanes/${laneId}`,
          { name },
        ),
      );
      this.lanesState.update((lanes) =>
        lanes.map((candidate) => (candidate.id === lane.id ? lane : candidate)),
      );
      return lane;
    } catch (error: unknown) {
      this.errorState.set(
        readApiErrorMessage(error, 'The priority lane could not be renamed.'),
      );
      return null;
    }
  }

  async delete(laneId: string): Promise<boolean> {
    this.errorState.set(null);

    try {
      await firstValueFrom(
        this.http.delete<void>(
          `${environment.apiBaseUrl}/priority-lanes/${laneId}`,
        ),
      );
      this.lanesState.update((lanes) =>
        lanes
          .filter((lane) => lane.id !== laneId)
          .map((lane, position) => ({ ...lane, position })),
      );
      return true;
    } catch (error: unknown) {
      this.errorState.set(
        readApiErrorMessage(error, 'The priority lane could not be deleted.'),
      );
      return false;
    }
  }

  async reorderLanes(laneIds: string[]): Promise<boolean> {
    this.errorState.set(null);

    try {
      const lanes = await firstValueFrom(
        this.http.post<PriorityLane[]>(
          `${environment.apiBaseUrl}/priority-lanes/reorder`,
          { laneIds },
        ),
      );
      this.lanesState.set(lanes);
      return true;
    } catch (error: unknown) {
      this.errorState.set(
        readApiErrorMessage(error, 'The lanes could not be reordered.'),
      );
      return false;
    }
  }

  async reorderItems(lanes: PriorityLaneItemOrder[]): Promise<boolean> {
    this.errorState.set(null);

    try {
      await firstValueFrom(
        this.http.post<void>(
          `${environment.apiBaseUrl}/priority-lanes/reorder-items`,
          { lanes },
        ),
      );
      return true;
    } catch (error: unknown) {
      this.errorState.set(
        readApiErrorMessage(error, 'The priority items could not be reordered.'),
      );
      return false;
    }
  }
}
