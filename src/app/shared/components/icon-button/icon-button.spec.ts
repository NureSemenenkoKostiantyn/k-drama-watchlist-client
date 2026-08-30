import { TestBed } from '@angular/core/testing';

import { IconButton } from './icon-button';

describe('IconButton', () => {
  it('requires an accessible label on its native button', async () => {
    await TestBed.configureTestingModule({ imports: [IconButton] }).compileComponents();
    const fixture = TestBed.createComponent(IconButton);
    fixture.componentRef.setInput('label', 'Manage categories');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')?.getAttribute('aria-label')).toBe(
      'Manage categories',
    );
  });
});
