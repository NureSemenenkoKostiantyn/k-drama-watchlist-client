import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AddTierItems,
  CreateTierList,
  PublicTierList,
  RemoveTierItem,
  TierLayout,
  TierList,
  TierListSummary,
  UpdateTierList,
} from '../models/tier-list';

@Injectable({ providedIn: 'root' })
export class TierListsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/tier-lists`;

  list() {
    return firstValueFrom(this.http.get<TierListSummary[]>(this.url));
  }
  get(id: string) {
    return firstValueFrom(this.http.get<TierList>(`${this.url}/${id}`));
  }
  create(input: CreateTierList) {
    return firstValueFrom(this.http.post<TierList>(this.url, input));
  }
  update(id: string, input: UpdateTierList) {
    return firstValueFrom(this.http.patch<TierList>(`${this.url}/${id}`, input));
  }
  layout(id: string, input: TierLayout) {
    return firstValueFrom(this.http.patch<TierList>(`${this.url}/${id}/layout`, input));
  }
  add(id: string, input: AddTierItems) {
    return firstValueFrom(this.http.post<TierList>(`${this.url}/${id}/items`, input));
  }
  remove(id: string, input: RemoveTierItem) {
    return firstValueFrom(this.http.post<TierList>(`${this.url}/${id}/remove-item`, input));
  }
  duplicate(id: string, revision: number) {
    return firstValueFrom(this.http.post<TierList>(`${this.url}/${id}/duplicate`, { revision }));
  }
  delete(id: string, revision: number) {
    return firstValueFrom(this.http.delete<void>(`${this.url}/${id}`, { params: { revision } }));
  }
  getPublic(slug: string) {
    return firstValueFrom(
      this.http.get<PublicTierList>(
        `${environment.apiBaseUrl}/public/tier-lists/${encodeURIComponent(slug)}`,
      ),
    );
  }
}
