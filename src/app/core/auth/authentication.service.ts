import { computed, Injectable, signal } from '@angular/core';
import { createAuthClient } from 'better-auth/client';
import { usernameClient } from 'better-auth/client/plugins';

function buildAuthClient() {
  return createAuthClient({
    plugins: [usernameClient()],
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

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly client = buildAuthClient();
  private readonly sessionState = signal<AuthSession | null>(null);
  private readonly pendingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly session = this.sessionState.asReadonly();
  readonly isPending = this.pendingState.asReadonly();
  readonly error = this.errorState.asReadonly();
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
      const response = await this.client.signUp.email(credentials);

      if (response.error) {
        throw response.error;
      }

      await this.loadSession();
    });
  }

  async signIn(credentials: LoginCredentials): Promise<boolean> {
    return this.runOperation(async () => {
      const response = await this.client.signIn.email({
        ...credentials,
        rememberMe: true,
      });

      if (response.error) {
        throw response.error;
      }

      await this.loadSession();
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

  clearError(): void {
    this.errorState.set(null);
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
