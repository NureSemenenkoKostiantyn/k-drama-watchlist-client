import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../core/api/api-error';
import { TimedRequestCache } from '../../../core/cache/timed-request-cache';
import { environment } from '../../../../environments/environment';
import {
  PublicSharedListDetails,
  PublicSharedListDiscovery,
} from '../models/shared-list';

@Injectable({ providedIn: 'root' })
export class PublicSharedListsService {
  private readonly http = inject(HttpClient);
  private readonly discoveryCache = new TimedRequestCache<PublicSharedListDiscovery>(
    60_000,
    10,
  );

  async discover(page = 1, limit = 12): Promise<PublicSharedListDiscovery> {
    try {
      return await this.discoveryCache.get(`${page}:${limit}`, () =>
        firstValueFrom(
          this.http.get<PublicSharedListDiscovery>(
            `${environment.apiBaseUrl}/public/lists`,
            { params: { page, limit } },
          ),
        ),
      );
    } catch (error: unknown) {
      throw new Error(
        readApiErrorMessage(error, 'Public watchlists could not be loaded.'),
      );
    }
  }

  async get(publicSlug: string): Promise<PublicSharedListDetails> {
    try {
      return await firstValueFrom(
        this.http.get<PublicSharedListDetails>(
          `${environment.apiBaseUrl}/public/lists/${publicSlug}`,
        ),
      );
    } catch (error: unknown) {
      throw new Error(
        readApiErrorMessage(error, 'This shared list is unavailable.'),
      );
    }
  }
}
