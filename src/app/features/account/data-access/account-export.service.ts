import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../core/api/api-error';
import { environment } from '../../../../environments/environment';
import { AccountDataExport } from '../models/account-data-export';

@Injectable({ providedIn: 'root' })
export class AccountExportService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly exportingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly noticeState = signal<string | null>(null);

  readonly isExporting = this.exportingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly notice = this.noticeState.asReadonly();

  async download(): Promise<boolean> {
    if (this.exportingState()) {
      return false;
    }

    this.exportingState.set(true);
    this.errorState.set(null);
    this.noticeState.set(null);

    try {
      const archive = await firstValueFrom(
        this.http.get<AccountDataExport>(
          `${environment.apiBaseUrl}/account/export`,
        ),
      );
      this.downloadArchive(archive);
      this.noticeState.set('Your data export has been downloaded.');
      return true;
    } catch (error: unknown) {
      this.errorState.set(
        readApiErrorMessage(
          error,
          'Your data could not be exported. Please try again.',
        ),
      );
      return false;
    } finally {
      this.exportingState.set(false);
    }
  }

  private downloadArchive(archive: AccountDataExport): void {
    const urlApi = this.document.defaultView?.URL;

    if (!urlApi?.createObjectURL) {
      throw new Error('File downloads are unavailable in this browser.');
    }

    const blob = new Blob([JSON.stringify(archive, null, 2)], {
      type: 'application/json',
    });
    const objectUrl = urlApi.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `drama-watch-export-${archive.exportedAt.slice(0, 10)}.json`;

    try {
      anchor.click();
    } finally {
      urlApi.revokeObjectURL(objectUrl);
    }
  }
}
