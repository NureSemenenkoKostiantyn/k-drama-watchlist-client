import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { DialogPanel } from './dialog-panel';

describe('DialogPanel', () => {
  it('opens on demand, handles Escape and restores focus to its opener', async () => {
    await TestBed.configureTestingModule({ imports: [DialogPanel] }).compileComponents();
    const fixture = TestBed.createComponent(DialogPanel);
    fixture.componentRef.setInput('title', 'Add titles');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('dialog[open]')).toBeNull();
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect(root.querySelector('dialog[open]')?.getAttribute('aria-label')).toBe('Add titles');
    const dismissed = vi.fn();
    fixture.componentInstance.dismissed.subscribe(dismissed);
    root.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(dismissed).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('busy', true);
    fixture.detectChanges();
    root.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(dismissed).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    expect(root.querySelector('dialog[open]')).toBeNull();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
