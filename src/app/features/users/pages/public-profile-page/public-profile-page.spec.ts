import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { UsersService } from '../../data-access/users.service';
import { PublicUserProfile } from '../../models/public-user-profile';
import { PublicProfilePage } from './public-profile-page';

describe('PublicProfilePage', () => {
  let fixture: ComponentFixture<PublicProfilePage>;
  const profile: PublicUserProfile = {
    id: 'user-1',
    username: 'dahyun.fan',
    displayUsername: 'Dahyun.Fan',
    name: 'Dahyun Fan',
    joinedAt: '2026-07-20T10:00:00.000Z',
  };
  const getByUsername = vi.fn().mockResolvedValue(profile);

  beforeEach(async () => {
    getByUsername.mockClear();
    await TestBed.configureTestingModule({
      imports: [PublicProfilePage],
      providers: [
        provideRouter([
          { path: 'users/:username', component: PublicProfilePage },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(
              convertToParamMap({ username: 'dahyun.fan' }),
            ),
          },
        },
        {
          provide: AuthenticationService,
          useValue: {
            session: signal({
              user: {
                id: 'current-user',
                username: 'current_user',
              },
            }).asReadonly(),
          },
        },
        {
          provide: UsersService,
          useValue: { getByUsername },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicProfilePage);
    fixture.detectChanges();
  });

  it('loads and renders the route username without private data', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getByUsername).toHaveBeenCalledWith('dahyun.fan');
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Dahyun Fan');
    expect(content).toContain('@Dahyun.Fan');
    expect(content).not.toContain('email');
  });
});
