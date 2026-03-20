import { inject, Injectable } from '@angular/core';
import { collection, getDocs, query, where } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';

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
  private firestore = inject(Firestore);

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

  async checkEmailExists(email: string): Promise<boolean> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }
}