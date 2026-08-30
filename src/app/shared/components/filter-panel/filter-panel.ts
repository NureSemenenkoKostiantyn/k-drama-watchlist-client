import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-filter-panel',
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPanel {
  readonly panelId = input.required<string>();
  readonly title = input('Filter and organize');
  readonly expanded = input(true);
  readonly collapsible = input(false);
  readonly activeCount = input(0);
  readonly expandedChange = output<boolean>();
}
