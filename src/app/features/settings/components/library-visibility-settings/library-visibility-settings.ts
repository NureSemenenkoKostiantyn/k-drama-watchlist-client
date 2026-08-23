import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SettingsService } from '../../data-access/settings.service';
import { ActivityVisibility, LibraryVisibility } from '../../models/settings';

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
    libraryVisibility: new FormControl<LibraryVisibility>('private', {
      nonNullable: true,
    }),
    activityVisibility: new FormControl<ActivityVisibility>('private', {
      nonNullable: true,
    }),
  });
  protected readonly isSaving = signal(false);
  protected readonly savedMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const settings = await this.settings.load();

    if (settings) {
      this.form.setValue({
        libraryVisibility: settings.libraryVisibility,
        activityVisibility: settings.activityVisibility,
      });
    }
  }

  protected async save(): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.savedMessage.set(null);
    const result = await this.settings.updatePrivacy(this.form.getRawValue());

    if (result) {
      this.savedMessage.set('Privacy settings saved.');
    }

    this.isSaving.set(false);
  }
}
