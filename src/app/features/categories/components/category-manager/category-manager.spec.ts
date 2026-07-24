import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { LibraryService } from '../../../library/data-access/library.service';
import { CategoriesService } from '../../data-access/categories.service';
import { CategoryManager } from './category-manager';

describe('CategoryManager', () => {
  it('creates a trimmed category from the management form', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'category-1',
      name: 'Comfort drama',
      slug: 'comfort-drama',
    });
    await TestBed.configureTestingModule({
      imports: [CategoryManager],
      providers: [
        {
          provide: CategoriesService,
          useValue: {
            categories: signal([]).asReadonly(),
            error: signal<string | null>(null).asReadonly(),
            create,
            update: vi.fn(),
            delete: vi.fn(),
            clearError: vi.fn(),
          },
        },
        {
          provide: LibraryService,
          useValue: {
            removeCategoryReference: vi.fn(),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CategoryManager);
    fixture.detectChanges();
    const nameInput = fixture.nativeElement.querySelector(
      '[formControlName="name"]',
    ) as HTMLInputElement;
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    nameInput.value = '  Comfort drama  ';
    nameInput.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(create).toHaveBeenCalledWith({
      name: 'Comfort drama',
    });
  });
});
