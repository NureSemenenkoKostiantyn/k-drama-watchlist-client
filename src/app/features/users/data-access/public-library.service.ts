import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  PublicLibraryFilters,
  PublicLibraryResponse,
} from '../models/public-library';

@Injectable({ providedIn: 'root' })
export class PublicLibraryService {
  private readonly http = inject(HttpClient);

  get(
    userId: string,
    filters: PublicLibraryFilters,
  ): Promise<PublicLibraryResponse> {
    let params = new HttpParams()
      .set('page', filters.page)
      .set('limit', filters.limit ?? 24);

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    if (filters.mediaType) {
      params = params.set('mediaType', filters.mediaType);
    }

    if (filters.minRating !== undefined) {
      params = params.set('minRating', filters.minRating);
    }

    if (filters.genreId !== undefined) {
      params = params.set('genreId', filters.genreId);
    }

    if (filters.country) {
      params = params.set('country', filters.country);
    }

    if (filters.yearFrom !== undefined) {
      params = params.set('yearFrom', filters.yearFrom);
    }

    if (filters.yearTo !== undefined) {
      params = params.set('yearTo', filters.yearTo);
    }

    if (filters.sort) {
      params = params.set('sort', filters.sort);
    }

    return firstValueFrom(
      this.http.get<PublicLibraryResponse>(
        `${environment.apiBaseUrl}/users/${userId}/library`,
        { params },
      ),
    );
  }
}
