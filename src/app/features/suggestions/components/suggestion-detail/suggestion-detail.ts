import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  Suggestion,
  SuggestionStatus,
} from '../../models/suggestion';

export type SuggestionView = 'pending' | 'history' | 'sent';

@Component({
  selector: 'app-suggestion-detail',
  imports: [RouterLink],
  templateUrl: './suggestion-detail.html',
  styleUrl: './suggestion-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestionDetail {
  readonly suggestion = input.required<Suggestion>();
  readonly view = input.required<SuggestionView>();
  readonly acting = input(false);
  readonly acceptSuggestion = output<Suggestion>();
  readonly dismissSuggestion = output<Suggestion>();

  protected statusLabel(status: SuggestionStatus): string {
    return status === 'pending'
      ? 'Pending'
      : status === 'accepted'
        ? 'Accepted'
        : 'Dismissed';
  }

  protected year(suggestion: Suggestion): string | null {
    return (
      suggestion.media.firstAirDate ??
      suggestion.media.releaseDate
    )?.slice(0, 4) ?? null;
  }
}
