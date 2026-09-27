import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TierListsService } from './tier-lists.service';

describe('TierListsService', () => {
  let api: TierListsService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TierListsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('submits the complete revision-bound layout in one request', async () => {
    const input = {
      revision: 3,
      tiers: [{ id: 's', label: 'S', color: 'red' as const, mediaIds: ['tv:1'] }],
      unrankedMediaIds: [],
    };
    const pending = api.layout('board', input);
    const request = http.expectOne('/api/tier-lists/board/layout');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(input);
    request.flush({ revision: 4 });
    expect((await pending).revision).toBe(4);
  });
  it('keeps deletion conditional on the displayed revision', async () => {
    const pending = api.delete('board', 7);
    const request = http.expectOne('/api/tier-lists/board?revision=7');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    await pending;
  });
  it('does not cache public links across a privacy change', async () => {
    for (let index = 0; index < 2; index++) {
      const pending = api.getPublic('abcdefghijklmnop');
      http.expectOne('/api/public/tier-lists/abcdefghijklmnop').flush({ title: 'Ranking' });
      await pending;
    }
  });
});
