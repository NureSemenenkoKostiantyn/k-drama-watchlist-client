import { TestBed } from '@angular/core/testing';

import { UserAvatar } from './user-avatar';

describe('UserAvatar', () => {
  it('creates initials when an image is unavailable', async () => {
    await TestBed.configureTestingModule({ imports: [UserAvatar] }).compileComponents();
    const fixture = TestBed.createComponent(UserAvatar);
    fixture.componentRef.setInput('name', 'Demo Viewer');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('DV');
  });
});
