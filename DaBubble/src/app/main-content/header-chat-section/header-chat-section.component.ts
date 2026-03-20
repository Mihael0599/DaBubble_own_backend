import { AsyncPipe, NgClass, NgFor, NgIf, CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
  HostListener,
  OnDestroy,
  Input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ChannelService } from '../../services/channel.service';
import { MatDialog } from '@angular/material/dialog';
import { ChannelSectionComponent } from '../channel-section/channel-section.component';
import { UserCardComponent } from '../user-card/user-card.component';
import { ChatService } from '../../services/chat.service';
import { AddUserToChannelComponent } from '../channel-section/add-user-to-channel/add-user-to-channel.component';
import { UsersInChannelComponent } from '../channel-section/users-in-channel/users-in-channel.component';
import { SearchService, SearchResult } from '../../services/search.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-header-chat-section',
  imports: [NgIf, NgClass, AsyncPipe, FormsModule, CommonModule, MatIconModule, NgFor],
  templateUrl: './header-chat-section.component.html',
  styleUrl: './header-chat-section.component.scss',
})
export class HeaderChatSectionComponent implements OnInit, AfterViewInit, OnDestroy {
  dataUser = inject(UserService);
  channelService = inject(ChannelService);
  chatService = inject(ChatService);
  dialog = inject(MatDialog);
  userDialog = inject(MatDialog);
  navigationService = inject(NavigationService);

  private searchService = inject(SearchService);
  private router = inject(Router);

  onlineUser: string = 'status/online.png';
  offlineUser: string = 'status/offline.png';

  newMessageSearchTerm: string = '';
  channelResults: SearchResult[] = [];
  userResults: SearchResult[] = [];
  emailResults: SearchResult[] = [];
  showDropdown: boolean = false;
  dropdownType: 'channel' | 'user' | 'email' = 'channel';
  @Input() mode: 'chats' | 'thread' = 'chats';

  @ViewChild('referenceButton') referenceButton?: ElementRef<HTMLButtonElement>;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const searchContainer = target.closest('.new-message-input-container');
    const searchResults = target.closest('.search-results');
    if (!searchContainer && !searchResults) {
      this.showDropdown = false;
    }
  }

  ngOnInit(): void {
    this.getUserData();
  }

  ngAfterViewInit() {
    this.setButtonRectIfAvailable();
  }

  private setButtonRectIfAvailable() {
    if (this.referenceButton?.nativeElement) {
      try {
        const rect = this.referenceButton.nativeElement.getBoundingClientRect();
        this.channelService.setButtonRect(rect);
      } catch (error) {
        console.warn('Error getting button rect:', error);
      }
    }
  }

  getUserData() {
    this.channelService.isChecked$.subscribe((user) => {
      this.chatService.selectedUser = user;
    });
  }

  onNewMessageSearchInput() {
    const term = this.newMessageSearchTerm;
    if (this.isChannelSearch(term)) {
      this.dropdownType = 'channel';
      const channelKeyword = this.extractKeyword(term, '#');
      this.searchChannels(channelKeyword);
    } else if (this.isUserSearch(term)) {
      this.dropdownType = 'user';
      const userKeyword = this.extractKeyword(term, '@');
      this.searchUsers(userKeyword);
    } else if (this.isEmailSearch(term)) {
      this.dropdownType = 'email';
      this.searchEmails(term);
    } else {
      this.showDropdown = false;
      return;
    }
    this.showDropdown = term.length > 0;
  }

  private isChannelSearch(term: string): boolean {
    return /(?:^|[\s])#/.test(term);
  }

  private isUserSearch(term: string): boolean {
    return /(?:^|[\s])@/.test(term);
  }

  private isEmailSearch(term: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+/;
    return emailPattern.test(term.trim()) && !term.trim().startsWith('@');
  }

  private extractKeyword(term: string, prefix: string): string {
    const lastIndex = term.lastIndexOf(prefix);
    if (lastIndex === -1) return '';
    const afterPrefix = term.substring(lastIndex + 1);
    const match = afterPrefix.match(/^([^\s]*)/);
    return match ? match[1] : '';
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

  private searchEmails(keyword: string) {
    if (keyword) {
      this.searchService.searchUsersByEmail(keyword).subscribe(results => {
        this.emailResults = results;
      });
    } else {
      this.searchService.searchUsersByEmail('').subscribe(results => {
        this.emailResults = results;
      });
    }
  }

  selectChannelResult(channel: SearchResult) {
    this.showDropdown = false;
    this.newMessageSearchTerm = '';
    this.navigateToChannel(channel);

  }

  private navigateToChannel(channel: SearchResult) {
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
    setTimeout(() => {
      this.navigationService.triggerScrollToBottom();
    }, 500);
  }

  selectUserResult(type: string, user: SearchResult) {
    this.showDropdown = false;
    this.newMessageSearchTerm = '';
    this.navigateToPrivateChat(type, user);
  }

  private async navigateToPrivateChat(type: string, user: SearchResult) {
    try {
      const userForChat = {
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        active: user.description === 'Online'
      };
      await this.chatService.onUserClick(type, 0, userForChat);
      this.dataUser.showChannel = false;
      this.dataUser.showChatPartnerHeader = true;
      this.dataUser.showNewMessage = false;
    } catch (error) {
      console.error('Error opening private chat:', error);
    }
  }

  selectEmailResult(user: SearchResult) {
    this.showDropdown = false;
    this.newMessageSearchTerm = '';
    this.openUserDialogByEmail(user);
  }

  private openUserDialogByEmail(user: SearchResult) {
    const userForDialog = {
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      active: user.description === 'Online',
      email: user.email || this.getUserEmail(user.id)
    };
    this.userDialog.open(UserCardComponent, {
      data: { user: userForDialog },
    });
  }

  getUserEmail(userId: string): string {
    const allUsers = this.searchService.getAllUsersFromCache();
    const user = allUsers.find(u => u.userId === userId);
    return user?.email || '';
  }

  truncateDescription(text: string, maxWords: number = 6): string {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length <= maxWords) {
      return text;
    }
    return words.slice(0, maxWords).join(' ') + '...';
  }

  openDialog(button: HTMLElement) {
    (document.activeElement as HTMLElement)?.blur();
    const isMobile = this.navigationService.isMobile;
    let width = isMobile ? '100vw' : '872px';
    let height = isMobile ? '100vh' : '612px';
    if (window.innerHeight <= 1200 && !isMobile) {
      height = '500px';
    }
    const position = isMobile
    ? { top: '0', left: '0' }
    : {
        top: `${button.getBoundingClientRect().bottom + window.scrollY}px`,
        left: `${button.getBoundingClientRect().left + window.scrollX}px`,
      };
    this.dialog.open(ChannelSectionComponent, {
    autoFocus: false, width, height,
    maxWidth: this.navigationService.mobileScreenWidth ? '100vw' : '872px',
    maxHeight: this.navigationService.mobileScreenWidth ? '100vh' : height,
    position,
    panelClass: 'open-channel-dialog-container',
    });
  }

  openUserDialog() {
    this.userDialog.open(UserCardComponent, {
      data: { user: this.chatService.selectedUser },
    });
  }

  addUserToChannel(div: HTMLElement) {
    (document.activeElement as HTMLElement)?.blur();
    const rect = div.getBoundingClientRect();
    const dialogWidth = 514;
    this.dialog.open(AddUserToChannelComponent, {
    autoFocus: false,
    position: {
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.right + window.scrollX - dialogWidth}px`,
      },
    width: '514px',
    height: '294px',
    maxWidth: '514px',
    maxHeight: '294px',
    panelClass: 'add-user',
    });
  }

  showUsersInChannel(div: HTMLElement) {
    (document.activeElement as HTMLElement)?.blur();
    const rect = div.getBoundingClientRect();
    const dialogWidth = 415;
    this.dialog.open(UsersInChannelComponent, {
      autoFocus: false,
      position: {
        top: `${rect.bottom + window.scrollY - 12}px`,
        left: `${rect.right + window.scrollX - dialogWidth}px`,
      },
      width: '415px',
      height: '411px',
      maxWidth: '415px',
      maxHeight: '415px',
      panelClass: 'user-in-channel',
    });
  }

  showUsersInChannelMobile(div: HTMLElement) {
    (document.activeElement as HTMLElement)?.blur();
    const rect = div.getBoundingClientRect();
    let config: any = {
    autoFocus: false,
    panelClass: 'user-in-channel',
    };
    if (this.navigationService.mobileScreenWidth) {
    config.width = '90vw';
    config.maxWidth = '90vw';
    config.position = {
      top: `${rect.bottom + window.scrollY + 150}px`,
    };
  }
  this.dialog.open(UsersInChannelComponent, config);
  }

  ngOnDestroy() {
  }
}