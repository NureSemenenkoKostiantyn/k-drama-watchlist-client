import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { SaveCommentRequest, SharedListComment } from '../models/comment';

@Injectable({ providedIn: 'root' })
export class SharedListCommentsService {
  private readonly http = inject(HttpClient);

  list(listId: string, itemId: string): Promise<SharedListComment[]> {
    return firstValueFrom(
      this.http.get<SharedListComment[]>(this.itemUrl(listId, itemId)),
    );
  }

  create(
    listId: string,
    itemId: string,
    input: SaveCommentRequest,
  ): Promise<SharedListComment> {
    return firstValueFrom(
      this.http.post<SharedListComment>(this.itemUrl(listId, itemId), input),
    );
  }

  update(
    commentId: string,
    input: Pick<SaveCommentRequest, 'body' | 'hasSpoiler'>,
  ): Promise<SharedListComment> {
    return firstValueFrom(
      this.http.patch<SharedListComment>(
        `${environment.apiBaseUrl}/comments/${commentId}`,
        input,
      ),
    );
  }

  delete(commentId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${environment.apiBaseUrl}/comments/${commentId}`),
    );
  }

  private itemUrl(listId: string, itemId: string): string {
    return `${environment.apiBaseUrl}/lists/${listId}/items/${itemId}/comments`;
  }
}
