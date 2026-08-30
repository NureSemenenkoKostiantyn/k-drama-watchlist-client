import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { Pagination } from './pagination';

describe('Pagination', () => {
  it('emits the requested adjacent page', async () => {
    await TestBed.configureTestingModule({ imports: [Pagination] }).compileComponents();
    const fixture = TestBed.createComponent(Pagination);
    const pageChange = vi.fn();
    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('totalPages', 4);
    fixture.componentInstance.pageChange.subscribe(pageChange);
    fixture.detectChanges();

    (fixture.nativeElement.querySelectorAll('button')[1] as HTMLButtonElement).click();
    expect(pageChange).toHaveBeenCalledWith(3);
  });
});
