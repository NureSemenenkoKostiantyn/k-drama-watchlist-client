import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { DiscoveryHome } from '../models/discovery-home';

@Injectable({ providedIn: 'root' })
export class DiscoveryService {
  private readonly http = inject(HttpClient);

  getHome(): Observable<DiscoveryHome> {
    return this.http.get<DiscoveryHome>(
      `${environment.apiBaseUrl}/discovery/home`,
    );
  }
}
