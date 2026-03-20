import { AfterViewInit, Component, inject, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { ChatService } from '../../services/chat.service';
import { MatIcon } from '@angular/material/icon';
import { NgFor, NgIf, NgStyle } from '@angular/common';
import { ChannelService } from '../../services/channel.service';
import { SentMessageComponent } from '../chat-section/sent-message/sent-message.component';
import { ReceivedMessageComponent } from '../chat-section/received-message/received-message.component';
import { UserService } from '../../services/user.service';
import { UserCardComponent } from '../user-card/user-card.component';
import { MatDialog } from '@angular/material/dialog';
import { ChannelSectionComponent } from '../channel-section/channel-section.component';
import { InputMessageComponent } from "../input-message/input-message.component";
import { HeaderChatSectionComponent } from '../header-chat-section/header-chat-section.component';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { EmojiPickerService } from '../../services/emojiPicker.service';

@Component({
  selector: 'app-thread-section',
  imports: [
    MatButtonModule,
    MatSidenavModule,
    NgIf,
    NgFor,
    SentMessageComponent,
    ReceivedMessageComponent,
    InputMessageComponent,
    HeaderChatSectionComponent,
    MatIcon,
    NgStyle,
    PickerComponent
  ],
  templateUrl: './thread-section.component.html',
  styleUrl: './thread-section.component.scss'
})
export class ThreadSectionComponent implements AfterViewInit, OnInit, AfterViewChecked {

  @ViewChild('drawer') drawer!: MatDrawer;
  @ViewChild('threadContainer') threadContainer!: ElementRef;
  @ViewChild('chatContainer', { static: false })
  chatContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('emojiPickerThread', { static: false }) emojiPickerThread!: ElementRef<HTMLElement>;
  dataUser = inject(UserService);
  chatService = inject(ChatService);
  channelService = inject(ChannelService);
  selectedUser: any;
  readonly userDialog = inject(MatDialog);
  dialog = inject(MatDialog);
  parentMessageId: string | undefined;
  private shouldScrollToBottom = false;
  private lastThreadMessageCount = 0;
  currentMessage?: any;
  currentMessageIndex?: number;

  constructor(private chatServices: ChatService, public emojiPickerService: EmojiPickerService) { }

  @ViewChild(MatDrawer) drawerT!: MatDrawer;

  ngAfterViewInit() {
    this.chatServices.setDrawer(this.drawer);
    this.drawerT?.open();
    this.scrollToBottom();
    setTimeout(() => this.emojiPickerService.bindElements('thread', this.threadContainer, this.emojiPickerThread));
  }

  ngAfterViewChecked(): void {
    if (this.chatService.messagesThread.length > this.lastThreadMessageCount) {
      this.lastThreadMessageCount = this.chatService.messagesThread.length;
      this.shouldScrollToBottom = true;
    }

    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnInit(): void {
    this.getUserData();
  }

  getUserData() {
    this.channelService.isChecked$.subscribe(user => {
      this.selectedUser = user;
      this.shouldScrollToBottom = true;
      this.lastThreadMessageCount = 0;
    })
  }

  private scrollToBottom(): void {
    try {
      if (this.threadContainer?.nativeElement) {
        setTimeout(() => {
          const element = this.threadContainer.nativeElement;
          element.scrollTop = element.scrollHeight;
        }, 200);
      }
    } catch (err) {
      console.error('Error scrolling to bottom in thread:', err);
    }
  }

  closeThread() {
    this.chatServices.close()
  }

  openUserDialog() {
    this.userDialog.open(UserCardComponent, {
      data: { user: this.selectedUser }
    })
  }

  openDialog(button: HTMLElement) {
    (document.activeElement as HTMLElement)?.blur();
    const rect = button.getBoundingClientRect();
    const dialog = this.dialog.open(ChannelSectionComponent, {
      position: {
        top: `${rect.bottom + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
      },
      width: '872px',
      height: '612px',
      maxWidth: '872px',
      maxHeight: '612px',
      panelClass: 'channel-dialog-container'
    });
  }

  openEmojiPicker(ev: { anchor: HTMLElement; side: 'left' | 'right'; message: any; index: number; context: 'chat' | 'thread' | 'channel' }) {
    this.currentMessage = ev.message; 
    this.emojiPickerService.open(ev);
  }

  hideAllEmojis() {
    this.emojiPickerService.hide('thread');
  }
  addEmoji(e: any) {
    const msg = this.emojiPickerService.state.thread;
    if (!msg) return;
    const emoji = e?.emoji?.native ?? e?.emoji ?? e;
    this.chatService.saveEmojisThreadInDatabase(this.chatService.chatMode,emoji, this.currentMessage.id, this.chatService.parentMessageId);
    this.emojiPickerService.hide('thread');
    this.chatService.loadMostUsedEmojis();
  }
}
