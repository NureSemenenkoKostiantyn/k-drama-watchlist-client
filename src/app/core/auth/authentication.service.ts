import { computed, Injectable, signal } from '@angular/core';
import { oauthProviderClient } from '@better-auth/oauth-provider/client';
import { createAuthClient } from 'better-auth/client';
import { usernameClient } from 'better-auth/client/plugins';

function buildAuthClient() {
  return createAuthClient({
    plugins: [usernameClient(), oauthProviderClient()],
  });
}

type AuthClient = ReturnType<typeof buildAuthClient>;
export type AuthSession = AuthClient['$Infer']['Session'];

export interface RegisterCredentials {
  email: string;
  name: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface OAuthClientInformation {
  client_id: string;
  client_name?: string;
  client_uri?: string;
  logo_uri?: string;
  policy_uri?: string;
  tos_uri?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly client = buildAuthClient();
  private readonly sessionState = signal<AuthSession | null>(null);
  private readonly pendingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly verificationEmailState = signal<string | null>(null);
  private readonly emailVerificationRequiredState = signal(false);

  readonly session = this.sessionState.asReadonly();
  readonly isPending = this.pendingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly verificationEmail = this.verificationEmailState.asReadonly();
  readonly emailVerificationRequired = this.emailVerificationRequiredState.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionState() !== null);
  readonly needsOnboarding = computed(
    () => this.sessionState() !== null && !this.sessionState()?.user.username,
  );

  async refreshSession(): Promise<void> {
    this.pendingState.set(true);

    try {
      const response = await this.client.getSession();
      this.sessionState.set(response.data ?? null);

      if (response.error) {
        this.errorState.set(readErrorMessage(response.error));
      }
    } catch (error: unknown) {
      this.sessionState.set(null);
      this.errorState.set(readErrorMessage(error));
    } finally {
      this.pendingState.set(false);
    }
  }

  async register(credentials: RegisterCredentials): Promise<boolean> {
    return this.runOperation(async () => {
      const response = await this.client.signUp.email({
        ...credentials,
        callbackURL: applicationUrl('/onboarding'),
      });

      if (response.error) {
        throw response.error;
      }

      this.sessionState.set(null);
      this.verificationEmailState.set(credentials.email);
    });
  }

  async signIn(credentials: LoginCredentials): Promise<boolean> {
    return this.runOperation(async () => {
      const response = await this.client.signIn.email({
        ...credentials,
        rememberMe: true,
      });

      if (response.error) {
        if (isEmailVerificationError(response.error)) {
          this.emailVerificationRequiredState.set(true);
          this.verificationEmailState.set(credentials.email);
        }

        throw response.error;
      }

      await this.loadSession();
    });
  }

  async sendVerificationEmail(email: string): Promise<boolean> {
    return this.runOperation(async () => {
      const response = await this.client.sendVerificationEmail({
        email,
        callbackURL: applicationUrl('/onboarding'),
      });

      if (response.error) {
        throw response.error;
      }

      this.verificationEmailState.set(email);
      this.emailVerificationRequiredState.set(false);
    });
  }

  async requestPasswordReset(email: string): Promise<boolean> {
    return this.runOperation(async () => {
      const response = await this.client.requestPasswordReset({
        email,
        redirectTo: applicationUrl('/reset-password'),
      });

      if (response.error) {
        throw response.error;
      }
    });
  }

  async resetPassword(
    newPassword: string,
    token: string,
  ): Promise<boolean> {
    return this.runOperation(async () => {
      const response = await this.client.resetPassword({
        newPassword,
        token,
      });

      if (response.error) {
        throw response.error;
      }

      this.sessionState.set(null);
    });
  }

  async completeOnboarding(username: string): Promise<boolean> {
    return this.runOperation(async () => {
      const response = await this.client.updateUser({ username });

      if (response.error) {
        throw response.error;
      }

      await this.loadSession();
    });
  }

  async signOut(): Promise<boolean> {
    return this.runOperation(async () => {
      const response = await this.client.signOut();

      if (response.error) {
        throw response.error;
      }

      this.sessionState.set(null);
    });
  }

  async getOAuthClient(
    clientId: string,
  ): Promise<OAuthClientInformation> {
    const response = await this.client.oauth2.publicClient({
      query: { client_id: clientId },
    });

    if (response.error) {
      throw new Error(readErrorMessage(response.error));
    }

    if (!response.data) {
      throw new Error('The requesting application could not be loaded.');
    }

    return response.data;
  }

  async decideOAuthConsent(
    accept: boolean,
    scope?: string,
  ): Promise<void> {
    const response = await this.client.oauth2.consent({
      accept,
      ...(scope ? { scope } : {}),
    });

    if (response.error) {
      throw new Error(readErrorMessage(response.error));
    }

    const redirectUri = readOAuthRedirect(response.data);
    if (!redirectUri) {
      throw new Error('The authorization redirect is unavailable.');
    }

    globalThis.location.assign(redirectUri);
  }

  clearError(): void {
    this.errorState.set(null);
    this.emailVerificationRequiredState.set(false);
  }

  private async runOperation(operation: () => Promise<void>): Promise<boolean> {
    this.pendingState.set(true);
    this.errorState.set(null);

    try {
      await operation();
      return true;
    } catch (error: unknown) {
      this.errorState.set(readErrorMessage(error));
      return false;
    } finally {
      this.pendingState.set(false);
    }
  }

  private async loadSession(): Promise<void> {
    const response = await this.client.getSession();

    if (response.error) {
      throw response.error;
    }

    this.sessionState.set(response.data ?? null);
  }
}

function readErrorMessage(error: unknown): string {
  if (isEmailVerificationError(error)) {
    return 'Verify your email before logging in.';
  }

  if (readErrorCode(error) === 'INVALID_TOKEN') {
    return 'This link is invalid or has expired. Request a new one.';
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return 'Authentication could not be completed. Please try again.';
}

function isEmailVerificationError(error: unknown): boolean {
  const code = readErrorCode(error);

  return (
    code === 'EMAIL_NOT_VERIFIED' ||
    (typeof code === 'string' && code.includes('EMAIL_NOT_VERIFIED'))
  );
}

function readErrorCode(error: unknown): string | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }

  return null;
}

function applicationUrl(path: string): string {
  return new URL(path, globalThis.location.origin).toString();
}

function readOAuthRedirect(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return null;

  if (
    'redirect_uri' in value &&
    typeof value.redirect_uri === 'string'
  ) {
    return value.redirect_uri;
  }

  if ('url' in value && typeof value.url === 'string') {
    return value.url;
  }

  return null;
}
