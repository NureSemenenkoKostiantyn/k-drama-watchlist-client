import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { FilterPanel } from './filter-panel';

describe('FilterPanel', () => {
  it('requests expansion from its responsive toggle', async () => {
    await TestBed.configureTestingModule({ imports: [FilterPanel] }).compileComponents();
    const fixture = TestBed.createComponent(FilterPanel);
    const expandedChange = vi.fn();
    fixture.componentRef.setInput('panelId', 'filters');
    fixture.componentRef.setInput('collapsible', true);
    fixture.componentRef.setInput('expanded', false);
    fixture.componentInstance.expandedChange.subscribe(expandedChange);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(expandedChange).toHaveBeenCalledWith(true);
  });
});
