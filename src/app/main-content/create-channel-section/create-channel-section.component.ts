import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogActions, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Allchannels } from '../../../models/allchannels.class';
import { ChannelService } from '../../services/channel.service';
import { SelectUserToAddComponent } from '../channel-section/select-user-to-add/select-user-to-add.component';

@Component({
  selector: 'app-create-channel-section',
  imports: [MatIcon, MatInputModule, MatButtonModule, MatFormFieldModule, MatDialogActions, CommonModule, FormsModule],
  templateUrl: './create-channel-section.component.html',
  styleUrl: './create-channel-section.component.scss'
})
export class CreateChannelSectionComponent {

  dialogRef = inject(MatDialogRef<CreateChannelSectionComponent>);
  dataUser = inject(UserService);
  channelService = inject(ChannelService);
  newChannel = new Allchannels();
  currentUserId = this.channelService.currentUserId;
  selectUserDialog = inject(MatDialog);
  isEnabled = false;

  checkChannelName() {
  const value = this.newChannel.channelname || '';
  this.isEnabled = /[a-zA-Z]/.test(value);
}

  async createChannel() { 
    (document.activeElement as HTMLElement)?.blur();
    const dialogRef = this.selectUserDialog.open(SelectUserToAddComponent, {
      width: '710px',
      height: '',
      maxWidth: '710px',
      maxHeight: '354px',
      panelClass: 'select-user-dialog-container',
    });
    dialogRef.componentInstance.channelName = this.newChannel.channelname;
    dialogRef.componentInstance.channelDescription = this.newChannel.description
    this.dialogRef.close();
  }
}