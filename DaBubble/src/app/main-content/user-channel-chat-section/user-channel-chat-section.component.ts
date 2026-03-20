import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ChannelSectionComponent } from '../channel-section/channel-section.component';
import { UserService } from '../../services/user.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Allchannels } from '../../../models/allchannels.class';
import { ChannelService } from '../../services/channel.service';
import { ChatService } from '../../services/chat.service';
import { Userstorage } from '../../../models/userStorage.class';

@Component({
  selector: 'app-user-channel-chat-section',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, CommonModule, MatButtonModule, MatMenuModule],
  templateUrl: './user-channel-chat-section.component.html',
  styleUrl: './user-channel-chat-section.component.scss',
})
export class UserChannelChatSectionComponent implements OnInit {
  
  dataUser = inject(UserService);
  channelService = inject(ChannelService);
  chatService = inject(ChatService);
  route = inject(ActivatedRoute);
  dialog = inject(MatDialog);
  newChannel = new Allchannels();
  userstorage = new Userstorage();
  currentUserId = this.channelService.currentUserId;

  private routeSub?: Subscription;

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(parentParams => {
      const userId = parentParams.get('id');
      if (userId) {
        this.channelService.currentUserId = userId;
        this.dataUser.showCurrentUserData();
      }
    });

    this.route.paramMap.subscribe(async (paramMap) => {
      const channelId = paramMap.get('channelId')!;
      if (channelId) {
        await this.initializeChannel(channelId);
      }
    });
  }

  private async initializeChannel(channelId: string) {
    try {
      await this.waitForChannelData();
      this.setupChannelMode(channelId);
      await this.loadChannelDetails(channelId);
      this.initializeChatServices(channelId);
      this.updateUserStorage();
    } catch (error) {
      console.error('Fehler beim Initialisieren des Channels:', error);
    }
  }

  private setupChannelMode(channelId: string) {
    this.chatService.chatMode = 'channels';
    this.dataUser.showChannel = true;
    this.dataUser.showChatPartnerHeader = false;
    this.dataUser.showNewMessage = false;
    this.channelService.currentChannelId = channelId;
    this.userstorage.channelId = channelId;
    this.userstorage.showChannel = true;
  }

  private initializeChatServices(channelId: string) {
    this.chatService.checkIfChatOrChannel();
    this.chatService.listenToMessages('channels');
    this.chatService.getChannelMessages(channelId);
    this.channelService.setCheckdValue(channelId);
    this.channelService.setActiveChannelId(channelId);
  }

  private updateUserStorage() {
    if (this.channelService.currentUserId && this.channelService.userSubcollectionId) {
      this.channelService.updateUserStorage(
        this.channelService.currentUserId, 
        this.channelService.userSubcollectionId, 
        this.userstorage.toJSON(['channelId', 'showChannel'])
      );
    }
  }

  private async waitForChannelData(): Promise<void> {
    return new Promise((resolve) => {
      if (this.channelService.showChannelByUser && this.channelService.showChannelByUser.length > 0) {
        resolve();
        return;
      }
      const subscription = this.channelService.showChannelByUser$.subscribe(channels => {
        if (channels && channels.length > 0) {
          subscription.unsubscribe();
          resolve();
        }
      });
      setTimeout(() => {
        subscription.unsubscribe();
        resolve();
      }, 3000);
    });
  }

  private async loadChannelDetails(channelId: string) {
    const channels = this.channelService.showChannelByUser;
    const channel = channels?.find(c => c.channelId === channelId || c.id === channelId);
    if (channel) {
      this.channelService.currentChannelName = channel.channelname;
      this.channelService.currentChannelDescription = channel.description;
      this.channelService.getChannelUserId(channelId);
      this.dataUser.getUserIdsFromChannel(channelId);
    } else {
      this.channelService.currentChannelName = 'Channel';
      this.channelService.currentChannelDescription = '';
    }
  }

  openDialog(button: HTMLElement) {
    const rect = button.getBoundingClientRect();
    this.dialog.open(ChannelSectionComponent, {
    position: {
        top:  `${rect.bottom + window.scrollY}px`, 
        left: `${rect.left   + window.scrollX}px`  
      },
      width: '750px',
      height: '500px',
      maxWidth: '750px',
      maxHeight: '500px',
      panelClass: 'channel-dialog-container',
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }
}
