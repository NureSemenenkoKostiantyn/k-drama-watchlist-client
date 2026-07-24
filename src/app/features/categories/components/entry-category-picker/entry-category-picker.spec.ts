import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { LibraryService } from '../../../library/data-access/library.service';
import { LibraryEntry } from '../../../library/models/library';
import { Category } from '../../models/category';
import { EntryCategoryPicker } from './entry-category-picker';

describe('EntryCategoryPicker', () => {
  const entry: LibraryEntry = {
    id: 'entry-1',
    mediaId: 'media-1',
    status: 'to_watch',
    categoryIds: [],
    media: {
      id: 'tv:1',
      tmdbId: 1,
      mediaType: 'tv',
      title: 'Goblin',
      originalTitle: 'Goblin',
      originCountry: ['KR'],
      genreIds: [18],
    },
    createdAt: '2026-07-24T10:00:00.000Z',
    updatedAt: '2026-07-24T10:00:00.000Z',
  };
  const category: Category = {
    id: 'category-1',
    name: 'Comfort drama',
    slug: 'comfort-drama',
    createdAt: '2026-07-24T10:00:00.000Z',
    updatedAt: '2026-07-24T10:00:00.000Z',
  };

  it('saves the selected category IDs on the personal entry', async () => {
    const updateCategories = vi.fn().mockResolvedValue({
      ...entry,
      categoryIds: [category.id],
    });
    await TestBed.configureTestingModule({
      imports: [EntryCategoryPicker],
      providers: [
        {
          provide: LibraryService,
          useValue: { updateCategories },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntryCategoryPicker);
    fixture.componentRef.setInput('entry', entry);
    fixture.componentRef.setInput('categories', [category]);
    fixture.detectChanges();
    const checkbox = fixture.nativeElement.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    const saveButton = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;

    checkbox.click();
    fixture.detectChanges();
    saveButton.click();
    await fixture.whenStable();

    expect(updateCategories).toHaveBeenCalledWith('entry-1', [
      'category-1',
    ]);
  });
});
