import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SegmentedControl } from './segmented-control';

describe('SegmentedControl', () => {
  it('emits a changed value and marks the active option', async () => {
    await TestBed.configureTestingModule({ imports: [SegmentedControl] }).compileComponents();
    const fixture = TestBed.createComponent(SegmentedControl);
    const valueChange = vi.fn();
    fixture.componentRef.setInput('label', 'View');
    fixture.componentRef.setInput('value', 'grid');
    fixture.componentRef.setInput('options', [
      { value: 'grid', label: 'Grid' },
      { value: 'list', label: 'List' },
    ]);
    fixture.componentInstance.valueChange.subscribe(valueChange);
    fixture.detectChanges();

    (fixture.nativeElement.querySelectorAll('button')[1] as HTMLButtonElement).click();
    expect(valueChange).toHaveBeenCalledWith('list');
    expect(fixture.nativeElement.querySelector('button')?.getAttribute('aria-pressed')).toBe('true');
  });
});
