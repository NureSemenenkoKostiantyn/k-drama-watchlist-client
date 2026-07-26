import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ShareCardExportService } from '../../data-access/share-card-export.service';
import { ShareCardCreator } from './share-card-creator';

describe('ShareCardCreator', () => {
  let componentRef: ComponentRef<ShareCardCreator>;
  let fixture: ComponentFixture<ShareCardCreator>;
  const download = vi.fn().mockResolvedValue(undefined);
  const share = vi.fn().mockResolvedValue('shared');

  beforeEach(async () => {
    download.mockClear();
    share.mockClear();
    await TestBed.configureTestingModule({
      imports: [ShareCardCreator],
      providers: [
        {
          provide: ShareCardExportService,
          useValue: { download, share },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShareCardCreator);
    componentRef = fixture.componentRef;
    componentRef.setInput('source', {
      kind: 'media',
      title: 'Goblin',
      username: 'dahyun',
      rating: 9.5,
      description: 'A private note',
    });
    fixture.detectChanges();
  });

  it('does not show a private description by default', () => {
    const root = componentRef.location.nativeElement as HTMLElement;

    expect(root.querySelector('blockquote')).toBeNull();
    expect(root.textContent).toContain('9.5 / 10');
  });

  it('exports the selected configuration after explicit privacy opt-in', async () => {
    const root = componentRef.location.nativeElement as HTMLElement;
    const descriptionToggle = root.querySelector<HTMLInputElement>(
      '#include-description',
    );
    const downloadButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Download PNG'),
    );

    descriptionToggle?.click();
    componentRef.changeDetectorRef.detectChanges();
    expect(root.querySelector('blockquote')?.textContent).toContain(
      'A private note',
    );

    downloadButton?.click();
    await fixture.whenStable();

    expect(download).toHaveBeenCalledWith(
      expect.objectContaining({
        configuration: expect.objectContaining({
          template: 'rating',
          includeDescription: true,
        }),
      }),
    );
  });

  it('shares the generated PNG with the selected configuration', async () => {
    const root = componentRef.location.nativeElement as HTMLElement;
    const shareButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Share card'),
    );

    shareButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({ title: 'Goblin' }),
        configuration: expect.objectContaining({
          template: 'rating',
          includeDescription: false,
        }),
      }),
    );
    expect(root.textContent).toContain('Your card was shared.');
  });
});
