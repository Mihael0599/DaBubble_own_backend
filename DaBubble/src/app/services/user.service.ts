import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChannelService } from './channel.service';

export interface AppUser {
  id: string;
  userId: string;
  displayName: string;
  name: string;
  email: string;
  avatarUrl?: string;
  avatar: string;
  active: boolean;
}

export interface AuthResponse {
  token: string;
  email: string;
  displayName: string;
  userId: string;
  id?: string;
}
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private router = inject(Router);

  showChannel = false;
  showChatPartnerHeader = false;
  showNewMessage = true;
  loginIsSucess = false;
  chatId: any = '';
  usersIdsInChannel: any[] = [];

  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  userAvatarInChannel$ = new BehaviorSubject<{
    name: string;
    avatar: string;
    userId: string;
    userActive: boolean;
    email: string;
    active: boolean;
  }[]>([]);

  onlineUser: string = 'status/online.png';
  offlineUser: string = 'status/offline.png';
  pendingUser: any = null;
  pendingRegistrationId$ = new BehaviorSubject<string | null>(null);
  channelService = inject(ChannelService);

  constructor() {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      this.currentUserSubject.next(user);
    }
  }

  get currentUser() {
    return this.currentUserSubject.value;
  }

  get isLoggedIn() {
    return !!this.currentUserSubject.value;
  }

  async loginService(email: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post<AuthResponse>(
        `${environment.apiUrl}/auth/login`,
        { email, password }
      ).subscribe({
        next: (response) => {
          this.setUser(response);
          this.loginIsSucess = true;
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  async createInitialUser(displayName: string, email: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post<AuthResponse>(
        `${environment.apiUrl}/auth/register`,
        { displayName, email, password }
      ).subscribe({
        next: (response) => {
          this.setUser(response);
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/auth/forgot-password`,
      JSON.stringify(email),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  resetPassword(email: string, token: string, newPassword: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/auth/reset-password`,
      { email, token, newPassword }
    );
  }

  getAllUsers(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(`${environment.apiUrl}/users`).pipe(
      map(users => users.map(u => ({
        ...u,
        name: u.displayName || '',
        userId: u.id,
        avatar: u.avatarUrl || 'empty-avatar.png',
        active: u.active ?? false
      })))
    );
  }

  getUserById(userId: string): Observable<AppUser> {
    return this.http.get<AppUser>(`${environment.apiUrl}/users/${userId}`);
  }

  async updateUserName(newName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put(
        `${environment.apiUrl}/users/displayname`,
        { displayName: newName }
      ).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  async updateUserAvatar(avatarUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put(
        `${environment.apiUrl}/users/avatar`,
        { avatarUrl }
      ).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  showFilteredUsers(input: string): Observable<AppUser[]> {
    return this.getAllUsers().pipe(
      map((users: AppUser[]) =>
        users.filter((user: AppUser) =>
          user.displayName.toLowerCase().startsWith(input.toLowerCase())
        )
      )
    );
  }

  clearUserInChannelsArray() {
    this.usersIdsInChannel = [];
    this.userAvatarInChannel$.next([]);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  private setUser(user: AuthResponse) {
    localStorage.setItem('token', user.token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
    // currentUserId im ChannelService setzen
    this.channelService.currentUserId = user.userId || user.id || '';
    this.channelService.currentUser = user;
  }

  async getUserIdsFromChannel(channelId: string): Promise<void> {
    this.clearUserInChannelsArray();
    this.http.get<any[]>(
      `${environment.apiUrl}/channels/${channelId}/users`
    ).subscribe(users => {
      this.usersIdsInChannel = users.map(u => u.id);
      this.userAvatarInChannel$.next(users.map(u => ({
        name: u.displayName,
        avatar: u.avatarUrl || 'empty-avatar.png',
        userId: u.id,
        userActive: true,
        email: u.email,
        active: true
      })));
    });
  }

  async showCurrentUserData(): Promise<void> {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      this.channelService.currentUserId = user.userId || user.id || '';
    }
  }

  async completeUserRegistration(avatarPath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.updateUserAvatar(avatarPath)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }

  async cleanupIncompleteRegistration(): Promise<void> {
    this.pendingUser = null;
    this.pendingRegistrationId$.next(null);
  }

  async signInWithGoogle(): Promise<void> {
    // Google Login wird später implementiert
    console.log('Google Login noch nicht implementiert');
  }

  async signInWithGuest(): Promise<void> {
    return this.loginService('guestemail@gmail.com', 'Guest123!');
  }

  async updateUserDocument(userId: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put(
        `${environment.apiUrl}/users/${userId}/status`,
        data
      ).subscribe({
        next: () => resolve(),
        error: () => resolve() // Fehler ignorieren beim Logout
      });
    });
  }
}