import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

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

  beforeEach(async () => {
    search.mockClear();
    await TestBed.configureTestingModule({
      imports: [PeopleSearchPage],
      providers: [
        provideRouter([]),
        {
          provide: UsersService,
          useValue: { search },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PeopleSearchPage);
    fixture.detectChanges();
  });

  it('searches by username and links to the matching profile', async () => {
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

    expect(search).toHaveBeenCalledWith('dah');
    const result = element.querySelector(
      '.people-card',
    ) as HTMLAnchorElement | null;
    expect(result?.textContent).toContain('Dahyun Fan');
    expect(result?.getAttribute('href')).toBe('/users/dahyun.fan');
  });
});
