import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/select';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { Observable } from 'rxjs';
import { User } from '../../../models/user.class';
import { ChannelService } from '../../services/channel.service';
import { ChatService } from '../../services/chat.service';
import { Allchannels } from '../../../models/allchannels.class';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-input-message',
  imports: [
    NgIf,
    NgFor,
    MatLabel,
    MatFormField,
    PickerComponent,
    FormsModule,
    AsyncPipe,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './input-message.component.html',
  styleUrl: './input-message.component.scss'
})
export class InputMessageComponent implements OnInit {

  showUserList: boolean = false;
  showChanelList: boolean = false;
  channelService = inject(ChannelService);
  chatService = inject(ChatService);
  dataUser = inject(UserService)
  users$: Observable<User[]> | undefined;
  messageText: string = '';
  imgSrcReaction: any = 'send-email/add-reaction.png';
  imgSrcMention: any = 'send-email/mention.png';
  imgSrcSend: any = 'send-email/send.png';
  selectedEmoji: any;
  onlineUser: string = 'status/online.png';
  offlineUser: string = 'status/offline.png';
  @Input() mode: 'chats' | 'thread' = 'chats';
  @Input() chatMode: 'chats' | 'channel' = 'chats';
  showEmojis: boolean = false;

  ngOnInit(): void {
    this.users$ = this.dataUser.getAllUsers();
  }

  userMention(event: MouseEvent) {
    event.stopPropagation();
    this.messageText += '@';
    this.onInputChange();
  }

  onInputChange(): void {
    this.checkInputFieldForUserMention();
    this.checkInputFieldForChannelMention();
  }

  checkInputFieldForUserMention() {
    const cursorPosition = this.messageText.lastIndexOf('@');
    if (cursorPosition === -1) {
      this.showUserList = false;
      return;
    }
    const afterAt = this.messageText.substring(cursorPosition + 1);
    if (afterAt.length === 0 || /^[a-zA-ZäöüÄÖÜß]*$/.test(afterAt)) {
      this.showUserList = true;
    } else {
      this.showUserList = false;
    }
  }

  checkInputFieldForChannelMention() {
    const cursorPosition = this.messageText.lastIndexOf('#');
    if (cursorPosition === -1) {
      this.showChanelList = false;
      return;
    }
    const afterAt = this.messageText.substring(cursorPosition + 1);
    if (afterAt.length === 0 || /^[a-zA-ZäöüÄÖÜß]*$/.test(afterAt)) {
      this.showChanelList = true;
    } else {
      this.showChanelList = false;
    }
  }

  selecetedUserMention(user: User, index: number) {
    this.messageText += user.name;
    this.showUserList = false;
  }

  selecetedChannelMention(channel: Allchannels, index: number) {
    this.messageText += channel.channelname;
    this.showChanelList = false;
  }

  sendMessage() {
    if (!this.messageText.trim()) return;
    const { name, avatar } = this.channelService.currentUser || {};
    if (this.mode === 'thread') {
      this.sendThreadMessage(name, avatar);
    } else {
      this.sendChatMessage(name, avatar);
    }
    this.messageText = '';
    this.scrollToBottom();
  }

  private sendThreadMessage(name?: string, avatar?: string) {
    this.chatService.sendThreadMessage(
      this.chatService.chatMode, 
      this.chatService.chatId, 
      this.chatService.parentMessageId, 
      this.channelService.currentUserId, 
      this.messageText, 
      name, 
      avatar
    );
  }

  private sendChatMessage(name?: string, avatar?: string) {
    this.chatService.sendChatMessage(
      this.chatService.chatMode, 
      this.messageText, 
      this.channelService.currentUserId, 
      name, 
      avatar
    );
  }

  private scrollToBottom() {
    setTimeout(() => {
      document.querySelectorAll('.chat-messages-container').forEach(container => {
        const el = container as HTMLElement;
        if (el.offsetHeight > 0) el.scrollTop = el.scrollHeight;
      });
    }, 300);
  }

  addEmoji($event: any) {
    this.chatService.saveEmoji($event.emoji.native);
    this.showEmojis = false;
    this.messageText += $event.emoji.native;
    this.chatService.loadMostUsedEmojis();
  }

  showAllEmojisMessage(index: number) {
    this.selectedEmoji = index;
  }

  showAllEmojis(event: MouseEvent) {
    event.stopPropagation();
    this.showEmojis = true;
  }

  hideUserMentionList() {
    this.showUserList = false;
    this.showChanelList = false;
    this.showEmojis = false;
  }
}
