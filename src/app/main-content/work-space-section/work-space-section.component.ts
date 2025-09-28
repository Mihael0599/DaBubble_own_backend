import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  viewChild,
  HostListener,
  runInInjectionContext,
  Injector,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { AsyncPipe, CommonModule, DatePipe, NgFor } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { CreateChannelSectionComponent } from '../create-channel-section/create-channel-section.component';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, Subject } from 'rxjs';
import { User } from '../../../models/user.class';
import { Allchannels } from '../../../models/allchannels.class';
import { ChannelService } from '../../services/channel.service';
import { ChatService } from '../../services/chat.service';
import { Userstorage } from '../../../models/userStorage.class';
import { FormsModule } from '@angular/forms';
import { NavigationService } from '../../services/navigation.service';
import { ChatSectionComponent } from '../chat-section/chat-section.component';
import { SearchService, SearchResult } from '../../services/search.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { ChannelSectionComponent } from '../channel-section/channel-section.component';

@Component({
  selector: 'app-work-space-section',
  imports: [
    MatButtonModule,
    MatSidenavModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIcon,
    MatExpansionModule,
    MatAccordion,
    MatInputModule,
    NgFor,
    AsyncPipe,
    CommonModule,
    FormsModule,
    ChatSectionComponent,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './work-space-section.component.html',
  styleUrl: './work-space-section.component.scss',
})
export class WorkSpaceSectionComponent implements OnInit, OnDestroy {

  dataUser = inject(UserService);
  channelService = inject(ChannelService);
  chatService = inject(ChatService);
  navigationService = inject(NavigationService);
  private router = inject(Router);
  route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private searchService = inject(SearchService);
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  
  unsubChannels!: Subscription;
  private userDataSub?: Subscription;
  private channelDataSub?: Subscription;
  private searchSub?: Subscription;
  
  newChannel = new Allchannels();
  userstorage = new Userstorage();
  isDrawerOpen = true;
  selectedUser: any;
  urlUserId!: string;
  users$: Observable<User[]> | undefined;
  myPanel: any = true;

  channels$: Observable<Allchannels[]> | undefined;
  onlineUser: string = 'status/online.png';
  offlineUser: string = 'status/offline.png';
  imgSrc: string = 'work-space/edit-square.png';

  accordion = viewChild.required(MatAccordion);
  activeChannelId!: string;
  activeUserId!: string;
  searchTerm: string = '';
  routeSub: Subscription | undefined;

  // Search functionality properties
  searchResults: any[] = [];
  channelResults: SearchResult[] = [];
  userResults: SearchResult[] = [];
  showDropdown: boolean = false;
  dropdownType: 'normal' | 'channel' | 'user' = 'normal';
  private searchSubject = new Subject<string>();

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const searchContainer = target.closest('.search-container');
    const searchResults = target.closest('.search-results');
    if (!searchContainer && !searchResults) {
      this.showDropdown = false;
    }
  }


  onChange(user: any) {
    console.log(user);
  }

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      if (params['id']) {
        this.channelService.currentUserId = params['id'];
        this.dataUser.showCurrentUserData();
      }
    });
    this.channels$ = this.channelService.showChannelByUser$;
    this.users$ = this.dataUser.getAllUsers();
    this.getUserData();
    this.getChannelData();
    this.initializeSearch();
  }

  initializeSearch() {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.performSearch(term);
    });
  }

  getUserData() {
    this.userDataSub = this.channelService.isChecked$.subscribe(user => {
      this.selectedUser = user;
      this.activeUserId = user?.userId || '';
      if (user?.userId) {
        this.activeChannelId = '';
        this.dataUser.showNewMessage = false;
        this.dataUser.showChannel = false;
        this.dataUser.showChatPartnerHeader = true;
      }
      this.cdr.detectChanges();
    })
  }

  getChannelData() {
    this.channelDataSub = this.channelService.activeChannelId$.subscribe(channelId => {
      this.activeChannelId = channelId;
      if (channelId) {
        this.activeUserId = '';
      }
      this.cdr.detectChanges();
    })
  }

  toggleDrawer(drawer: MatDrawer) {
    this.isDrawerOpen = !this.isDrawerOpen;
    drawer.toggle();
  }

  readonly dialog = inject(MatDialog);

  createChannel() {
    (document.activeElement as HTMLElement)?.blur();
    this.dialog.open(CreateChannelSectionComponent, {
      width: '872px',
      height: '539px',
      maxWidth: '872px',
      maxHeight: '539px',
      panelClass: 'channel-dialog-container',
    });
  }

  async openChannel(type: string, channelName: string, channelId: string, channelDescription: string,) {
    this.chatService.chatMode = 'channels';
    this.dataUser.showChannel = true;
    this.dataUser.showChatPartnerHeader = false;
    this.dataUser.showNewMessage = false;
    this.activeUserId = '';
    this.router.navigate(['mainpage', this.channelService.currentUserId, 'channels', channelId,]);
    this.userstorage.channelId = channelId;
    this.userstorage.showChannel = true;
    this.getChannelNameandId(channelName, channelId, channelDescription);
    this.channelService.updateUserStorage(this.channelService.currentUserId, this.channelService.userSubcollectionId, this.userstorage.toJSON(['channelId', 'showChannel']));
    this.chatService.checkIfChatOrChannel();
    this.chatService.listenToMessages(type);
    this.chatService.getChannelMessages(channelId);
    this.channelService.setCheckdValue(channelId);
    this.navigationService._mobileHeaderDevspace.next(true);
  }

  getChannelNameandId(channelName: string, channelId: string, channelDescription: string) {
    this.activeChannelId = channelId;
    this.channelService.currentChannelId = channelId;
    this.channelService.currentChannelName = channelName;
    this.channelService.currentChannelDescription = channelDescription;
    this.channelService.getChannelUserId(this.activeChannelId);
    this.dataUser.getUserIdsFromChannel(channelId);
  }

  ngOnDestroy(): void {
    this.unsubChannels?.unsubscribe();
    this.userDataSub?.unsubscribe();
    this.channelDataSub?.unsubscribe();
    this.searchSub?.unsubscribe();
    this.routeSub?.unsubscribe();
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
    this.openChannelFromSearch(channel);
  }

  private openChannelFromSearch(channel: SearchResult) {
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
    this.openPrivateChatFromSearch(type, user);
  }

  private async openPrivateChatFromSearch(type: string, user: SearchResult) {
    try {
      const userForChat = {
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        active: user.description === 'Online'
      };
      await this.chatService.onUserClick(type, 0, userForChat);
    } catch (error) {
      console.error('Fehler beim Öffnen des privaten Chats:', error);
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
    this.openChannelFromSearch({
      id: channelId,
      name: channel.channelname,
      type: 'channel',
      description: channel.description
    });
    setTimeout(() => {
      this.navigationService.navigateToMessage(messageId, true);
    }, 500);
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

  openNewMessage() {
    this.dataUser.showNewMessage = true;
    this.dataUser.showChannel = false;
    this.dataUser.showChatPartnerHeader = false;
    this.activeChannelId = '';
    this.activeUserId = '';
    this.router.navigate(['mainpage', this.channelService.currentUserId, 'new-message']);
    }
}