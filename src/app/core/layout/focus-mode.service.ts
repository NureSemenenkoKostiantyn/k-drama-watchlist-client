import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FocusModeService {
  private readonly state = signal(false);
  readonly active = this.state.asReadonly();
  toggle(): void {
    this.state.update((active) => !active);
  }
  reset(): void {
    this.state.set(false);
  }
}
