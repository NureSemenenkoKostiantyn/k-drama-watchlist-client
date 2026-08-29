import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import {
  SuggestionDetail,
  type SuggestionView,
} from '../../components/suggestion-detail/suggestion-detail';
import { SuggestionsService } from '../../data-access/suggestions.service';
import {
  Suggestion,
  SuggestionsOverview,
  SuggestionStatus,
} from '../../models/suggestion';

@Component({
  selector: 'app-suggestions-page',
  imports: [RouterLink, SuggestionDetail],
  templateUrl: './suggestions-page.html',
  styleUrls: [
    './suggestions-page.scss',
    './suggestions-page-links.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestionsPage implements OnInit {
  private readonly suggestionsService = inject(SuggestionsService);
  protected readonly overview = signal<SuggestionsOverview>({
    received: [],
    sent: [],
  });
  protected readonly isLoading = signal(true);
  protected readonly activeSuggestionId = signal<string | null>(null);
  protected readonly selectedSuggestionId = signal<string | null>(null);
  protected readonly activeView = signal<SuggestionView>('pending');
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly pendingSuggestions = computed(() =>
    this.overview().received.filter(
      (suggestion) => suggestion.status === 'pending',
    ),
  );
  protected readonly historySuggestions = computed(() =>
    this.overview().received.filter(
      (suggestion) => suggestion.status !== 'pending',
    ),
  );
  protected readonly visibleSuggestions = computed(() => {
    switch (this.activeView()) {
      case 'pending':
        return this.pendingSuggestions();
      case 'history':
        return this.historySuggestions();
      case 'sent':
        return this.overview().sent;
    }
  });
  protected readonly selectedSuggestion = computed(() => {
    const suggestions = this.visibleSuggestions();
    const selectedId = this.selectedSuggestionId();

    return (
      suggestions.find(
        (suggestion) => suggestion.id === selectedId,
      ) ??
      suggestions[0] ??
      null
    );
  });

  ngOnInit(): void {
    void this.load();
  }

  protected accept(suggestion: Suggestion): Promise<void> {
    return this.respond(suggestion, 'accept');
  }

  protected dismiss(suggestion: Suggestion): Promise<void> {
    return this.respond(suggestion, 'dismiss');
  }

  protected setView(view: SuggestionView): void {
    this.activeView.set(view);
    this.selectedSuggestionId.set(null);
  }

  protected selectSuggestion(suggestion: Suggestion): void {
    this.selectedSuggestionId.set(suggestion.id);
  }

  protected isSelected(suggestionId: string): boolean {
    return this.selectedSuggestion()?.id === suggestionId;
  }

  protected isActing(suggestionId: string): boolean {
    return this.activeSuggestionId() === suggestionId;
  }

  protected statusLabel(status: SuggestionStatus): string {
    return status === 'pending'
      ? 'Pending'
      : status === 'accepted'
        ? 'Accepted'
        : 'Dismissed';
  }

  protected emptyState(): string {
    switch (this.activeView()) {
      case 'pending':
        return 'No recommendations need your attention.';
      case 'history':
        return 'Accepted and dismissed recommendations will appear here.';
      case 'sent':
        return 'Suggest a title from any media details page.';
    }
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      this.overview.set(await this.suggestionsService.list());
    } catch (error: unknown) {
      this.error.set(
        readApiErrorMessage(
          error,
          'Suggestions are unavailable right now. Please try again.',
        ),
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private async respond(
    suggestion: Suggestion,
    action: 'accept' | 'dismiss',
  ): Promise<void> {
    if (this.activeSuggestionId() !== null) {
      return;
    }

    this.activeSuggestionId.set(suggestion.id);
    this.error.set(null);
    this.notice.set(null);

    try {
      const updated =
        action === 'accept'
          ? await this.suggestionsService.accept(suggestion.id)
          : await this.suggestionsService.dismiss(suggestion.id);
      this.overview.update((overview) => ({
        ...overview,
        received: overview.received.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      }));
      this.notice.set(
        action === 'accept'
          ? `${updated.media.title} is in your library.`
          : 'Suggestion dismissed.',
      );
    } catch (error: unknown) {
      this.error.set(
        readApiErrorMessage(
          error,
          'The suggestion could not be updated. Please try again.',
        ),
      );
    } finally {
      this.activeSuggestionId.set(null);
    }
  }
}
