import { TestBed } from '@angular/core/testing';

import { MediaPoster } from './media-poster';

describe('MediaPoster', () => {
  it('renders a labelled image or a consistent fallback', async () => {
    await TestBed.configureTestingModule({ imports: [MediaPoster] }).compileComponents();
    const fixture = TestBed.createComponent(MediaPoster);
    fixture.componentRef.setInput('title', 'Goblin');
    fixture.componentRef.setInput('posterUrl', '/goblin.jpg');
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('img') as HTMLImageElement).alt).toBe('Goblin poster');

    fixture.componentRef.setInput('posterUrl', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No poster');
  });
});
