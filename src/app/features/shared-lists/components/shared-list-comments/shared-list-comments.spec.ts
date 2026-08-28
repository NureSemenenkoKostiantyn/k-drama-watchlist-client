import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { SharedListCommentsService } from '../../data-access/shared-list-comments.service';
import { SharedListComments } from './shared-list-comments';

describe('SharedListComments', () => {
  let fixture: ComponentFixture<SharedListComments>;
  const list = vi.fn().mockResolvedValue([
    {
      id: 'comment-1',
      listId: 'list-1',
      listItemId: 'item-1',
      author: {
        id: 'user-2',
        username: 'mina',
        displayUsername: 'Mina',
        name: 'Mina',
        joinedAt: '2026-08-20T10:00:00.000Z',
      },
      body: 'The finale reveals everything.',
      hasSpoiler: true,
      isDeleted: false,
      createdAt: '2026-08-22T10:00:00.000Z',
    },
  ]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedListComments],
      providers: [
        provideRouter([]),
        {
          provide: SharedListCommentsService,
          useValue: { list, create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        },
        {
          provide: AuthenticationService,
          useValue: { session: signal({ user: { id: 'user-1' } }) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SharedListComments);
    fixture.componentRef.setInput('listId', 'list-1');
    fixture.componentRef.setInput('itemId', 'item-1');
    fixture.componentRef.setInput('role', 'viewer');
    fixture.detectChanges();
  });

  it('keeps spoiler text hidden until explicitly revealed', async () => {
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.comments__toggle')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('.comments__toggle')?.getAttribute('aria-controls')).toBe(
      'comments-item-1',
    );
    expect(element.querySelector('.comments__body')?.id).toBe('comments-item-1');
    expect(element.textContent).not.toContain('The finale reveals everything.');
    const spoiler = element.querySelector<HTMLButtonElement>('.spoiler');
    expect(spoiler?.textContent).toContain('Spoiler hidden');
    spoiler?.click();
    fixture.detectChanges();
    expect(element.textContent).toContain('The finale reveals everything.');
    expect(element.querySelector('form')).toBeNull();
  });
});
