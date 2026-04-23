import { Directive, ElementRef, HostListener, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Directiva para formatear DNI argentino: XX.XXX.XXX
 * Uso: <input appDniMask />
 */
@Directive({
  selector: '[appDniMask]',
  standalone: true
})
export class DniMaskDirective {
  private formatting = false;

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() @Self() private ngControl: NgControl
  ) {}

  @HostListener('input')
  onInput(): void {
    const raw = this.el.nativeElement.value;
    if (/[a-zA-Z]/.test(raw)) return; // es pasaporte, no formatear

    if (this.formatting) return;
    this.formatting = true;

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

    // Actualizar ngModel sin re-disparar el listener
    if (this.ngControl?.control) {
      this.ngControl.control.setValue(value, { emitEvent: false });
    }

    this.formatting = false;
  }
}
