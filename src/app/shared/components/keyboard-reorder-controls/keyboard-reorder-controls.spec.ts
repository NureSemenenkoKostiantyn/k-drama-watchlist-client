import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { KeyboardReorderControls } from './keyboard-reorder-controls';

describe('KeyboardReorderControls', () => {
  let fixture: ComponentFixture<KeyboardReorderControls>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyboardReorderControls],
    }).compileComponents();
    fixture = TestBed.createComponent(KeyboardReorderControls);
    fixture.componentRef.setInput('itemLabel', 'Goblin');
    fixture.componentRef.setInput('canMoveBefore', true);
    fixture.componentRef.setInput('canMoveAfter', false);
    fixture.detectChanges();
  });

  it('exposes labelled keyboard buttons and emits an enabled move', () => {
    const emitted = vi.fn();
    fixture.componentInstance.moveRequested.subscribe(emitted);
    const root = fixture.nativeElement as HTMLElement;
    const before = root.querySelector<HTMLButtonElement>(
      'button[aria-label="Move Goblin earlier"]',
    );
    const after = root.querySelector<HTMLButtonElement>('button[aria-label="Move Goblin later"]');

    expect(before?.disabled).toBe(false);
    expect(after?.disabled).toBe(true);
    before?.click();
    expect(emitted).toHaveBeenCalledWith('before');
  });
});
