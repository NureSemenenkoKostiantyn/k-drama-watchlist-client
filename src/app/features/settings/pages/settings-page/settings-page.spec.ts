import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AccountExportService } from '../../../account/data-access/account-export.service';
import { TelegramService } from '../../../telegram/data-access/telegram.service';
import { SettingsService } from '../../data-access/settings.service';
import { SettingsPage } from './settings-page';

describe('SettingsPage', () => {
  let fixture: ComponentFixture<SettingsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        {
          provide: SettingsService,
          useValue: {
            isLoading: signal(false).asReadonly(),
            error: signal(null).asReadonly(),
            load: vi.fn().mockResolvedValue({
              libraryVisibility: 'private',
              activityVisibility: 'private',
            }),
            updatePrivacy: vi.fn(),
          },
        },
        {
          provide: TelegramService,
          useValue: {
            connection: signal({ enabled: false, connected: false }).asReadonly(),
            isLoading: signal(false).asReadonly(),
            error: signal(null).asReadonly(),
            load: vi.fn().mockResolvedValue({ enabled: false, connected: false }),
            createLink: vi.fn(),
            disconnect: vi.fn(),
          },
        },
        {
          provide: AccountExportService,
          useValue: {
            isExporting: signal(false).asReadonly(),
            error: signal(null).asReadonly(),
            notice: signal(null).asReadonly(),
            download: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders privacy and account data settings on their own page', () => {
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Settings');
    expect(content).toContain('Privacy settings');
    expect(content).toContain('Telegram');
    expect(content).toContain('Download your data');
  });
});
