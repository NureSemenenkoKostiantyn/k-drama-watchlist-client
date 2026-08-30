import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ConfirmationDialog } from './confirmation-dialog';

describe('ConfirmationDialog', () => {
  it('emits confirmation from the destructive action', async () => {
    await TestBed.configureTestingModule({ imports: [ConfirmationDialog] }).compileComponents();
    const fixture = TestBed.createComponent(ConfirmationDialog);
    const confirmed = vi.fn();
    fixture.componentRef.setInput('title', 'Delete list?');
    fixture.componentRef.setInput('message', 'This cannot be undone.');
    fixture.componentInstance.confirmed.subscribe(confirmed);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button.danger') as HTMLButtonElement).click();
    expect(confirmed).toHaveBeenCalledOnce();
  });
});
