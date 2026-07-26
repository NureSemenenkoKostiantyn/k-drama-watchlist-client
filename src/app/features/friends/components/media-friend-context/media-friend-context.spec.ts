import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { FriendsService } from '../../data-access/friends.service';
import { MediaFriendContextComponent } from './media-friend-context';

describe('MediaFriendContextComponent', () => {
  const mediaContext = vi.fn().mockResolvedValue({
    friends: [
      {
        user: {
          id: 'user-2',
          username: 'dahyun',
          displayUsername: 'Dahyun',
          name: 'Kim Dahyun',
          joinedAt: '2026-07-20T10:00:00.000Z',
        },
        status: 'watching',
        rating: 8.5,
      },
      {
        user: {
          id: 'user-3',
          username: 'mina',
          displayUsername: 'Mina',
          name: 'Myoui Mina',
          joinedAt: '2026-07-21T10:00:00.000Z',
        },
        status: 'to_watch',
      },
    ],
  });

  beforeEach(async () => {
    mediaContext.mockClear();
    await TestBed.configureTestingModule({
      imports: [MediaFriendContextComponent],
      providers: [
        provideRouter([]),
        {
          provide: FriendsService,
          useValue: { mediaContext },
        },
      ],
    }).compileComponents();
  });

  it('shows accepted friend status, rating, and average', async () => {
    const fixture = TestBed.createComponent(
      MediaFriendContextComponent,
    );
    fixture.componentRef.setInput('mediaType', 'tv');
    fixture.componentRef.setInput('tmdbId', 1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(mediaContext).toHaveBeenCalledWith('tv', 1);
    expect(root.textContent).toContain('Dahyun');
    expect(root.textContent).toContain('Watching');
    expect(root.textContent).toContain('8.5 / 10');
    expect(root.textContent).toContain('Wants to watch');
    expect(root.querySelector('.friend-context__average')?.textContent).toContain(
      '8.5',
    );
  });
});
