import { Component, Inject, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogRef } from '@angular/material/dialog';
import { UserCardComponent } from '../../user-card/user-card.component';
import { User } from '../../../../models/user.class';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';
import { ChannelService } from '../../../services/channel.service';
import { ChatService } from '../../../services/chat.service';

@Component({
  selector: 'app-edit-logout-user',
  imports: [MatButtonModule, MatDialogActions],
  templateUrl: './edit-logout-user.component.html',
  styleUrl: './edit-logout-user.component.scss'
})
export class EditLogoutUserComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { user: User, urlUserId: string },
    private dialogRef: MatDialogRef<EditLogoutUserComponent>,
  ) {
  }
  private router = inject(Router);
  readonly userDialog = inject(MatDialog);
  readonly userService = inject(UserService);
  readonly channelService = inject(ChannelService);
  readonly chatService = inject(ChatService);
  private dataUser = this.userService;

  openUserDialog() {
    this.userDialog.open(UserCardComponent, {
      data: { 
        user: this.channelService.currentUser, 
        urlUserId: this.channelService.currentUserId 
      }
    })
  }


  async logout() {
    await this.userService.updateUserDocument(this.userService.channelService.currentUserId, { active: false });
    this.router.navigate(['']);
    this.dialogRef.close();
    this.dataUser.showChannel = false;
    this.dataUser.showChatPartnerHeader = false;
    this.dataUser.showNewMessage = true;
  }
}
