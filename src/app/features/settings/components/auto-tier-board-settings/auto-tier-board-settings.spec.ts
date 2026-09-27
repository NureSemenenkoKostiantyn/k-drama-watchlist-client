import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SettingsService } from '../../data-access/settings.service';
import { AutoTierBoardSettingsComponent } from './auto-tier-board-settings';

describe('AutoTierBoardSettingsComponent', () => {
  it('loads the default All mode and saves Both on request', async () => {
    const settings = {
      libraryVisibility: 'private' as const,
      activityVisibility: 'private' as const,
      tierBoardMode: 'all' as const,
      telegramNotifications: { friendRequests: false, titleSuggestions: false },
    };
    const service = {
      load: vi.fn().mockResolvedValue(settings),
      updateTierBoardMode: vi.fn().mockResolvedValue({ ...settings, tierBoardMode: 'both' }),
      isLoading: signal(false),
      error: signal(null),
    };
    await TestBed.configureTestingModule({
      imports: [AutoTierBoardSettingsComponent],
      providers: [{ provide: SettingsService, useValue: service }],
    }).compileComponents();
    const fixture = TestBed.createComponent(AutoTierBoardSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector<HTMLInputElement>('input[value="all"]')?.checked).toBe(true);
    root.querySelector<HTMLInputElement>('input[value="both"]')!.click();
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    expect(service.updateTierBoardMode).toHaveBeenCalledWith('both');
    expect(root.textContent).toContain('Tier-list preference saved');
  });
});
