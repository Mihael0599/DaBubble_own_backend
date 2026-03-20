import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ChannelService } from './channel.service';
import { environment } from '../../environments/environment';

export interface SearchResult {
  id: string;
  name: string;
  type: 'channel' | 'user' | 'message';
  avatar?: string;
  description?: string;
  email?: string;
  messageText?: string;
  senderName?: string;
  timestamp?: any;
  channelName?: string;
  isDirectMessage?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private http = inject(HttpClient);
  private channelService = inject(ChannelService);
  private allUsersCache: any[] = [];
  private usersSubject = new BehaviorSubject<any[]>([]);

  constructor() {
    this.loadUsers();
  }

  private loadUsers() {
    this.http.get<any[]>(`${environment.apiUrl}/users`).subscribe(users => {
      this.allUsersCache = users;
      this.usersSubject.next(users);
    });
  }

  searchMessages(keyword: string): Observable<SearchResult[]> {
    if (!keyword.trim()) return of([]);
    return this.http.get<any[]>(
      `${environment.apiUrl}/messages/search?keyword=${keyword}`
    ).pipe(
      map(messages => messages.map(m => ({
        id: m.id.toString(),
        name: `Nachricht von ${m.sender?.displayName || 'Unbekannt'}`,
        type: 'message' as const,
        description: this.truncateText(m.content, 100),
        messageText: m.content,
        senderName: m.sender?.displayName,
        timestamp: m.sentAt,
        isDirectMessage: !m.channelId,
        channelName: m.channel?.name
      }))),
      catchError(() => of([]))
    );
  }

  searchChannels(keyword: string): Observable<SearchResult[]> {
    const userChannels = this.channelService.showChannelByUser || [];
    const filtered = userChannels
      .filter(channel => {
        const name = channel.name || channel.channelname || '';
        return name.toLowerCase().includes(keyword.toLowerCase());
      })
      .map(channel => ({
        id: channel.id?.toString() || channel.channelId || '',
        name: channel.name || channel.channelname || '',
        type: 'channel' as const,
        description: channel.description
      }))
      .slice(0, 10);
    return of(filtered);
  }

  searchUsers(keyword: string): Observable<SearchResult[]> {
    const filtered = this.allUsersCache
      .filter(user => {
        const name = user.displayName || user.name || '';
        const matches = !keyword || name.toLowerCase().includes(keyword.toLowerCase());
        const notCurrentUser = user.id !== this.channelService.currentUserId;
        return matches && notCurrentUser;
      })
      .map(user => ({
        id: user.id || user.userId || '',
        name: user.displayName || user.name || '',
        type: 'user' as const,
        avatar: user.avatarUrl || user.avatar,
        description: user.active ? 'Online' : 'Offline',
        email: user.email
      }))
      .slice(0, 10);
    return of(filtered);
  }

  searchUsersByEmail(keyword: string): Observable<SearchResult[]> {
    const filtered = this.allUsersCache
      .filter(user => {
        const email = user.email || '';
        return !keyword || email.toLowerCase().includes(keyword.toLowerCase());
      })
      .map(user => ({
        id: user.id || user.userId || '',
        name: user.displayName || user.name || '',
        type: 'user' as const,
        avatar: user.avatarUrl || user.avatar,
        description: user.active ? 'Online' : 'Offline',
        email: user.email
      }))
      .slice(0, 10);
    return of(filtered);
  }

  getAllUsersFromCache(): any[] {
    return this.allUsersCache;
  }

  getUsersObservable(): Observable<any[]> {
    return this.usersSubject.asObservable();
  }

  private truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  }
}