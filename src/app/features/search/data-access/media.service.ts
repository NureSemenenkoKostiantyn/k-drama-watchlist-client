import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { MediaDetails, MediaSearchRequest, MediaSearchResponse, MediaType } from '../models/media';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);

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
    return this.http.get<MediaDetails>(`${environment.apiBaseUrl}/media/${mediaType}/${tmdbId}`);
  }
}
