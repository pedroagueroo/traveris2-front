import { Directive, ElementRef, HostListener, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Directiva para formatear tarjeta de crédito: XXXX XXXX XXXX XXXX
 * Uso: <input appTarjetaMask />
 */
@Directive({
  selector: '[appTarjetaMask]',
  standalone: true
})
export class TarjetaMaskDirective {
  private rawValue = '';
  private formatting = false;

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() @Self() private ngControl: NgControl
  ) {}

  @HostListener('input')
  onInput(): void {
    if (this.formatting) return;
    this.formatting = true;

    const input = this.el.nativeElement;
    let value = input.value.replace(/\D/g, '');

    // Máximo 16 dígitos
    if (value.length > 16) value = value.substring(0, 16);

    this.rawValue = value;

    // Formato: XXXX XXXX XXXX XXXX
    const formatted = value.replace(/(.{4})/g, '$1 ').trim();
    input.value = formatted;

    if (this.ngControl?.control) {
      this.ngControl.control.setValue(formatted, { emitEvent: false });
    }

    this.formatting = false;
  }

  /** Retorna el valor crudo (sin espacios) */
  getRawValue(): string {
    return this.rawValue;
  }

  /** Retorna valor enmascarado: •••• •••• •••• 1234 */
  getMaskedValue(): string {
    if (this.rawValue.length < 4) return this.rawValue;
    const last4 = this.rawValue.slice(-4);
    const masked = this.rawValue.slice(0, -4).replace(/./g, '•');
    const full = masked + last4;
    return full.replace(/(.{4})/g, '$1 ').trim();
  }
}
