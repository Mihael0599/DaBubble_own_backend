import { Component, inject, HostListener, runInInjectionContext, Injector } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UserService } from '../../services/user.service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { EditLogoutUserComponent } from './edit-logout-user/edit-logout-user.component';
import { ChannelService } from '../../services/channel.service';
import { SearchService, SearchResult } from '../../services/search.service';
import { ChatService } from '../../services/chat.service';
import { NavigationService } from '../../services/navigation.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-header',
  imports: [
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    CommonModule,
    DatePipe
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly dialog = inject(MatDialog);
  private dataUser = inject(UserService);
  public channelService = inject(ChannelService);
  private searchService = inject(SearchService);
  private chatService = inject(ChatService);
  navigationService = inject(NavigationService);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  onlineUser: string = 'status/online.png';
  offlineUser: string = 'status/offline.png';
  searchTerm: string = '';
  searchResults: any[] = [];
  channelResults: SearchResult[] = [];
  userResults: SearchResult[] = [];
  showDropdown: boolean = false;
  dropdownType: 'normal' | 'channel' | 'user' = 'normal';

  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const searchContainer = target.closest('.search-container');
    const searchResults = target.closest('.search-results');
    if (!searchContainer && !searchResults) {
      this.showDropdown = false;
    }
  }

  openDialog(enterAnimationDuration: string, exitAnimationDuration: string): void {
    this.dialog.open(EditLogoutUserComponent, {
      width: '250px',
      enterAnimationDuration,
      exitAnimationDuration,
    });
  }

  ngOnInit() {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.performSearch(term);
    });
  }

  onSearchInput() {
    const term = this.searchTerm;    
    if (this.isChannelSearch(term)) {
      this.dropdownType = 'channel';
      const channelKeyword = this.extractKeyword(term, '#');
      this.searchChannels(channelKeyword);
    } else if (this.isUserSearch(term)) {
      this.dropdownType = 'user';
      const userKeyword = this.extractKeyword(term, '@');
      this.searchUsers(userKeyword);      
    } else {
      this.dropdownType = 'normal';
      this.searchSubject.next(term);
    }
    this.showDropdown = term.length > 0;
  }

  private isChannelSearch(term: string): boolean {
    return /(?:^|[\s])#/.test(term);
  }

  private isUserSearch(term: string): boolean {
    return /(?:^|[\s])@/.test(term);
  }

  private extractKeyword(term: string, prefix: string): string {
    const lastIndex = term.lastIndexOf(prefix);
    if (lastIndex === -1) return '';
    const afterPrefix = term.substring(lastIndex + 1);
    const match = afterPrefix.match(/^([^\s]*)/);
    return match ? match[1] : '';
  }

  private performSearch(term: string) {
    if (term) {
      this.searchService.searchMessages(term).subscribe(results => {
        this.searchResults = results;
      });
    } else {
      this.searchResults = [];
    }
  }

  private searchChannels(keyword: string) {
    if (keyword) {
      this.searchService.searchChannels(keyword).subscribe(results => {
        this.channelResults = results;
      });
    } else {
      this.searchService.searchChannels('').subscribe(results => {
        this.channelResults = results;
      });
    }
  }

  private searchUsers(keyword: string) {
    if (keyword) {
      this.searchService.searchUsers(keyword).subscribe(results => {
        this.userResults = results;
        
        
      });
    } else {
      this.searchService.searchUsers('').subscribe(results => {
        this.userResults = results;
      });
    }
  }

  selectChannelResult(channel: SearchResult) {
    this.showDropdown = false;
    this.dropdownType = 'channel';
    this.searchTerm = '';
    this.openChannel(channel);
  }

  private openChannel(channel: SearchResult) {
    try {
      this.channelService.currentChannelId = channel.id;
      this.channelService.currentChannelName = channel.name;
      this.dataUser.getUserIdsFromChannel(channel.id);
      this.dataUser.showChannel = true;
      this.dataUser.showChatPartnerHeader = false;
      this.dataUser.showNewMessage = false;
      this.chatService.chatMode = 'channels';
      this.chatService.checkIfChatOrChannel();
      this.chatService.listenToMessages('channels');
      this.chatService.getChannelMessages(channel.id);
      this.channelService.setActiveChannelId(channel.id);
      this.router.navigate(['/mainpage', this.channelService.currentUserId, 'channels', channel.id]);
    } catch (error) {
      console.error('Fehler beim Öffnen des Channels:', error);
    }
  }

  selectUserResult(type: string, user: SearchResult) {
    this.showDropdown = false;
    this.dropdownType = 'user';
    this.searchTerm = '';
    this.openPrivateChat(type, user);
  }

  private async openPrivateChat(type: string, user: SearchResult) {
    try {
      const userForChat = {
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        active: user.description === 'Online'
      };
      await this.chatService.onUserClick(type, 0, userForChat);
    } catch (error) {
      console.log('Fehler beim Öffnen des privaten Chats:', error);
    }
  }

  selectMessageResult(result: SearchResult) {
    this.showDropdown = false;
    this.dropdownType = 'normal';
    this.searchTerm = '';
    if (result.type === 'message') {
      this.navigateToMessage(result);
    }
  }

  private navigateToMessage(messageResult: SearchResult) {
    try {
      if (messageResult.isDirectMessage) {
        this.navigateToDirectMessage(messageResult);
      } else if (messageResult.channelName) {
        this.navigateToChannelMessage(messageResult);
      }
    } catch (error) {
      console.error('Fehler beim Navigieren zur Nachricht:', error);
    }
  }

  private async navigateToDirectMessage(messageResult: SearchResult) {
    const { chatId, messageId } = this.parseMessageId(messageResult.id);
    if (!chatId || !messageId) return;
    try {
      const otherUser = await this.findChatPartner(chatId);
      if (otherUser) {
        await this.openDirectChat('chats', otherUser, messageId);
      }
    } catch (error) {
      console.error('Fehler beim Öffnen des Chats:', error);
    }
  }

  private parseMessageId(id: string): { chatId: string | null, messageId: string | null } {
    const idParts = id.split('-');
    if (idParts.length >= 3 && idParts[0] === 'chat') {
      return {
        chatId: idParts[1],
        messageId: idParts.slice(2).join('-')
      };
    }
    return { chatId: null, messageId: null };
  }

  private async findChatPartner(chatId: string): Promise<any> {
    const chatDoc = await this.getChatDocument(chatId);
    if (!chatDoc) return null;
    const chatUsers = chatDoc['userId'] || [];
    const otherUserId = chatUsers.find((userId: string) => userId !== this.channelService.currentUserId);
    return otherUserId ? await this.getUserById(otherUserId) : null;
  }

  private async openDirectChat(type: string, otherUser: any, messageId: string) {
    await this.chatService.onUserClick(type, 0, {
      userId: otherUser.userId,
      name: otherUser.name,
      avatar: otherUser.avatar,
      active: otherUser.active || false
    });
    this.dataUser.showChannel = false;
    this.dataUser.showChatPartnerHeader = true;
    this.router.navigate(['/mainpage', this.channelService.currentUserId]);
    setTimeout(() => {
      this.navigationService.navigateToMessage(messageId, true);
    }, 500);
  }

  private navigateToChannelMessage(messageResult: SearchResult) {
    const { channelId, messageId } = this.parseChannelMessageId(messageResult.id);
    if (!channelId || !messageId) return;

    const channel = this.findUserChannel(channelId);
    if (channel) {
      this.openChannelAndNavigateToMessage(channel, channelId, messageId);
    } else {
      console.log('Channel not found or user not a member');
    }
  }

  private parseChannelMessageId(id: string): { channelId: string | null, messageId: string | null } {
    const idParts = id.split('-');
    if (idParts.length >= 3 && idParts[0] === 'channel') {
      return {
        channelId: idParts[1],
        messageId: idParts.slice(2).join('-')
      };
    }
    return { channelId: null, messageId: null };
  }

  private findUserChannel(channelId: string): any {
    return this.channelService.showChannelByUser.find(ch => ch.channelId === channelId);
  }

  private openChannelAndNavigateToMessage(channel: any, channelId: string, messageId: string) {
    this.openChannel({
      id: channelId,
      name: channel.channelname,
      type: 'channel',
      description: channel.description
    });
    setTimeout(() => {
      this.navigationService.navigateToMessage(messageId, true);
    }, 500);
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
  }

  truncateDescription(text: string, maxWords: number = 6): string {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= maxWords) {
      return text;
    }
    return words.slice(0, maxWords).join(' ') + '...';
  }

  private async getChatDocument(chatId: string): Promise<any> {
    try {
      const chatSnap = await runInInjectionContext(this.injector, async () => {
        const chatDocRef = doc(this.firestore, 'chats', chatId);
        return await getDoc(chatDocRef);
      });
      return chatSnap.exists() ? chatSnap.data() : null;
    } catch (error) {
      console.error('Error getting chat document:', error);
      return null;
    }
  }

  private async getUserById(userId: string): Promise<any> {
    try {
      const userSnap = await this.getUserSnapshot(userId);
      return userSnap?.exists() ? this.mapUserData(userSnap) : null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  private async getUserSnapshot(userId: string) {
    return await runInInjectionContext(this.injector, async () => {
      const userDocRef = doc(this.firestore, 'users', userId);
      return await getDoc(userDocRef);
    });
  }

  private mapUserData(userSnap: any) {
    const userData = userSnap.data();
    return {
      userId: userSnap.id,
      name: userData['name'],
      avatar: userData['avatar'],
      active: userData['active'] || false
    };
  }

  mobileHeader() {
    this.navigationService._mobileHeaderDevspace.next(false);
  }
}