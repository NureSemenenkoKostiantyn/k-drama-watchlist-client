import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../core/api/api-error';
import { environment } from '../../../../environments/environment';
import { PublicWheelDetails } from '../models/wheel';

@Injectable({ providedIn: 'root' })
export class PublicWheelsService {
  private readonly http = inject(HttpClient);

  async get(publicSlug: string): Promise<PublicWheelDetails> {
    try {
      return await firstValueFrom(
        this.http.get<PublicWheelDetails>(
          `${environment.apiBaseUrl}/public/wheels/${publicSlug}`,
        ),
      );
    } catch (error: unknown) {
      throw new Error(readApiErrorMessage(error, 'This wheel is unavailable.'));
    }
  }
}
