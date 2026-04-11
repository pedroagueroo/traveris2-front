import { Directive, ElementRef, HostListener } from '@angular/core';

/**
 * Directiva para formatear DNI argentino: XX.XXX.XXX
 * Uso: <input appDniMask />
 */
@Directive({
  selector: '[appDniMask]',
  standalone: true
})
export class DniMaskDirective {
  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = this.el.nativeElement;
    let value = input.value.replace(/\D/g, '');

    // Limitar a 8 dígitos
    if (value.length > 8) value = value.substring(0, 8);

    // Formatear: XX.XXX.XXX
    if (value.length > 5) {
      value = value.substring(0, 2) + '.' + value.substring(2, 5) + '.' + value.substring(5);
    } else if (value.length > 2) {
      value = value.substring(0, 2) + '.' + value.substring(2);
    }

    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
