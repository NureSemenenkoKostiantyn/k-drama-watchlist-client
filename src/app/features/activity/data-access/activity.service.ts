import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../core/api/api-error';
import { environment } from '../../../../environments/environment';
import { ActivityFeed } from '../models/activity';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);

  async list(page = 1, limit = 20): Promise<ActivityFeed> {
    try {
      return await firstValueFrom(
        this.http.get<ActivityFeed>(`${environment.apiBaseUrl}/activity`, {
          params: { page, limit },
        }),
      );
    } catch (error: unknown) {
      throw new Error(readApiErrorMessage(error, 'Friend activity could not be loaded.'));
    }
  }
}
