import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SettingsService } from '../../data-access/settings.service';
import { LibraryVisibilitySettingsComponent } from './library-visibility-settings';

describe('LibraryVisibilitySettingsComponent', () => {
  const updateLibraryVisibility = vi.fn().mockResolvedValue({
    libraryVisibility: 'friends',
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
    fixture.debugElement
      .query(By.css('form'))
      .triggerEventHandler('ngSubmit');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(updateLibraryVisibility).toHaveBeenCalledWith('friends');
    expect(fixture.nativeElement.textContent).toContain(
      'Library visibility saved.',
    );
  });
});
