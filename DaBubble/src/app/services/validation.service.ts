import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export function isValidPassword(password: string) {
  if (!password || password.length < 8) {
    return false;
  }
  return true;
}

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  private http = inject(HttpClient);

  isValidPassword(password: string): boolean {
    return isValidPassword(password);
  }

  showPasswordError(password: string, passwordTouched: boolean): boolean {
    return passwordTouched && !!password && !this.isValidPassword(password);
  }

  getPasswordErrorMessage(password: string): string {
    if (!password) return '';
    if (password.length < 8) {
      return 'Das Passwort muss mindestens 8 Zeichen lang sein.';
    }
    return '';
  }

  async isEmailTaken(email: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.http.get<any[]>(`${environment.apiUrl}/users`)
        .subscribe(users => {
          resolve(users.some(u => u.email === email));
        });
    });
  }

  async checkEmailExists(email: string): Promise<boolean> {
    return this.isEmailTaken(email);
  }
}