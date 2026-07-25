import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { WheelsService } from '../../data-access/wheels.service';
import { WheelSelectionMode } from '../../models/wheel';

@Component({
  selector: 'app-wheels-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './wheels-page.html',
  styleUrl: './wheels-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WheelsPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly wheels = inject(WheelsService);
  protected readonly isSaving = signal(false);
  protected readonly createForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(1000)]],
    selectionMode: this.formBuilder.nonNullable.control<WheelSelectionMode>(
      'fully_random',
    ),
  });

  ngOnInit(): void {
    this.wheels.clearActiveWheel();
    void this.wheels.load();
  }

  protected async createWheel(): Promise<void> {
    if (this.createForm.invalid || this.isSaving()) {
      this.createForm.markAllAsTouched();
      return;
    }

    const value = this.createForm.getRawValue();
    const title = value.title.trim();

    if (!title) {
      return;
    }

    this.isSaving.set(true);
    const wheel = await this.wheels.create({
      title,
      selectionMode: value.selectionMode,
      ...(value.description.trim()
        ? { description: value.description.trim() }
        : {}),
    });
    this.isSaving.set(false);

    if (wheel) {
      await this.router.navigate(['/wheels', wheel.id]);
    }
  }
}
