import { Directive, ElementRef, HostListener } from '@angular/core';

/**
 * Directiva para formatear vencimiento de tarjeta: MM/AA
 * Uso: <input appVencimientoMask />
 */
@Directive({
  selector: '[appVencimientoMask]',
  standalone: true
})
export class VencimientoMaskDirective {
  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('input')
  onInput(): void {
    const input = this.el.nativeElement;
    let value = input.value.replace(/\D/g, '');

    // Limitar a 4 dígitos
    if (value.length > 4) value = value.substring(0, 4);

    // Validar mes (01-12)
    if (value.length >= 2) {
      let mes = parseInt(value.substring(0, 2), 10);
      if (mes > 12) mes = 12;
      if (mes < 1 && value.substring(0, 2) !== '0') mes = 1;
      value = String(mes).padStart(2, '0') + value.substring(2);
    }

    // Formato MM/AA
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }

    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
