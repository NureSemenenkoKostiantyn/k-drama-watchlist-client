import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  Friendship,
  FriendshipsOverview,
} from '../models/friendship';

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/friends`;

  list(): Promise<FriendshipsOverview> {
    return firstValueFrom(
      this.http.get<FriendshipsOverview>(this.baseUrl),
    );
  }

  request(username: string): Promise<Friendship> {
    return firstValueFrom(
      this.http.post<Friendship>(`${this.baseUrl}/request`, {
        username,
      }),
    );
  }

  accept(friendshipId: string): Promise<Friendship> {
    return firstValueFrom(
      this.http.post<Friendship>(
        `${this.baseUrl}/${friendshipId}/accept`,
        {},
      ),
    );
  }

  reject(friendshipId: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(
        `${this.baseUrl}/${friendshipId}/reject`,
        {},
      ),
    );
  }

  delete(friendshipId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/${friendshipId}`),
    );
  }
}
