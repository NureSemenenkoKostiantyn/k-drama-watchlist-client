import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { SharedListCommentsService } from '../../data-access/shared-list-comments.service';
import { SharedListComment } from '../../models/comment';
import { SharedListRole } from '../../models/shared-list';

@Component({
  selector: 'app-shared-list-comments',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './shared-list-comments.html',
  styleUrl: './shared-list-comments.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedListComments {
  private readonly formBuilder = inject(FormBuilder);
  private readonly service = inject(SharedListCommentsService);
  private readonly authentication = inject(AuthenticationService);
  readonly listId = input.required<string>();
  readonly itemId = input.required<string>();
  readonly role = input.required<SharedListRole>();
  protected readonly expanded = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly comments = signal<SharedListComment[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly replyTo = signal<SharedListComment | null>(null);
  protected readonly editing = signal<SharedListComment | null>(null);
  protected readonly revealed = signal(new Set<string>());
  protected readonly canComment = computed(() => this.role() !== 'viewer');
  protected readonly topLevel = computed(() =>
    this.comments().filter((comment) => !comment.parentCommentId),
  );
  protected readonly form = this.formBuilder.nonNullable.group({
    body: ['', [Validators.required, Validators.maxLength(2000)]],
    hasSpoiler: false,
  });

  protected async toggle(): Promise<void> {
    this.expanded.update((value) => !value);
    if (this.expanded() && this.comments().length === 0) await this.load();
  }

  protected replies(commentId: string): SharedListComment[] {
    return this.comments().filter((comment) => comment.parentCommentId === commentId);
  }

  protected isOwn(comment: SharedListComment): boolean {
    return comment.author.id === this.authentication.session()?.user.id;
  }

  protected canDelete(comment: SharedListComment): boolean {
    return !comment.isDeleted && (this.isOwn(comment) || this.role() === 'owner');
  }

  protected isHidden(comment: SharedListComment): boolean {
    return comment.hasSpoiler && !this.revealed().has(comment.id);
  }

  protected reveal(commentId: string): void {
    this.revealed.update((ids) => new Set(ids).add(commentId));
  }

  protected startReply(comment: SharedListComment): void {
    this.editing.set(null);
    this.replyTo.set(comment);
    this.form.reset({ body: '', hasSpoiler: false });
  }

  protected startEdit(comment: SharedListComment): void {
    this.replyTo.set(null);
    this.editing.set(comment);
    this.form.setValue({ body: comment.body ?? '', hasSpoiler: comment.hasSpoiler });
  }

  protected cancelCompose(): void {
    this.replyTo.set(null);
    this.editing.set(null);
    this.form.reset({ body: '', hasSpoiler: false });
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const body = value.body.trim();
    if (!body) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      const editing = this.editing();
      const comment = editing
        ? await this.service.update(editing.id, { body, hasSpoiler: value.hasSpoiler })
        : await this.service.create(this.listId(), this.itemId(), {
            body,
            hasSpoiler: value.hasSpoiler,
            ...(this.replyTo() ? { parentCommentId: this.replyTo()!.id } : {}),
          });
      this.comments.update((comments) =>
        editing
          ? comments.map((candidate) => candidate.id === comment.id ? comment : candidate)
          : [...comments, comment],
      );
      this.cancelCompose();
    } catch (error: unknown) {
      this.error.set(readApiErrorMessage(error, 'The comment could not be saved.'));
    } finally {
      this.saving.set(false);
    }
  }

  protected async delete(comment: SharedListComment): Promise<void> {
    this.error.set(null);
    try {
      await this.service.delete(comment.id);
      const deletedAt = new Date().toISOString();
      this.comments.update((comments) => comments.map((candidate) =>
        candidate.id === comment.id
          ? { ...candidate, body: undefined, hasSpoiler: false, isDeleted: true, deletedAt }
          : candidate,
      ));
    } catch (error: unknown) {
      this.error.set(readApiErrorMessage(error, 'The comment could not be deleted.'));
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.comments.set(await this.service.list(this.listId(), this.itemId()));
    } catch (error: unknown) {
      this.error.set(readApiErrorMessage(error, 'Comments are unavailable right now.'));
    } finally {
      this.loading.set(false);
    }
  }
}
