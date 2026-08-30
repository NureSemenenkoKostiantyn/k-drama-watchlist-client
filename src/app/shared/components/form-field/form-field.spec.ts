import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormField } from './form-field';

describe('FormField', () => {
  let fixture: ComponentFixture<FormField>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormField] }).compileComponents();
    fixture = TestBed.createComponent(FormField);
    fixture.componentRef.setInput('label', 'Email');
    fixture.componentRef.setInput('inputId', 'account-email');
    fixture.componentRef.setInput('hint', 'We keep this private.');
    fixture.componentRef.setInput('error', 'Enter a valid email.');
    fixture.detectChanges();
  });

  it('associates its label and supporting messages with the supplied control id', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('label')?.htmlFor).toBe('account-email');
    expect(element.querySelector('.ui-form-field__hint')?.textContent).toContain(
      'We keep this private.',
    );
    expect(element.querySelector('.ui-form-field__error')?.textContent).toContain(
      'Enter a valid email.',
    );
  });
});
