import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Suggestion } from '../models/suggestion';
import { SuggestionsService } from './suggestions.service';

describe('SuggestionsService', () => {
  let service: SuggestionsService;
  let http: HttpTestingController;
  const suggestion = {
    id: 'suggestion-1',
    status: 'pending',
    direction: 'sent',
  } as Suggestion;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SuggestionsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lists received and sent suggestions', async () => {
    const result = service.list();
    const request = http.expectOne('/api/suggestions');

    expect(request.request.method).toBe('GET');
    request.flush({ received: [], sent: [suggestion] });
    await expect(result).resolves.toEqual({
      received: [],
      sent: [suggestion],
    });
  });

  it('creates and responds to suggestions', async () => {
    const created = service.create({
      username: 'dahyun_fan',
      mediaType: 'tv',
      tmdbId: 1,
      message: 'Watch this',
    });
    const createRequest = http.expectOne('/api/suggestions');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({
      username: 'dahyun_fan',
      mediaType: 'tv',
      tmdbId: 1,
      message: 'Watch this',
    });
    createRequest.flush(suggestion);
    await expect(created).resolves.toEqual(suggestion);

    const accepted = service.accept('suggestion-1');
    const acceptRequest = http.expectOne(
      '/api/suggestions/suggestion-1/accept',
    );
    expect(acceptRequest.request.method).toBe('POST');
    acceptRequest.flush({ ...suggestion, status: 'accepted' });
    await expect(accepted).resolves.toMatchObject({
      status: 'accepted',
    });

    const dismissed = service.dismiss('suggestion-2');
    const dismissRequest = http.expectOne(
      '/api/suggestions/suggestion-2/dismiss',
    );
    expect(dismissRequest.request.method).toBe('POST');
    dismissRequest.flush({ ...suggestion, status: 'dismissed' });
    await expect(dismissed).resolves.toMatchObject({
      status: 'dismissed',
    });
  });
});
