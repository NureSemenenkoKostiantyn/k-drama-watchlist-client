import { TestBed } from '@angular/core/testing';

import { PageState } from './page-state';

describe('PageState', () => {
  it('uses alert semantics for errors', async () => {
    await TestBed.configureTestingModule({ imports: [PageState] }).compileComponents();
    const fixture = TestBed.createComponent(PageState);
    fixture.componentRef.setInput('variant', 'error');
    fixture.componentRef.setInput('message', 'Could not load.');
    fixture.detectChanges();

    expect(fixture.nativeElement.getAttribute('role')).toBe('alert');
    expect(fixture.nativeElement.textContent).toContain('Could not load.');
  });
});
