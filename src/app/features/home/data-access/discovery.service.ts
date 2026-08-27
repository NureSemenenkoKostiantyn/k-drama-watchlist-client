import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, from, Observable } from 'rxjs';

import { TimedRequestCache } from '../../../core/cache/timed-request-cache';
import { environment } from '../../../../environments/environment';
import { DiscoveryHome } from '../models/discovery-home';

const HOME_CACHE_TTL_MS = 60 * 60 * 1_000;

@Injectable({ providedIn: 'root' })
export class DiscoveryService {
  private readonly http = inject(HttpClient);
  private readonly cache = new TimedRequestCache<DiscoveryHome>(
    HOME_CACHE_TTL_MS,
    1,
  );

  getHome(): Observable<DiscoveryHome> {
    return from(
      this.cache.get('home', () =>
        firstValueFrom(
          this.http.get<DiscoveryHome>(
            `${environment.apiBaseUrl}/discovery/home`,
          ),
        ),
      ),
    );
  }
}
