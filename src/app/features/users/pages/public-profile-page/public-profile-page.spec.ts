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
    id: '507f1f77bcf86cd799439011',
    username: 'dahyun.fan',
    displayUsername: 'Dahyun.Fan',
    name: 'Dahyun Fan',
    joinedAt: '2026-07-20T10:00:00.000Z',
  };
  const getById = vi.fn().mockResolvedValue(profile);

  beforeEach(async () => {
    getById.mockClear();
    await TestBed.configureTestingModule({
      imports: [PublicProfilePage],
      providers: [
        provideRouter([
          { path: 'users/:userId', component: PublicProfilePage },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(
              convertToParamMap({ userId: profile.id }),
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
          useValue: { getById },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicProfilePage);
    fixture.detectChanges();
  });

  it('loads and renders the route user ID without private data', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getById).toHaveBeenCalledWith(profile.id);
    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Dahyun Fan');
    expect(content).toContain('@Dahyun.Fan');
    expect(content).not.toContain('email');
  });
});
