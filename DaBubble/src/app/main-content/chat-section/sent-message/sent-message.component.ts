import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ChatService } from '../../../services/chat.service';
import { UserService } from '../../../services/user.service';
import { ChannelService } from '../../../services/channel.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormField } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { FormsModule } from '@angular/forms';
import { EmojiPickerService, PickerContext } from '../../../services/emojiPicker.service';
type PickerSide = 'left' | 'right';

@Component({
  selector: 'app-sent-message',
  imports: [
    DatePipe,
    NgIf,
    MatMenuModule,
    MatFormField,
    MatInputModule,
    NgClass,
    PickerComponent,
    FormsModule,
    NgFor,
  ],
  templateUrl: './sent-message.component.html',
  styleUrl: './sent-message.component.scss'
})
export class SentMessageComponent implements OnInit {

  public chatService = inject(ChatService);
  userService = inject(UserService);
  channelService = inject(ChannelService);
  @Input() message: any;
  @Input() index!: number
  @Input() mode: string = '';
  @Input() chatMode: string = '';
  @Output() emojiPickerRequested = new EventEmitter<{
    anchor: HTMLElement;
    message: any;
    index: number;
    side: 'left' | 'right';
    context: 'chat' | 'thread';
  }>();
  showEmojis: boolean = false;
  messageReacton: string = '';
  constructor(public emojiPickerService: EmojiPickerService) { this.getUserData(); }
  imgSrcMore: any = 'chat-section/more-vert.png';
  imgComment: any = 'chat-section/comment.png';
  imgReaction: any = 'chat-section/add-reaction.png';
  imgReactionInput: any = 'chat-section/add-reaction.png';
  selectedUser: any;
  editMessageActive: boolean = false;
  editMessageText: string = '';
  showEmojisMessage: boolean = false;
  shiftContainer: boolean = false;
  hoveredReactionIndex: number | null = null;
  showAllMessageReactions: boolean = false;
  showAllMessageThreadReactions: boolean = false;
  isMenuOpen: boolean = false;
  showCustomMenu: boolean = false;


  ngOnInit() {
    this.chatService.loadMostUsedEmojis();
  }

  getUserData() {
    this.channelService.isChecked$.subscribe(user => {
      this.selectedUser = user
    })
  }
  editMessage() {
    this.editMessageText = this.message.text;
    this.editMessageActive = true;
  }
  showAllEmojis(event: MouseEvent) {
    event.stopPropagation();
    this.showEmojis = true;
  }
  discardEditMessage() {
    this.editMessageActive = false;
  }

  addEmoji($event: any) {
    const native = $event?.emoji?.native ?? $event?.native ?? '';
    if (!native) return;

    this.chatService.saveEmoji(native);
    this.editMessageText += native;
    this.showEmojis = false;
  }
  async updateMessage() {
    await this.chatService.updateUserMessage(this.chatService.chatMode, this.message.id, this.editMessageText);
    this.editMessageActive = false;
  }

  showAllEmojisMessage(index: number | any, event: MouseEvent) {
    event.stopPropagation();
    this.showEmojisMessage = true;
  }

  addMostUsedEmojiMessage(emoji: any, index: number) {
    this.messageReacton += emoji;
    if (this.mode === 'thread') {
      this.chatService.saveEmojisThreadInDatabase(this.chatService.chatMode, emoji, this.message.id, this.chatService.parentMessageId)
    } else {
      this.chatService.saveEmojisInDatabase(this.chatService.chatMode, emoji, this.message.id)
    }
  }

  showReactionUserName(index: number) {
    this.hoveredReactionIndex = index;
  }

  hideReactionUserName() {
    this.hoveredReactionIndex = null;
  }


  hideAllEmojis() {
    this.showEmojis = false;
  }

  getLastThreadReplyTime(): Date | null {
    if (this.message && this.message.lastThreadReply) {
      try {
        if (typeof this.message.lastThreadReply.toDate === 'function') {
          return this.message.lastThreadReply.toDate();
        }
        if (this.message.lastThreadReply instanceof Date) {
          return this.message.lastThreadReply;
        }
        if (typeof this.message.lastThreadReply === 'number') {
          return new Date(this.message.lastThreadReply);
        }
      } catch (error) {
        console.error('Error converting lastThreadReply to Date:', error, this.message.lastThreadReply);
      }
    }
    return null;
  }

  showAllReactions() {
    if (this.mode === 'thread') {
      this.showAllMessageThreadReactions = true;
    } else {
      this.showAllMessageReactions = true;
    }
  }

  hideAllReactions() {
    this.showAllMessageReactions = false;
    this.showAllMessageThreadReactions = false;
  }

  openEmojiPicker(btn: HTMLElement, e: MouseEvent) {
    e.stopPropagation();
    const context: 'chat' | 'thread' = this.mode === 'thread' ? 'thread' : 'chat';
    const isOwn = this.message?.senderId === this.channelService.currentUserId;
    const side: 'left' | 'right' = isOwn ? 'left' : 'right';

    this.emojiPickerRequested.emit({
      anchor: btn,
      side,
      message: this.message,
      index: this.index,
      context,
    });
  }

  onMenuOpened() {
    this.isMenuOpen = true;
  }

  onMenuClosed() {
    this.isMenuOpen = false;
  }
}
