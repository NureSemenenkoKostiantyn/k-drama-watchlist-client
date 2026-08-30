import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PublicUserLink } from './public-user-link';

describe('PublicUserLink', () => {
  it('links a public username to the profile route', async () => {
    await TestBed.configureTestingModule({
      imports: [PublicUserLink],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(PublicUserLink);
    fixture.componentRef.setInput('userId', 'user-1');
    fixture.componentRef.setInput('username', 'demo_viewer');
    fixture.componentRef.setInput('name', 'Demo Viewer');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('a')?.getAttribute('href')).toBe('/users/user-1');
    expect(fixture.nativeElement.textContent).toContain('@demo_viewer');
  });
});
