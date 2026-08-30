import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AccountDataExportComponent } from '../../../account/components/account-data-export/account-data-export';
import { TelegramConnectionSettingsComponent } from '../../../telegram/components/telegram-connection-settings/telegram-connection-settings';
import { LibraryVisibilitySettingsComponent } from '../../components/library-visibility-settings/library-visibility-settings';

@Component({
  selector: 'app-settings-page',
  imports: [
    AccountDataExportComponent,
    LibraryVisibilitySettingsComponent,
    TelegramConnectionSettingsComponent,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {}
