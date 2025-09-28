import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private api = environment.apiBaseUrl;

  // Variante B: Direktes Backend-Login (E-Mail/Passwort)
  async backendLogin(email: string, password: string) {
    const res = await this.http.post<{ access_token: string }>(
      `${this.api}/auth/login`, { email, password }
    ).toPromise();
    localStorage.setItem('jwt', res!.access_token);
  }

  logout() { localStorage.removeItem('jwt'); }
  hasJwt() { return !!localStorage.getItem('jwt'); }
  get token() { return localStorage.getItem('jwt'); }
}
