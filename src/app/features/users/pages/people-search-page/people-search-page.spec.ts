import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { FriendsService } from '../../../friends/data-access/friends.service';
import {
  Friendship,
  FriendshipsOverview,
} from '../../../friends/models/friendship';
import { UsersService } from '../../data-access/users.service';
import { PublicUserProfile } from '../../models/public-user-profile';
import { PeopleSearchPage } from './people-search-page';

describe('PeopleSearchPage', () => {
  let fixture: ComponentFixture<PeopleSearchPage>;
  const profile: PublicUserProfile = {
    id: 'user-1',
    username: 'dahyun.fan',
    displayUsername: 'Dahyun.Fan',
    name: 'Dahyun Fan',
    joinedAt: '2026-07-20T10:00:00.000Z',
  };
  const search = vi.fn().mockResolvedValue([profile]);
  const overview: FriendshipsOverview = {
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
  };
  const list = vi.fn().mockResolvedValue(overview);
  const request = vi.fn().mockImplementation(
    (username: string): Promise<Friendship> =>
      Promise.resolve({
        id: 'friendship-1',
        status: 'pending',
        direction: 'outgoing',
        user: { ...profile, username },
        createdAt: '2026-07-26T15:00:00.000Z',
      }),
  );

  beforeEach(async () => {
    search.mockClear();
    list.mockClear();
    request.mockClear();
    await TestBed.configureTestingModule({
      imports: [PeopleSearchPage],
      providers: [
        provideRouter([]),
        {
          provide: UsersService,
          useValue: { search },
        },
        {
          provide: FriendsService,
          useValue: {
            list,
            request,
            accept: vi.fn(),
            reject: vi.fn(),
            delete: vi.fn(),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PeopleSearchPage);
    fixture.detectChanges();
  });

  it('searches names and usernames and links to the matching profile', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector(
      '#people-query',
    ) as HTMLInputElement;
    input.value = 'Dahyun';
    input.dispatchEvent(new Event('input'));
    element
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));

    await fixture.whenStable();
    fixture.detectChanges();

    expect(search).toHaveBeenCalledWith('Dahyun');
    const result = element.querySelector<HTMLAnchorElement>(
      '.people-card__profile',
    );
    expect(result?.textContent).toContain('Dahyun Fan');
    expect(result?.getAttribute('href')).toBe('/users/user-1');
  });

  it('sends a request and renders its pending state', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector(
      '#people-query',
    ) as HTMLInputElement;
    input.value = 'dah';
    input.dispatchEvent(new Event('input'));
    element
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    const addButton = Array.from(
      element.querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Add friend'));
    addButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(request).toHaveBeenCalledWith('dahyun.fan');
    expect(element.textContent).toContain('Request sent');
  });
});
