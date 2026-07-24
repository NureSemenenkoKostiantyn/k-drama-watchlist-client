import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Category } from '../models/category';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let http: HttpTestingController;
  const category: Category = {
    id: 'category-1',
    name: 'Comfort drama',
    slug: 'comfort-drama',
    icon: 'heart',
    createdAt: '2026-07-24T10:00:00.000Z',
    updatedAt: '2026-07-24T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CategoriesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads and creates owner categories', async () => {
    const loadResult = service.load();
    const loadRequest = http.expectOne('/api/categories');
    expect(loadRequest.request.method).toBe('GET');
    loadRequest.flush([]);
    await expect(loadResult).resolves.toBe(true);

    const createResult = service.create({
      name: 'Comfort drama',
      icon: 'heart',
    });
    const createRequest = http.expectOne('/api/categories');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({
      name: 'Comfort drama',
      icon: 'heart',
    });
    createRequest.flush(category);

    await expect(createResult).resolves.toEqual(category);
    expect(service.categories()).toEqual([category]);
  });

  it('updates and deletes a category in local state', async () => {
    const loadResult = service.load();
    http.expectOne('/api/categories').flush([category]);
    await loadResult;

    const updated = {
      ...category,
      name: 'Comfort dramas',
      slug: 'comfort-dramas',
    };
    const updateResult = service.update(category.id, {
      name: updated.name,
    });
    const updateRequest = http.expectOne('/api/categories/category-1');
    expect(updateRequest.request.method).toBe('PATCH');
    updateRequest.flush(updated);
    await expect(updateResult).resolves.toEqual(updated);
    expect(service.categories()[0]?.name).toBe('Comfort dramas');

    const deleteResult = service.delete(category.id);
    const deleteRequest = http.expectOne('/api/categories/category-1');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);

    await expect(deleteResult).resolves.toBe(true);
    expect(service.categories()).toEqual([]);
  });
});
