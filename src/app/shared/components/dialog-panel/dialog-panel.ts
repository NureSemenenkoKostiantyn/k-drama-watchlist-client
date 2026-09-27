import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { IconButton } from '../icon-button/icon-button';

/** Native modal: traps focus, supports Escape, and restores its opener on close. */
@Component({
  selector: 'app-dialog-panel',
  imports: [IconButton],
  template: `
    <dialog
      #dialog
      [class.drawer]="drawer()"
      [attr.aria-label]="title()"
      (cancel)="dismiss($event)"
    >
      <header>
        <h2>{{ title() }}</h2>
        <app-icon-button label="Close panel" [disabled]="busy()" (activated)="dismiss()"
          >✕</app-icon-button
        >
      </header>
      <div class="content"><ng-content /></div>
    </dialog>
  `,
  styleUrl: './dialog-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogPanel {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly drawer = input(false);
  readonly busy = input(false);
  readonly dismissed = output<void>();
  private readonly document = inject(DOCUMENT);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private opener: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const dialog = this.dialog()?.nativeElement;
      if (!dialog) return;
      if (this.open() && !dialog.open) {
        this.opener = this.document.activeElement as HTMLElement | null;
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
      } else if (!this.open() && dialog.open) {
        this.close(dialog);
      }
    });
    inject(DestroyRef).onDestroy(() => {
      const dialog = this.dialog()?.nativeElement;
      if (dialog?.open) this.close(dialog);
    });
  }

  private close(dialog: HTMLDialogElement): void {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    if (this.opener?.isConnected) this.opener.focus({ preventScroll: true });
    this.opener = null;
  }

  protected dismiss(event?: Event): void {
    event?.preventDefault();
    if (!this.busy()) this.dismissed.emit();
  }
}
