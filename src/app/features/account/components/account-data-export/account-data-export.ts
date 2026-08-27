import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AccountExportService } from '../../data-access/account-export.service';

@Component({
  selector: 'app-account-data-export',
  templateUrl: './account-data-export.html',
  styleUrl: './account-data-export.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDataExportComponent {
  protected readonly accountExport = inject(AccountExportService);

  protected download(): void {
    void this.accountExport.download();
  }
}
