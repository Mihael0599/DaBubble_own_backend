import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { ChatService } from '../../../services/chat.service';
import { ChannelService } from '../../../services/channel.service';
import { EmojiPickerService } from '../../../services/emojiPicker.service';
type PickerSide = 'left' | 'right';
@Component({
  selector: 'app-received-message',
  imports: [NgIf, DatePipe, NgFor],
  templateUrl: './received-message.component.html',
  styleUrl: './received-message.component.scss',
})
export class ReceivedMessageComponent implements OnInit {

  dataUser = inject(ChannelService);
  @Input() message: any;
  @Input() index!: number;
  @Input() mode: string = '';
  @Input() chatMode: string = '';
  @Output() emojiPickerRequested = new EventEmitter<{
    anchor: HTMLElement;
    message: any;
    index: number;
    side: 'left' | 'right';
    context: 'chat' | 'thread';
  }>();
  public chatService = inject(ChatService);
  channelService = inject(ChannelService);
  hoveredReactionIndex: number | null = null;
  constructor(public emojiPickerService: EmojiPickerService) { this.getUserData(); }
  imgSrcMore: any = 'chat-section/more-vert.png';
  imgComment: any = 'chat-section/comment.png';
  imgReaction: any = 'chat-section/add-reaction.png';
  selectedUser: any;
  showEmojisMessage: boolean = false;
  shiftContainer: boolean = false;
  showAllMessageReactions: boolean = false;
  showEmojis: boolean = false;
  messageReacton: string = '';

  ngOnInit() {
    this.chatService.loadMostUsedEmojis();
  }

  getUserData() {
    this.dataUser.isChecked$.subscribe(user => {
      this.selectedUser = user
    })
  }
  showAllEmojisMessage(index: number | any, event: MouseEvent) {
    event.stopPropagation();
    this.showEmojisMessage = true;
  }
  addEmojiMessage($event: any) {
    this.messageReacton += $event.emoji.native;
    this.showEmojisMessage = false;
    this.chatService.loadMostUsedEmojis();
    this.chatService.saveEmojisInDatabase(this.chatService.chatMode, $event.emoji.native, this.message.id);
    this.shiftContainer = true;
    setTimeout(() => {
      this.shiftContainer = false;
    }, 300);
  }

  addMostUsedEmojiMessage(emoji: any, index: number) {
    this.messageReacton += emoji;
    if (this.mode === 'thread') {
      this.chatService.saveEmojisThreadInDatabase(this.chatService.chatMode, emoji, this.message.id, this.chatService.parentMessageId)
    } else {
      this.chatService.saveEmojisInDatabase(this.chatService.chatMode, emoji, this.message.id)
    }
  }

  hideAllEmojis() {
    this.showEmojisMessage = false;
  }

  showAllReactions() {
    this.showAllMessageReactions = true;
  }
  hideAllReactions() {
    this.showAllMessageReactions = false;
  }

  showReactionUserName(index: number) {
    this.hoveredReactionIndex = index;
  }

  hideReactionUserName() {
    this.hoveredReactionIndex = null;
  }

  getLastThreadReplyTime(): Date | null {
    return this.chatService.getLastThreadReplyTime(this.message.id);
  }

  openEmojiPicker(btn: HTMLElement, e: MouseEvent) {
    e.stopPropagation();
    const context: 'chat' | 'thread' = this.mode === 'thread' ? 'thread' : 'chat';

    this.emojiPickerRequested.emit({
      anchor: btn,
      side: 'right',     
      message: this.message,
      index: this.index,
      context,
    });
  }
}
