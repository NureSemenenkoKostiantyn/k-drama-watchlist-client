import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AccountDataExportComponent } from '../../../account/components/account-data-export/account-data-export';
import { LibraryVisibilitySettingsComponent } from '../../components/library-visibility-settings/library-visibility-settings';

@Component({
  selector: 'app-settings-page',
  imports: [AccountDataExportComponent, LibraryVisibilitySettingsComponent],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {}
