import { Component, inject, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../../models/user.class';
import { MatIcon } from '@angular/material/icon';
import { NgClass, NgIf } from '@angular/common';
import { UserService } from './../../services/user.service'
import { FormsModule, } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ChannelService } from '../../services/channel.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [MatIcon, NgClass, FormsModule, NgIf],
  templateUrl: './user-card.component.html',
  styleUrl: './user-card.component.scss'
})

export class UserCardComponent implements OnInit {
  newName = '';
  urlUserId: string;
  dataUser = inject(UserService);
  chatService = inject(ChatService);
  channelService = inject(ChannelService);
  userUpdateNameAktiv: boolean = false;

  selectedAvatar: string;
  items = [
    'avatar/empty-avatar.png',
    'avatar/woman1.png',
    'avatar/men1.png',
    'avatar/men2.png',
    'avatar/men3.png',
    'avatar/woman2.png',
    'avatar/men4.png',
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { user: User, urlUserId: string, parentDialogRef?: MatDialogRef<any> },
    private dialogRef: MatDialogRef<UserCardComponent>,
    private userService: UserService,
    private route: ActivatedRoute
  ) {
    this.urlUserId = data.urlUserId;
    this.selectedAvatar = `avatar/${data.user.avatar || 'empty-avatar.png'}`;
  }

  ngOnInit(): void {
    this.checkUserId();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  async updateName() {
    try {
      if (this.newName && this.newName.trim() !== '') {
        await this.userService.updateUserName(this.newName);
      }
      await this.updateAvatar();
      this.userUpdateNameAktiv = false;
      this.closeDialog();
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Profils:', err);
    }
  }

  checkUserId() {
    return this.urlUserId === this.channelService.currentUserId;
  }

  changeName() {
    this.userUpdateNameAktiv = true;
  }

  discardChangeName() {
    this.userUpdateNameAktiv = false;
    this.selectedAvatar = `avatar/${this.data.user.avatar || 'empty-avatar.png'}`;
    this.newName = '';
  }

  getUserIdFromUrl() {
    this.route.params.subscribe(parms => {
      this.urlUserId = parms['id'];
    })
  }

  isCurrentUser(): boolean {
    if (this.urlUserId) {
      return this.checkUserId();
    }
    return this.data.user === this.channelService.currentUser;
  }

  selectAvatar(avatarSrc: string) {
    this.selectedAvatar = avatarSrc;
  }

  async updateAvatar() {
    try {
      const avatarFileName = this.selectedAvatar.replace('avatar/', '');
      await this.userService.updateUserAvatar(avatarFileName);
      this.data.user.avatar = avatarFileName;
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Avatars:', err);
      throw err;
    }
  }

  selectUserResult(type: string, user: User) {
    this.closeDialog();
    if (this.data.parentDialogRef) {
      this.data.parentDialogRef.close();
    }
    this.openPrivateChat(type, user);
  }

  private async openPrivateChat(type: string, user: User) {
    try {
      const userForChat = {
        userId: user.userId,
        name: user.name,
        avatar: user.avatar,
        active: user.active || false,
      };
      await this.chatService.onUserClick(type, 0, userForChat);
    } catch (error) {
      console.log('Fehler beim Öffnen des privaten Chats:', error);
    }
  }
}

