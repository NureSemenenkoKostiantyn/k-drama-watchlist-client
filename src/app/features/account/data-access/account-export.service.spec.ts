import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AccountExportService } from './account-export.service';

describe('AccountExportService', () => {
  let service: AccountExportService;
  let http: HttpTestingController;
  const createObjectURL = vi.fn(() => 'blob:account-export');
  const revokeObjectURL = vi.fn();
  const click = vi.fn();

  beforeEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    click.mockClear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const document = TestBed.inject(DOCUMENT);
    Object.defineProperty(document.defaultView?.URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(document.defaultView?.URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });
    vi.spyOn(document, 'createElement').mockReturnValue({
      click,
    } as unknown as HTMLAnchorElement);
    service = TestBed.inject(AccountExportService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('downloads the versioned JSON archive with a dated filename', async () => {
    const archive = {
      format: 'drama-watch-account-export' as const,
      version: 1 as const,
      exportedAt: '2026-08-27T12:00:00.000Z',
      account: { email: 'owner@example.com' },
      settings: {},
      categories: [],
      priorityLanes: [],
      library: [],
    };
    const result = service.download();
    http.expectOne('/api/account/export').flush(archive);

    await expect(result).resolves.toBe(true);
    const anchor = TestBed.inject(DOCUMENT).createElement(
      'a',
    ) as HTMLAnchorElement;
    expect(anchor.download).toBe('drama-watch-export-2026-08-27.json');
    expect(anchor.href).toBe('blob:account-export');
    expect(click).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:account-export');
    expect(service.notice()).toBe('Your data export has been downloaded.');
  });
});
