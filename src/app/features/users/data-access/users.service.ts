import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PublicUserProfile } from '../models/public-user-profile';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  getById(userId: string): Promise<PublicUserProfile> {
    return firstValueFrom(
      this.http.get<PublicUserProfile>(
        `${environment.apiBaseUrl}/users/${userId}`,
      ),
    );
  }

  search(query: string, limit = 10): Promise<PublicUserProfile[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('limit', limit);
    return firstValueFrom(
      this.http.get<PublicUserProfile[]>(
        `${environment.apiBaseUrl}/users/search`,
        { params },
      ),
    );
  }
}
