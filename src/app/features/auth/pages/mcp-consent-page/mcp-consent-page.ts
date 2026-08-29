import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  AuthenticationService,
  type OAuthClientInformation,
} from '../../../../core/auth/authentication.service';

interface DisplayScope {
  name: string;
  description: string;
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  openid: 'Confirm your Drama Watch account identity.',
  profile: 'Read your public profile information.',
  'mcp:library:read': 'Read your library, media details, and statistics.',
  'mcp:social:read': 'Read your shared lists and selection wheels.',
  'mcp:library:write': 'Add, update, or remove titles in your library.',
  'mcp:social:write': 'Create and update shared lists and selection wheels.',
};

@Component({
  selector: 'app-mcp-consent-page',
  templateUrl: './mcp-consent-page.html',
  styleUrls: ['../../auth-page.scss', './mcp-consent-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McpConsentPage implements OnInit {
  private readonly authentication = inject(AuthenticationService);
  private readonly route = inject(ActivatedRoute);

  protected readonly client = signal<OAuthClientInformation | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly scopes = signal<DisplayScope[]>([]);

  async ngOnInit(): Promise<void> {
    const query = this.route.snapshot.queryParamMap;
    const clientId = query.get('client_id');
    const requestedScopes = (query.get('scope') ?? '')
      .split(' ')
      .filter(Boolean);

    this.scopes.set(
      requestedScopes.map((name) => ({
        name,
        description:
          SCOPE_DESCRIPTIONS[name] ?? `Allow the ${name} permission.`,
      })),
    );

    if (!clientId) {
      this.error.set('This authorization request is missing its client ID.');
      this.isLoading.set(false);
      return;
    }

    try {
      this.client.set(await this.authentication.getOAuthClient(clientId));
    } catch (error: unknown) {
      this.error.set(readMessage(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected approve(): Promise<void> {
    const acceptedScopes = this.scopes()
      .map(({ name }) => name)
      .join(' ');
    return this.submit(true, acceptedScopes);
  }

  protected deny(): Promise<void> {
    return this.submit(false);
  }

  private async submit(accept: boolean, scope?: string): Promise<void> {
    this.error.set(null);
    this.isSubmitting.set(true);

    try {
      await this.authentication.decideOAuthConsent(accept, scope);
    } catch (error: unknown) {
      this.error.set(readMessage(error));
      this.isSubmitting.set(false);
    }
  }
}

function readMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'The authorization request could not be completed.';
}
