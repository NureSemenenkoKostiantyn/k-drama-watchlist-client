import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CreateSuggestionRequest,
  Suggestion,
  SuggestionsOverview,
} from '../models/suggestion';

@Injectable({ providedIn: 'root' })
export class SuggestionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/suggestions`;

  list(): Promise<SuggestionsOverview> {
    return firstValueFrom(
      this.http.get<SuggestionsOverview>(this.baseUrl),
    );
  }

  create(input: CreateSuggestionRequest): Promise<Suggestion> {
    return firstValueFrom(
      this.http.post<Suggestion>(this.baseUrl, input),
    );
  }

  accept(suggestionId: string): Promise<Suggestion> {
    return firstValueFrom(
      this.http.post<Suggestion>(
        `${this.baseUrl}/${suggestionId}/accept`,
        {},
      ),
    );
  }

  dismiss(suggestionId: string): Promise<Suggestion> {
    return firstValueFrom(
      this.http.post<Suggestion>(
        `${this.baseUrl}/${suggestionId}/dismiss`,
        {},
      ),
    );
  }
}
