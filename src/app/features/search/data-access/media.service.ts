import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, from, Observable } from 'rxjs';

import { TimedRequestCache } from '../../../core/cache/timed-request-cache';
import { environment } from '../../../../environments/environment';
import { MediaDetails, MediaSearchRequest, MediaSearchResponse, MediaType } from '../models/media';

const MEDIA_DETAILS_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly detailsCache = new TimedRequestCache<MediaDetails>(
    MEDIA_DETAILS_CACHE_TTL_MS,
    100,
  );

  search(request: MediaSearchRequest): Observable<MediaSearchResponse> {
    let params = new HttpParams()
      .set('q', request.query)
      .set('type', request.type)
      .set('page', request.page);

    if (request.country) {
      params = params.set('country', request.country);
    }

    return this.http.get<MediaSearchResponse>(`${environment.apiBaseUrl}/search`, { params });
  }

  getDetails(mediaType: MediaType, tmdbId: number): Observable<MediaDetails> {
    const key = `${mediaType}:${tmdbId}`;
    return from(
      this.detailsCache.get(key, () =>
        firstValueFrom(
          this.http.get<MediaDetails>(
            `${environment.apiBaseUrl}/media/${mediaType}/${tmdbId}`,
          ),
        ),
      ),
    );
  }
}
