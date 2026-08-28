import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { readApiErrorMessage } from '../../../core/api/api-error';
import { StatisticsOverview, StatisticsStatus } from '../models/statistics';

const DEFAULT_STATUSES: StatisticsStatus[] = ['watching', 'watched'];

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private readonly http = inject(HttpClient);

  async getOverview(statuses: StatisticsStatus[] = DEFAULT_STATUSES): Promise<StatisticsOverview> {
    try {
      return await firstValueFrom(
        this.http.get<StatisticsOverview>(`${environment.apiBaseUrl}/statistics`, {
          params: new HttpParams().set('statuses', statuses.join(',')),
        }),
      );
    } catch (error: unknown) {
      throw new Error(readApiErrorMessage(error, 'Your statistics could not be loaded.'));
    }
  }
}
