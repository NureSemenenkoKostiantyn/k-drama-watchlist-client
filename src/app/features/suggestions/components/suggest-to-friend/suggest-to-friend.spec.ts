import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { FriendsService } from '../../../friends/data-access/friends.service';
import { SuggestionsService } from '../../data-access/suggestions.service';
import { SuggestToFriend } from './suggest-to-friend';

describe('SuggestToFriend', () => {
  let fixture: ComponentFixture<SuggestToFriend>;
  const create = vi.fn().mockResolvedValue({
    user: {
      displayUsername: 'Dahyun.Fan',
    },
  });

  beforeEach(async () => {
    create.mockClear();
    await TestBed.configureTestingModule({
      imports: [SuggestToFriend],
      providers: [
        provideRouter([]),
        {
          provide: FriendsService,
          useValue: {
            list: vi.fn().mockResolvedValue({
              friends: [
                {
                  id: 'friendship-1',
                  user: {
                    username: 'dahyun.fan',
                    displayUsername: 'Dahyun.Fan',
                    name: 'Dahyun Fan',
                  },
                },
              ],
              incomingRequests: [],
              outgoingRequests: [],
            }),
          },
        },
        {
          provide: SuggestionsService,
          useValue: { create },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SuggestToFriend);
    fixture.componentRef.setInput('media', {
      id: 'tv:1',
      tmdbId: 1,
      mediaType: 'tv',
      title: 'Goblin',
      originalTitle: 'Goblin',
      originCountry: ['KR'],
      genreIds: [18],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('sends the current title to an accepted friend', async () => {
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(create).toHaveBeenCalledWith({
      username: 'dahyun.fan',
      mediaType: 'tv',
      tmdbId: 1,
    });
    expect(root.textContent).toContain(
      'Goblin was suggested to @Dahyun.Fan.',
    );
  });
});
