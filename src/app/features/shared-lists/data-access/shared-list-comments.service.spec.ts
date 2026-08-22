import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SharedListCommentsService } from './shared-list-comments.service';

describe('SharedListCommentsService', () => {
  let service: SharedListCommentsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SharedListCommentsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates a spoiler-marked reply for one shared item', async () => {
    const promise = service.create('list-1', 'item-1', {
      body: 'The ending changes everything.',
      hasSpoiler: true,
      parentCommentId: 'comment-1',
    });
    const request = http.expectOne('/api/lists/list-1/items/item-1/comments');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      body: 'The ending changes everything.',
      hasSpoiler: true,
      parentCommentId: 'comment-1',
    });
    request.flush({ id: 'reply-1' });
    await expect(promise).resolves.toEqual({ id: 'reply-1' });
  });

  it('uses the owner-scoped comment route for edits and soft deletion', async () => {
    const update = service.update('comment-1', { body: 'Updated', hasSpoiler: false });
    const patchRequest = http.expectOne('/api/comments/comment-1');
    expect(patchRequest.request.method).toBe('PATCH');
    patchRequest.flush({ id: 'comment-1', body: 'Updated' });
    await update;

    const deletion = service.delete('comment-1');
    const deleteRequest = http.expectOne('/api/comments/comment-1');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
    await expect(deletion).resolves.toBeNull();
  });
});
