import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Observable, of, BehaviorSubject, from, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ChannelService } from './channel.service';
import { collection, Firestore, onSnapshot, getDocs, query, collectionGroup, where } from '@angular/fire/firestore';

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
  private channelService = inject(ChannelService);
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private allUsersCache: any[] = [];
  private usersSubject = new BehaviorSubject<any[]>([]);

  constructor() {
    this.setupUsersListener();
  }

  searchMessages(keyword: string): Observable<SearchResult[]> {
    if (!keyword.trim()) {
      return of([]);
    }
    return this.performMessageSearch(keyword);
  }

  private performMessageSearch(keyword: string): Observable<SearchResult[]> {
    return runInInjectionContext(this.injector, () => {
      const searchStreams = this.createSearchStreams(keyword);
      return this.combineSearchResults(searchStreams);
    });
  }

  private createSearchStreams(keyword: string) {
    return {
      chatMessages$: from(this.searchMessagesInChats(keyword)),
      channelMessages$: from(this.searchMessagesInChannels(keyword))
    };
  }

  private combineSearchResults(streams: { chatMessages$: Observable<SearchResult[]>, channelMessages$: Observable<SearchResult[]> }) {
    return forkJoin([streams.chatMessages$, streams.channelMessages$]).pipe(
      map(([chatMessages, channelMessages]) => [...chatMessages, ...channelMessages]),
      catchError(error => {
        console.error('Error searching messages:', error);
        return of([]);
      })
    );
  }

  private async searchMessagesInChats(keyword: string): Promise<SearchResult[]> {
    try {
      const chatsSnapshot = await this.getChatDocuments();     
      const results: SearchResult[] = [];      
      for (const chatDoc of chatsSnapshot.docs) {
        const chatResults = await this.processChatDocument(chatDoc, keyword);
        results.push(...chatResults);
      }
      return results.slice(0, 10);
    } catch (error) {
      console.error('Error searching chat messages:', error);
      return [];
    }
  }

  private async getChatDocuments() {
    return runInInjectionContext(this.injector, async () => {
      const chatsRef = collection(this.firestore, 'chats');
      return await getDocs(chatsRef);
    });
  }

  private async processChatDocument(chatDoc: any, keyword: string): Promise<SearchResult[]> {
    const chatId = chatDoc.id;
    const chatData = chatDoc.data();
    const chatUsers = chatData['userId'] || [];
    if (!this.isUserChatMember(chatUsers)) {
      return [];
    }
    const messagesSnapshot = await this.getChatMessages(chatId);
    return this.extractMatchingMessages(messagesSnapshot, chatId, keyword, true);
  }

  private isUserChatMember(chatUsers: string[]): boolean {
    const isMember = chatUsers.includes(this.channelService.currentUserId);
    return isMember;
  }

  private async getChatMessages(chatId: string) {
    return runInInjectionContext(this.injector, async () => {
      const messagesRef = collection(this.firestore, `chats/${chatId}/message`);
      return await getDocs(messagesRef);
    });
  }

  private async extractMatchingMessages(
    messagesSnapshot: any,
    containerId: string,
    keyword: string,
    isDirectMessage: boolean,
    containerName?: string
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    for (const messageDoc of messagesSnapshot.docs) {
      const messageData = messageDoc.data();
      const messageText = messageData['text'] || '';
      if (this.messageMatchesKeyword(messageText, keyword)) {
        const result = await this.createMessageResult(
          messageDoc,
          messageData,
          containerId,
          isDirectMessage,
          containerName
        );
        results.push(result);
      }
    }
    return results;
  }

  private messageMatchesKeyword(messageText: string, keyword: string): boolean {
    return messageText.toLowerCase().includes(keyword.toLowerCase());
  }

  private async createMessageResult(
    messageDoc: any,
    messageData: any,
    containerId: string,
    isDirectMessage: boolean,
    containerName?: string
  ): Promise<SearchResult> {
    const senderName = await this.getSenderName(messageData['senderId']);
    const prefix = isDirectMessage ? 'chat' : 'channel';
    const displayName = isDirectMessage ? `von ${senderName}` : `Nachricht in #${containerName}`;
    return {
      id: `${prefix}-${containerId}-${messageDoc.id}`,
      name: displayName,
      type: 'message',
      description: this.truncateText(messageData['text'], 100),
      messageText: messageData['text'],
      senderName: senderName,
      timestamp: messageData['timestamp'],
      isDirectMessage: isDirectMessage,
      ...(containerName && { channelName: containerName })
    };
  }

  private async searchMessagesInChannels(keyword: string): Promise<SearchResult[]> {
    try {      
      const channelsSnapshot = await this.getChannelDocuments();      
      const results: SearchResult[] = [];
      for (const channelDoc of channelsSnapshot.docs) {
        const channelResults = await this.processChannelDocument(channelDoc, keyword);
        results.push(...channelResults);
      }
      return results.slice(0, 10);
    } catch (error) {
      console.error('Error searching channel messages:', error);
      return [];
    }
  }

  private async getChannelDocuments() {
    return runInInjectionContext(this.injector, async () => {
      const channelsRef = collection(this.firestore, 'channels');
      return await getDocs(channelsRef);
    });
  }

  private async processChannelDocument(channelDoc: any, keyword: string): Promise<SearchResult[]> {
    const channelId = channelDoc.id;
    const channelData = channelDoc.data();
    const channelName = channelData['channelname'] || 'Unbekannter Channel';
    if (!this.isUserChannelMember(channelData)) {
      return [];
    }
    try {
      const messagesSnapshot = await this.getChannelMessages(channelId);
      return this.extractMatchingMessages(messagesSnapshot, channelId, keyword, false, channelName);
    } catch (error) {
      return [];
    }
  }

  private isUserChannelMember(channelData: any): boolean {
    const userIds = channelData['userId'] || [];
    return userIds.includes(this.channelService.currentUserId);
  }

  private async getChannelMessages(channelId: string) {
    return runInInjectionContext(this.injector, async () => {
      const messagesRef = collection(this.firestore, `channels/${channelId}/message`);
      return await getDocs(messagesRef);
    });
  }


  private async getSenderName(senderId: string): Promise<string> {
    try {
      const user = this.allUsersCache.find(u => u.userId === senderId);
      return user?.name || 'Unbekannter User';
    } catch (error) {
      return 'Unbekannter User';
    }
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  searchChannels(keyword: string): Observable<SearchResult[]> {
    const userChannels = this.getUserChannels();
    const filteredChannels = this.filterAndMapChannels(userChannels, keyword);
    return of(filteredChannels);
  }

  private getUserChannels(): any[] {
    return this.channelService.showChannelByUser || [];
  }

  private filterAndMapChannels(channels: any[], keyword: string): SearchResult[] {
    return channels
      .filter(channel => this.channelMatchesKeyword(channel, keyword))
      .map(channel => this.mapChannelToSearchResult(channel))
      .slice(0, 10);
  }

  private channelMatchesKeyword(channel: any, keyword: string): boolean {
    return channel.channelname &&
      channel.channelname.toLowerCase().includes(keyword.toLowerCase());
  }

  private mapChannelToSearchResult(channel: any): SearchResult {
    return {
      id: channel.channelId || channel.id,
      name: channel.channelname,
      type: 'channel' as const,
      description: channel.description
    };
  }

  searchUsers(keyword: string): Observable<SearchResult[]> {
    const allUsers = this.getAllUsersFromCache();
    const filteredUsers = this.filterAndMapUsers(allUsers, keyword);
    return of(filteredUsers);
  }

  searchUsersByEmail(keyword: string): Observable<SearchResult[]> {
    const allUsers = this.getAllUsersFromCache();
    const filteredUsers = this.filterAndMapUsersByEmail(allUsers, keyword);
    return of(filteredUsers);
  }

  private filterAndMapUsers(users: any[], keyword: string): SearchResult[] {
    return Array.from(users)
      .filter(user => this.isValidUser(user, keyword))
      .map(user => this.mapUserToSearchResult(user))
      .slice(0, 10);
  }

  private filterAndMapUsersByEmail(users: any[], keyword: string): SearchResult[] {
    return Array.from(users)
      .filter(user => this.isValidUserForEmail(user, keyword))
      .map(user => this.mapUserToSearchResult(user))
      .slice(0, 10);
  }

  private isValidUser(user: any, keyword: string): boolean {
    const hasName = this.hasValidName(user);
    const matchesKeyword = this.userMatchesKeyword(user, keyword);
    const notCurrentUser = this.isNotCurrentUser(user);

    return hasName && matchesKeyword && notCurrentUser;
  }

  private isValidUserForEmail(user: any, keyword: string): boolean {
    const hasEmail = this.hasValidEmail(user);
    const matchesKeyword = this.emailMatchesKeyword(user, keyword);
    const notCurrentUser = this.isNotCurrentUser(user);
    return hasEmail && matchesKeyword && notCurrentUser;
  }

  private hasValidName(user: any): boolean {
    return user.name && typeof user.name === 'string';
  }

  private hasValidEmail(user: any): boolean {
    return user.email && typeof user.email === 'string';
  }

  private userMatchesKeyword(user: any, keyword: string): boolean {
    if (!keyword) return true;
    return this.hasValidName(user) &&
      user.name.toLowerCase().includes(keyword.toLowerCase());
  }

  private emailMatchesKeyword(user: any, keyword: string): boolean {
    if (!keyword) return true;
    return this.hasValidEmail(user) &&
      user.email.toLowerCase().includes(keyword.toLowerCase());
  }

  private isNotCurrentUser(user: any): boolean {
    return user.userId !== this.channelService.currentUser?.userId;
  }

  private mapUserToSearchResult(user: any): SearchResult {
    return {
      id: user.userId || user.id,
      name: user.name,
      type: 'user' as const,
      avatar: user.avatar,
      description: user.active ? 'Online' : 'Offline',
      email: user.email
    };
  }

  private setupUsersListener() {
    const usersCollection = collection(this.firestore, 'users');
    onSnapshot(usersCollection,
      (snapshot) => this.handleUsersSnapshot(snapshot),
      (error) => this.handleUsersListenerError(error)
    );
  }

  private handleUsersSnapshot(snapshot: any) {
    this.clearUsersCache();
    this.populateUsersCache(snapshot);
    this.notifyUsersUpdate();
  }

  private clearUsersCache() {
    this.allUsersCache = [];
  }

  private populateUsersCache(snapshot: any) {
    snapshot.forEach((doc: any) => {
      const userDoc = this.createUserFromDocument(doc);
      this.allUsersCache.push(userDoc);
    });
  }

  private createUserFromDocument(doc: any) {
    const userData = doc.data();
    return {
      userId: doc.id,
      name: userData['name'],
      email: userData['email'],
      avatar: userData['avatar'],
      active: userData['active'] || false
    };
  }

  private notifyUsersUpdate() {
    this.usersSubject.next(this.allUsersCache);
  }

  private handleUsersListenerError(error: any) {
    console.error('Error setting up users listener:', error);
  }

  getAllUsersFromCache(): any[] {
    return this.allUsersCache;
  }

  getUsersObservable(): Observable<any[]> {
    return this.usersSubject.asObservable();
  }
}