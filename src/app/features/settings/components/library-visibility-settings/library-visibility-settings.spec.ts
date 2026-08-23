import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SettingsService } from '../../data-access/settings.service';
import { LibraryVisibilitySettingsComponent } from './library-visibility-settings';

describe('LibraryVisibilitySettingsComponent', () => {
  const updateLibraryVisibility = vi.fn().mockResolvedValue({
    libraryVisibility: 'public',
  });

  beforeEach(async () => {
    updateLibraryVisibility.mockClear();
    await TestBed.configureTestingModule({
      imports: [LibraryVisibilitySettingsComponent],
      providers: [
        {
          provide: SettingsService,
          useValue: {
            isLoading: signal(false).asReadonly(),
            error: signal<string | null>(null).asReadonly(),
            load: vi.fn().mockResolvedValue({
              libraryVisibility: 'friends',
            }),
            updateLibraryVisibility,
          },
        },
      ],
    }).compileComponents();
  });

  it('loads and saves the owner visibility setting', async () => {
    const fixture = TestBed.createComponent(
      LibraryVisibilitySettingsComponent,
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const publicOption = fixture.debugElement.query(
      By.css('input[value="public"]'),
    ).nativeElement as HTMLInputElement;
    publicOption.checked = true;
    publicOption.dispatchEvent(new Event('change', { bubbles: true }));
    const form = fixture.debugElement.query(By.css('form'))
      .nativeElement as HTMLFormElement;
    const submitEvent = new Event('submit', {
      bubbles: true,
      cancelable: true,
    });
    form.dispatchEvent(submitEvent);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(updateLibraryVisibility).toHaveBeenCalledWith('public');
    expect(fixture.nativeElement.textContent).toContain(
      'Library visibility saved.',
    );
  });
});
