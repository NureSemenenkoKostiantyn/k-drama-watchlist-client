import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { McpConsentPage } from './mcp-consent-page';

describe('McpConsentPage', () => {
  const decideOAuthConsent = vi.fn(() => Promise.resolve());
  const getOAuthClient = vi.fn(() =>
    Promise.resolve({
      client_id: 'https://assistant.example/client.json',
      client_name: 'Example assistant',
    }),
  );
  const authentication = {
    decideOAuthConsent,
    getOAuthClient,
    isAuthenticated: signal(true),
    needsOnboarding: signal(false),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [McpConsentPage],
      providers: [
        provideRouter([
          { path: 'mcp/consent', component: McpConsentPage },
        ]),
        { provide: AuthenticationService, useValue: authentication },
      ],
    }).compileComponents();

    await TestBed.inject(Router).navigateByUrl(
      '/mcp/consent?client_id=https%3A%2F%2Fassistant.example%2Fclient.json' +
        '&scope=openid%20profile%20mcp%3Alibrary%3Aread%20mcp%3Asocial%3Aread',
    );
  });

  it('shows the client and sends the approved read-only scopes', async () => {
    const fixture = TestBed.createComponent(McpConsentPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getOAuthClient).toHaveBeenCalledWith(
      'https://assistant.example/client.json',
    );
    expect(fixture.nativeElement.textContent).toContain('Example assistant');
    expect(fixture.nativeElement.textContent).toContain(
      'Read your library, media details, and statistics.',
    );

    const approveButton = (fixture.nativeElement as HTMLElement).querySelector(
      'button:last-child',
    ) as HTMLButtonElement | null;
    approveButton?.click();
    await fixture.whenStable();

    expect(decideOAuthConsent).toHaveBeenCalledWith(
      true,
      'openid profile mcp:library:read mcp:social:read',
    );
  });
});
