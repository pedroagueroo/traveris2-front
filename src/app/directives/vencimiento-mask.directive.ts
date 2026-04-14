import { Directive, ElementRef, HostListener, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Directiva para formatear vencimiento de tarjeta: MM/AA
 * Uso: <input appVencimientoMask />
 */
@Directive({
  selector: '[appVencimientoMask]',
  standalone: true
})
export class VencimientoMaskDirective {
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
    let formatted = value;
    if (value.length > 2) {
      formatted = value.substring(0, 2) + '/' + value.substring(2);
    }

    input.value = formatted;

    if (this.ngControl?.control) {
      this.ngControl.control.setValue(formatted, { emitEvent: false });
    }

    this.formatting = false;
  }
}
