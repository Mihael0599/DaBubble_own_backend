import { Component, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { UserService } from '../../../services/user.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ChannelService } from '../../../services/channel.service';
import { AddUserToChannelComponent } from '../add-user-to-channel/add-user-to-channel.component';
import { UserCardComponent } from '../../user-card/user-card.component';
import { ChatService } from '../../../services/chat.service';

@Component({
  selector: 'app-users-in-channel',
  imports: [MatIcon, AsyncPipe, CommonModule],
  templateUrl: './users-in-channel.component.html',
  styleUrl: './users-in-channel.component.scss'
})
export class UsersInChannelComponent {
  dialog = inject(MatDialogRef<UsersInChannelComponent>);
  dataUser = inject(UserService);
  chatService = inject(ChatService);
  channelService = inject(ChannelService);
  openDialog = inject(MatDialog);
  userDialog = inject(MatDialog);

  addUserToChannel(div: HTMLElement) {
    (document.activeElement as HTMLElement)?.blur();
    const rect = div.getBoundingClientRect();
    const dialogWidth = 514;
    this.openDialog.open(AddUserToChannelComponent, {
      autoFocus: false,
      position: {
        top: `${rect.bottom + window.scrollY - 340}px`,   
        left: `${rect.right + window.scrollX - dialogWidth}px`, 
        },
    width: '514px',
    height: '294px',
    maxWidth: '514px',
    maxHeight: '294px',
    panelClass: 'add-user'
    });
    this.dialog.close()
  }

  openUserDialog(user: any) {
    this.userDialog.open(UserCardComponent, {
      data: { 
        user: user,
        parentDialogRef: this.dialog
       },
    });
  }
}