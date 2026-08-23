import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { readApiErrorMessage } from '../../../core/api/api-error';
import { StatisticsOverview } from '../models/statistics';

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private readonly http = inject(HttpClient);

  async getOverview(): Promise<StatisticsOverview> {
    try {
      return await firstValueFrom(
        this.http.get<StatisticsOverview>(`${environment.apiBaseUrl}/statistics`),
      );
    } catch (error: unknown) {
      throw new Error(readApiErrorMessage(error, 'Your statistics could not be loaded.'));
    }
  }
}
