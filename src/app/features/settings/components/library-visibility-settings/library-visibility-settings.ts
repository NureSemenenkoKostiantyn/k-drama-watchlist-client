import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SettingsService } from '../../data-access/settings.service';
import { LibraryVisibility } from '../../models/settings';

@Component({
  selector: 'app-library-visibility-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './library-visibility-settings.html',
  styleUrl: './library-visibility-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryVisibilitySettingsComponent implements OnInit {
  protected readonly settings = inject(SettingsService);
  protected readonly form = new FormGroup({
    visibility: new FormControl<LibraryVisibility>('private', {
      nonNullable: true,
    }),
  });
  protected readonly isSaving = signal(false);
  protected readonly savedMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const settings = await this.settings.load();

    if (settings) {
      this.form.controls.visibility.setValue(settings.libraryVisibility);
    }
  }

  protected async save(): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.savedMessage.set(null);
    const result = await this.settings.updateLibraryVisibility(
      this.form.controls.visibility.value,
    );

    if (result) {
      this.savedMessage.set('Library visibility saved.');
    }

    this.isSaving.set(false);
  }
}
