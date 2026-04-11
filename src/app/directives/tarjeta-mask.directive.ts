import { Directive, ElementRef, HostListener } from '@angular/core';

/**
 * Directiva para formatear tarjeta de crédito: XXXX XXXX XXXX XXXX
 * Muestra últimos 4, enmascara el resto con •
 * Uso: <input appTarjetaMask />
 */
@Directive({
  selector: '[appTarjetaMask]',
  standalone: true
})
export class TarjetaMaskDirective {
  private rawValue = '';

  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('input')
  onInput(): void {
    const input = this.el.nativeElement;
    let value = input.value.replace(/\D/g, '');

    // Máximo 16 dígitos
    if (value.length > 16) value = value.substring(0, 16);

    this.rawValue = value;

    // Formato: XXXX XXXX XXXX XXXX
    const formatted = value.replace(/(.{4})/g, '$1 ').trim();
    input.value = formatted;
    input.dispatchEvent(new Event('input', { bubbles: true }));
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
