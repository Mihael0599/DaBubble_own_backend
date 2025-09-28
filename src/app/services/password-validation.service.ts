import { Injectable } from '@angular/core';

export function isValidPassword(password: string): boolean {
  if (!password || password.length < 8) {
    return false;
  }
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordValidationService {

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
    const missing = [];
    if (!/[A-Z]/.test(password)) missing.push('Großbuchstabe');
    if (!/[a-z]/.test(password)) missing.push('Kleinbuchstabe');
    if (!/\d/.test(password)) missing.push('Zahl');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) missing.push('Sonderzeichen');
    if (missing.length > 0) {
      return `Das Passwort benötigt: ${missing.join(', ')}`;
    }
    return '';
  }
}