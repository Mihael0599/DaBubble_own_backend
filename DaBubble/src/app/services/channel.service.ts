import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Channel {
  id: number;
  channelId?: string;
  name: string;
  channelname?: string;
  description?: string;
  createdAt: string;
  createdBy?: string;
  userId?: string[];
  toJSON?: (fields?: any[]) => any;
}

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private http = inject(HttpClient);

  private updateChannelByUser = new BehaviorSubject<Channel[]>([]);
  showChannelByUser$ = this.updateChannelByUser.asObservable();
  showChannelByUser: Channel[] = [];

  public channelsLoaded$ = new BehaviorSubject<boolean>(false);

  private isCheckedSubject = new BehaviorSubject<any>(null);
  public isChecked$ = this.isCheckedSubject.asObservable();

  private activeChannelIdSubject = new BehaviorSubject<string>('');
  public activeChannelId$ = this.activeChannelIdSubject.asObservable();

  private buttonRectSubject = new BehaviorSubject<DOMRect | null>(null);
  buttonRect$ = this.buttonRectSubject.asObservable();

  currentUserId: string = '';
  currentUser: any = null;
  currentChannelId: string = '';
  currentChannelName: string = '';
  currentChannelDescription: string = '';
  userSubcollectionId: string = '';
  userSubcollectionChannelId: string = '';
  userSubcollectionChannelName: string = '';
  channelCreaterName: string = '';
  channelCreatedAtFormatted: string = '';
  selectedUser: any;
  channels: any[] = [];
  unsubscribeAllChannels: () => void = () => { };

  constructor() {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      this.currentUserId = user.userId || '';
      this.currentUser = user;
    }
  }

  setButtonRect(rect: DOMRect) { this.buttonRectSubject.next(rect); }
  getButtonRect(): DOMRect | null { return this.buttonRectSubject.value; }
  setCheckdValue(value: any) { this.isCheckedSubject.next(value); }
  setActiveChannelId(channelId: string) {
    this.activeChannelIdSubject.next(channelId);
    this.currentChannelId = channelId;
  }

  getDialogDimensions() {
    const width = window.innerWidth;
    if (width < 1000) {
      return { width: '100vw', height: '100vh' };
    } else {
      const height = window.innerHeight <= 1200 ? '500px' : '539px';
      return { width: '872px', height };
    }
  }

  getAllChannels(): Observable<Channel[]> {
    return this.http.get<Channel[]>(`${environment.apiUrl}/channels`);
  }

  getChannelById(id: number): Observable<Channel> {
    return this.http.get<Channel>(`${environment.apiUrl}/channels/${id}`);
  }

  async addNewChannel(name: string, description: string, userIds: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post<Channel>(
        `${environment.apiUrl}/channels`,
        { name, description }
      ).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  async editChannel(channelId: string | number, name: string, description?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put(
        `${environment.apiUrl}/channels/${channelId}`,
        { name, description }
      ).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  showUserChannel() {
    this.getAllChannels().subscribe(channels => {
      this.showChannelByUser = channels;
      this.updateChannelByUser.next(channels);
      this.channelsLoaded$.next(true);
    });
  }

  getChannelUserId(channelId: string) {
    this.getChannelById(parseInt(channelId)).subscribe(channel => {
      this.currentChannelName = channel.name;
      this.currentChannelDescription = channel.description || '';
      this.channelCreatedAtFormatted = this.formatChannelCreatedAt(
        new Date(channel.createdAt)
      );
    });
  }

  getChannelName(channelId: string) {
    this.getChannelById(parseInt(channelId)).subscribe(channel => {
      this.userSubcollectionChannelName = channel.name;
    });
  }

  private formatChannelCreatedAt(date: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'heute';
    if (date.toDateString() === yesterday.toDateString()) return 'gestern';

    return `am ${date.toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })}`;
  }

  async updateUserStorage(userId: string, storageId: string, item: {}): Promise<void> {
    // Wird später implementiert wenn nötig
  }

  resetAllStates(userService?: any) {
    this.isCheckedSubject.next(null);
    this.activeChannelIdSubject.next('');
    this.currentChannelId = '';
    this.selectedUser = null;
    this.userSubcollectionChannelId = '';

    if (userService) {
      userService.chatId = '';
      userService.showChannel = false;
      userService.showChatPartnerHeader = false;
      userService.showNewMessage = true;
    }
  }

  getUserData() {
    this.isChecked$.subscribe(user => {
      this.selectedUser = user;
    });
  }


  allChannelsName: string[] = [];
  userSubcollectionDescription: string = '';

  showAllChannels() {
    this.getAllChannels().subscribe(channels => {
      this.allChannelsName = channels.map(c => c.name);
    });
  }

  checkChannel() {
    this.updateChannelByUser.next(this.showChannelByUser);
  }

  async addUserToCh(channelId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post(
        `${environment.apiUrl}/channels/${channelId}/users`,
        { userId }
      ).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  async deleteUserFromCh(channelId: string, item: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.delete(
        `${environment.apiUrl}/channels/${channelId}/users/${this.currentUserId}`
      ).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }
}