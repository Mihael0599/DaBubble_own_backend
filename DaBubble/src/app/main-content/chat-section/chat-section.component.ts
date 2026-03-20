import { Component, ElementRef, inject, Injector, OnInit, runInInjectionContext, ViewChild, AfterViewInit, AfterViewChecked, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { UserService } from '../../services/user.service';
import { NavigationService } from '../../services/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { docData, onSnapshot } from '@angular/fire/firestore';
import { User } from '../../../models/user.class';
import { Observable, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AsyncPipe, NgClass, NgFor, NgIf, NgStyle } from '@angular/common';
import { UserCardComponent } from '../user-card/user-card.component';
import { ReceivedMessageComponent } from './received-message/received-message.component';
import { SentMessageComponent } from "./sent-message/sent-message.component";
import { ChatService } from '../../services/chat.service';
import { ChannelService } from '../../services/channel.service';
import { InputMessageComponent } from '../input-message/input-message.component';
import { HeaderChatSectionComponent } from "../header-chat-section/header-chat-section.component";
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { EmojiPickerService } from '../../services/emojiPicker.service';
import { ChannelSectionComponent } from '../channel-section/channel-section.component';

@Component({
  selector: 'app-chat-section',
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    NgClass,
    ReceivedMessageComponent,
    SentMessageComponent,
    InputMessageComponent,
    HeaderChatSectionComponent,
    SentMessageComponent,
    NgStyle,
    PickerComponent,
  ],
  templateUrl: './chat-section.component.html',
  styleUrl: './chat-section.component.scss'
})

export class ChatSectionComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  constructor(public pickerService: EmojiPickerService) { }
  @ViewChild('chatContainer', { static: false }) chatContainer!: ElementRef<HTMLElement>;
  @ViewChild('emojiPickerChat', { static: false }) emojiPickerChat!: ElementRef<HTMLElement>;
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef<HTMLElement>;

  dataUser = inject(UserService);
  channelService = inject(ChannelService);
  private injector = inject(Injector);
  chatService = inject(ChatService);
  navigationService = inject(NavigationService);
  route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  dialog = inject(MatDialog);
  readonly userDialog = inject(MatDialog);
  unsubscribeUserData!: Subscription;
  private routeSub?: Subscription;
  private navigationSub?: Subscription;
  unsubscribeUserChannels?: () => void;
  users$: Observable<User[]> | undefined;
  users: any;
  selectedUser: any;
  showEmojis: boolean = false;
  showEmojisMessage: boolean = false;
  readonly emojiDialog = inject(MatDialog);
  private shouldScrollToBottom = false;
  private lastMessageCount = 0;
  currentMessage?: any;
  currentMessageIndex?: number;
  anchorSide: 'left' | 'right' = 'left';
  trackById = (_: number, m: any) => m?.id ?? _;

  ngOnInit(): void {    
    this.setupRouteSubscription();
    this.setupNavigationSubscription();
  }

  private setupRouteSubscription(): void {
    this.routeSub = this.route.params.subscribe(params => {
      this.channelService.currentUserId = params['id'];
      this.handleRouteNavigation();
      this.handleChannelRoute();
      this.initializeComponent();
    });
  }

  private handleRouteNavigation(): void {
    const isNewMessageRoute = this.route.snapshot.url.length > 0 && this.route.snapshot.url[0].path === 'new-message';
    if (isNewMessageRoute) {
      this.setNewMessageMode();
    }
  }

  private setNewMessageMode(): void {
    this.dataUser.showNewMessage = true;
    this.dataUser.showChannel = false;
    this.dataUser.showChatPartnerHeader = false;
  }

  private handleChannelRoute(): void {
    const url = window.location.href;
    const channelMatch = url.match(/\/channels\/([^\/\?#]+)/);
/*     if (channelMatch) {
      const channelId = channelMatch[1];
      this.initializeChannelMode(channelId);
    } */
  }

  private initializeComponent(): void {
    this.showCurrentUserData();
    this.showUserChannel();
    this.getUserData();
    this.shouldScrollToBottom = true;
  }

  private setupNavigationSubscription(): void {
    this.navigationSub = this.navigationService.scrollToMessage$.subscribe(scrollTarget => {
      if (scrollTarget) {
        setTimeout(() => {
          this.scrollToMessage(scrollTarget.messageId, scrollTarget.highlight);
        }, 500);
      }
    });
    
    this.navigationService.scrollToBottom$.subscribe(shouldScroll => {
      if (shouldScroll) {
        setTimeout(() => {
          this.scrollToBottom();
        }, 500);
      }
    });
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
    setTimeout(() => this.pickerService.bindElements('chat', this.chatContainer, this.emojiPickerChat));
  }

  ngAfterViewChecked(): void {
    if (this.chatService.messages.length > this.lastMessageCount) {
      this.lastMessageCount = this.chatService.messages.length;
      this.shouldScrollToBottom = true;
    }

    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  getUserData() {
    this.channelService.isChecked$.subscribe(user => {
      this.selectedUser = user;
      this.shouldScrollToBottom = true;
      this.lastMessageCount = 0;
    })
  }

  showCurrentUserData() {
    const userRef = this.dataUser.getSingleUserRef(this.channelService.currentUserId);
    this.unsubscribeUserData = runInInjectionContext(this.injector, () => docData(userRef).subscribe(data => {
      this.channelService.currentUser = new User(data);
    }));
  }

  showUserChannel() {
    const channelRef = this.channelService.getChannelRef();
    this.unsubscribeUserChannels = runInInjectionContext(this.injector, () =>
      onSnapshot(channelRef, (snapshot) => {
        this.channelService.channels = [];
        snapshot.forEach(doc => {
          this.channelService.channels.push({
            ...doc.data(),
            channelId: doc.id
          });
        });
      })
    );
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer?.nativeElement) {
        setTimeout(() => {
          const element = this.messagesContainer.nativeElement;
          element.scrollTop = element.scrollHeight;
        }, 500);
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  openUserDialog() {
    this.userDialog.open(UserCardComponent, {
      data: { user: this.selectedUser }
    })
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.navigationSub?.unsubscribe();
    if (this.unsubscribeUserChannels) {
      this.unsubscribeUserChannels()
    }
    if (this.unsubscribeUserChannels) {
      this.unsubscribeUserChannels();
    }
  }

  private scrollToMessage(messageId: string, highlight: boolean = true): void {
    try {
      const targetElement = this.findMessageElement(messageId);
      if (targetElement) {
        this.scrollToElement(targetElement);
        if (highlight) {
          this.highlightMessage(targetElement);
        }
        this.navigationService.clearScrollTarget();
      } else {
        console.log('Message not found:', messageId);
      }
    } catch (error) {
      console.error('Error scrolling to message:', error);
    }
  }

  private findMessageElement(messageId: string): Element | null {
    const messageElements = document.querySelectorAll('[data-message-id]');
    for (const element of messageElements) {
      if (element.getAttribute('data-message-id') === messageId) {
        return element;
      }
    }
    return null;
  }

  private scrollToElement(element: Element): void {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  private highlightMessage(element: Element): void {
    element.classList.add('highlighted-message');
    setTimeout(() => {
      element.classList.remove('highlighted-message');
    }, 3000);
  }

  hideAllEmojis() {
    this.showEmojis = false;
  }
  
openEmojiPicker(ev: { anchor: HTMLElement; side: 'left'|'right'; message: any; index: number; context: 'chat'|'thread'; }) {
  this.pickerService.open(ev);
}

  @HostListener('window:resize')
  onResize() { this.pickerService.reposition('chat'); }

  addEmoji(e: any) {
    const s = this.pickerService.state.chat;
    if (!s.currentMessage) return;
    const emoji = e?.emoji?.native ?? e?.emoji ?? e;
    this.chatService.saveEmojisInDatabase('chats', emoji, s.currentMessage.id);
    this.pickerService.hide('chat');
  }

  openDialog(button: HTMLElement) {
    (document.activeElement as HTMLElement)?.blur();
    const rect = button.getBoundingClientRect();
    const width = window.innerWidth < 1080 ? '800px' : '872px';
    const height = window.innerHeight < 700 ? '500px' : '612px';

    const dialogWidth = parseInt(width, 10);
    const dialogHeight = parseInt(height, 10);

    const top = rect.top - dialogHeight + window.scrollY;
    const left = rect.left - dialogWidth / 2 + window.scrollX - 300;

    const dialogRef = this.dialog.open(ChannelSectionComponent, {
      position: {
        top: `${top}px`,
        left: `${left}px`,
      },
      width,
      height,
      maxWidth: '872px',
      maxHeight: '612px',
      panelClass: 'channel-dialog-container',
    });
  }
}
