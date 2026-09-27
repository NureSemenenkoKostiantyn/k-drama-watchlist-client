import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AccountDataExportComponent } from '../../../account/components/account-data-export/account-data-export';
import { TelegramConnectionSettingsComponent } from '../../../telegram/components/telegram-connection-settings/telegram-connection-settings';
import { LibraryVisibilitySettingsComponent } from '../../components/library-visibility-settings/library-visibility-settings';
import { AutoTierBoardSettingsComponent } from '../../components/auto-tier-board-settings/auto-tier-board-settings';

@Component({
  selector: 'app-settings-page',
  imports: [
    AccountDataExportComponent,
    LibraryVisibilitySettingsComponent,
    AutoTierBoardSettingsComponent,
    TelegramConnectionSettingsComponent,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {}
