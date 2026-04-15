import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LoadingService } from './loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  loading.show();
  return next(req).pipe(
    catchError((err) => {
      loading.hide();
      return throwError(() => err);
    }),
    finalize(() => loading.hide())
  );
};
