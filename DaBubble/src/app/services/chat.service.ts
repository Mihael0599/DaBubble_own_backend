import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { MatDrawer } from '@angular/material/sidenav';
import * as signalR from '@microsoft/signalr';
import { UserService } from './user.service';
import { ChannelService } from './channel.service';
import { NavigationService } from './navigation.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private http = inject(HttpClient);
  private router = inject(Router);
  dataUser = inject(UserService);
  channelService = inject(ChannelService);
  navigationService = inject(NavigationService);

  private drawer!: MatDrawer;
  private hubConnection?: signalR.HubConnection;
  private _messages$ = new BehaviorSubject<any[]>([]);
  messages$ = this._messages$.asObservable();

  messages: any[] = [];
  messagesThread: any[] = [];
  hasMessages: boolean = false;
  hasMessagesThread: boolean = false;
  mostUsedEmojis: string[] = [];
  selectedUser: any;
  chatId: string = '';
  parentMessageId: string = '';
  threadId: string = '';
  isThreadAktiv: boolean = false;
  showThread: boolean = false;
  chatMode: 'chats' | 'channels' = 'chats';

  // SignalR Verbindung aufbauen
  startConnection() {
    const token = localStorage.getItem('token');
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/chat`, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start().catch(err => console.error('SignalR Error:', err));

    this.hubConnection.on('ReceiveMessage', (message: any) => {
      const current = this._messages$.value;
      this._messages$.next([...current, message]);
      this.hasMessages = true;
    });
  }

  async joinChannel(channelId: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('JoinChannel', channelId.toString());
    }
  }

  async leaveChannel(channelId: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('LeaveChannel', channelId.toString());
    }
  }

  getChannelMessages(channelId: string) {
    this.http.get<any[]>(
      `${environment.apiUrl}/messages/channel/${channelId}`
    ).subscribe(messages => {
      this._messages$.next(messages);
      this.hasMessages = messages.length > 0;
    });
  }

  getThreadMessages(parentMessageId: string) {
    this.http.get<any[]>(
      `${environment.apiUrl}/messages/${parentMessageId}/thread`
    ).subscribe(messages => {
      this.messagesThread = messages;
      this.hasMessagesThread = messages.length > 0;
    });
  }

  async sendChatMessage(type: string, messageText: string, senderId: any, name?: string, avatar?: string) {
    console.log('chatId:', this.chatId, 'chatMode:', this.chatMode);
    const body = {
      content: messageText,
      channelId: this.chatMode === 'channels' ? parseInt(this.chatId) : null
    };
    console.log('Sending:', body);
    this.http.post(`${environment.apiUrl}/messages`, body).subscribe({
      error: (err) => console.error('Error details:', err.error)
    });
  }

  async sendThreadMessage(type: string, chatId: string, rootId: string, senderId: string, text: string, senderName?: string, userAvatar?: string) {
    this.http.post(`${environment.apiUrl}/messages`, {
      content: text,
      channelId: this.chatMode === 'channels' ? parseInt(chatId) : null,
      parentMessageId: parseInt(rootId)
    }).subscribe(message => {
      this.messagesThread = [...this.messagesThread, message];
      this.hasMessagesThread = true;
    });
  }

  async updateUserMessage(type: string, messageId: string, newMessage: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.put(
        `${environment.apiUrl}/messages/${messageId}`,
        { content: newMessage }
      ).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  async saveEmojisInDatabase(type: string, selectedEmoji: string, messageId: string) {
    this.http.post(`${environment.apiUrl}/messages/${messageId}/reactions`, {
      emoji: selectedEmoji
    }).subscribe();
  }

  async saveEmojisThreadInDatabase(type: string, selectedEmoji: string, messageId: string, parentMessageId: string) {
    this.http.post(`${environment.apiUrl}/messages/${messageId}/reactions`, {
      emoji: selectedEmoji
    }).subscribe();
  }

  listenToMessages(type: string) {
    if (this.chatMode === 'channels') {
      this.getChannelMessages(this.chatId);
      this.joinChannel(this.chatId);
    }
  }

  listenToMessagesThread(type: string) {
    this.getThreadMessages(this.parentMessageId);
  }

  async answerOnMessage(type: string, parentMessageId: string, parentText: string, name?: string, avatar?: string) {
    this.checkIfChatOrChannel();
    this.parentMessageId = parentMessageId;
    this.showThread = true;
    this.open();
    this.router.navigate([
      '/mainpage',
      this.channelService.currentUserId,
      this.chatMode,
      this.chatId,
      'threads',
      parentMessageId
    ]);
    this.listenToMessagesThread(type);
    this.navigationService.setMobileHeaderDevspace(true);
  }

  async onUserClick(type: string, index: number, user: any) {
    this.chatMode = 'chats';
    this.selectedUser = user;
    this.channelService.setCheckdValue(user);
    this.close();
    this.dataUser.showChannel = false;
    this.dataUser.showChatPartnerHeader = true;
    this.navigationService.setMobileHeaderDevspace(true);
    if (this.navigationService.isMobile) {
      this.showThread = false;
    }
  }

  checkIfChatOrChannel() {
    if (this.chatMode === 'channels') {
      const channelId = this.channelService.currentChannelId;
      if (!channelId || channelId.trim() === '') return null;
      return this.chatId = channelId;
    }
    return null;
  }

  isFirstMessageOfDay(timestamp: any, index: number, messageArray?: any[]): boolean {
    const currentDate = this.getDateWithoutTime(new Date(timestamp));
    if (!currentDate) return false;
    if (index === 0) return true;
    const messages = messageArray || this.messages;
    if (!messages || index >= messages.length || index < 1) return true;
    const prevMsg = messages[index - 1];
    const prevDate = this.getDateWithoutTime(new Date(prevMsg?.sentAt || prevMsg?.timestamp));
    if (!prevDate) return true;
    return currentDate.getTime() !== prevDate.getTime();
  }

  private getDateWithoutTime(date: Date | undefined | null): Date | null {
    if (!date) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  getDateLabel(timestamp: any, messageIndex: number, messageArray?: any[]): string {
    const date = timestamp ? new Date(timestamp) : null;
    if (!date) return '';
    if (!this.isFirstMessageOfDay(timestamp, messageIndex, messageArray)) return '';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    if (msgDate.getTime() === todayDate.getTime()) return 'Heute';
    if (msgDate.getTime() === yesterdayDate.getTime()) return 'Gestern';
    return date.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
  }

  saveEmoji(emoji: string) {
    const stored = JSON.parse(localStorage.getItem('frequently') || '{}');
    stored[emoji] = (stored[emoji] || 0) + 1;
    localStorage.setItem('frequently', JSON.stringify(stored));
  }

  loadMostUsedEmojis() {
    const stored = localStorage.getItem('frequently');
    if (!stored) return;
    const recent = JSON.parse(stored) as Record<string, number>;
    this.mostUsedEmojis = Object.entries(recent)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([emoji]) => emoji);
  }

  getLastThreadReplyTime(messageId: string): Date | null {
    const message = this.messages.find(msg => msg.id === messageId);
    if (message?.lastThreadReply) {
      return new Date(message.lastThreadReply);
    }
    return null;
  }

  setDrawer(drawer: MatDrawer) { this.drawer = drawer; }
  toggle() { this.drawer?.toggle(); }
  open() { this.drawer?.open(); }
  close() { this.drawer?.close(); }
  isOpen(): boolean { return this.drawer?.opened || false; }

  ngOnDestroy() {
    this.hubConnection?.stop();
  }
}