import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface SegmentedControlOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

@Component({
  selector: 'app-segmented-control',
  templateUrl: './segmented-control.html',
  styleUrl: './segmented-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedControl {
  readonly options = input.required<readonly SegmentedControlOption[]>();
  readonly value = input.required<string>();
  readonly label = input.required<string>();
  readonly valueChange = output<string>();

  protected select(option: SegmentedControlOption): void {
    if (!option.disabled && option.value !== this.value()) this.valueChange.emit(option.value);
  }
}
