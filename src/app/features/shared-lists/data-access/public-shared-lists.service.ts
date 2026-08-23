import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../core/api/api-error';
import { environment } from '../../../../environments/environment';
import { PublicSharedListDetails } from '../models/shared-list';

@Injectable({ providedIn: 'root' })
export class PublicSharedListsService {
  private readonly http = inject(HttpClient);

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
