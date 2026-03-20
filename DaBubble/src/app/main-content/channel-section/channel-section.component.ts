import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { Allchannels } from '../../../models/allchannels.class';
import { FormsModule } from '@angular/forms';
import { ChannelService } from '../../services/channel.service';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { AddUserToChannelComponent } from './add-user-to-channel/add-user-to-channel.component';

@Component({
  selector: 'app-channel-section',
  imports: [MatCardModule, MatIcon, MatButtonModule, MatDividerModule, CommonModule, FormsModule],
  templateUrl: './channel-section.component.html',
  styleUrl: './channel-section.component.scss'
})
export class ChannelSectionComponent implements OnInit {

  dialogRef = inject(MatDialogRef<ChannelSectionComponent>);
  dataUser = inject(UserService);
  channelService = inject(ChannelService);
  isEnabled = false;
  nameExist = false;

  showEditChannelName = false;
  showEditChannelDescription = false;
  showChannels = false;
  bottomSheet = inject(MatBottomSheet);

  newChannel = new Allchannels();

   ngOnInit(): void {
    this.channelService.showAllChannels();
  }

  editChannelName() {
    this.showEditChannelName = true;
    let baseName = this.channelService.currentChannelName ? this.dataUser.channelService.currentChannelName : this.channelService.userSubcollectionChannelName;
    this.newChannel.channelname = baseName;
  }

  checkEditedChannelName() {
    const channelName = this.newChannel.channelname?.trim() || '';
    const inputHasLetter = /[a-zA-ZäöüÄÖÜß]/.test(channelName);
    const nameExists = this.channelService.allChannelsName.some(n => n.toLowerCase() === channelName.toLowerCase()); 
     if (!inputHasLetter || channelName.length === 0) {
      this.isEnabled = false;
      this.nameExist = false;
    } else if (nameExists) {
      this.isEnabled = false;
      this.nameExist = true;
    } else {
      this.isEnabled = true;
      this.nameExist = false;
    }
  }

  saveEditedChannelName() {
    this.showEditChannelName = false;
    if(!this.channelService.currentChannelId) {
      this.channelService.currentChannelId = this.channelService.userSubcollectionChannelId;
    }
    this.newChannel.channelId = this.channelService.currentChannelId;
    const cleaned = this.newChannel.channelname.replace(/^#\s*/, '').trim();
    this.newChannel.channelname = cleaned;
    this.channelService.editChannel(this.channelService.currentChannelId, this.newChannel.toJSON(['channelId','channelname'])).then(() => {
    this.channelService.updateUserStorage(this.channelService.currentUserId, this.channelService.userSubcollectionId, this.newChannel.toJSON(['channelId','channelname']));
    this.channelService.currentChannelName = cleaned;
    this.channelService.checkChannel();
    });
  }

  editChannelDescription() {
    this.showEditChannelDescription = true;
    let baseDescription = this.channelService.currentChannelDescription ? this.channelService.currentChannelDescription : this.channelService.userSubcollectionDescription;
    this.newChannel.description = baseDescription;
  }

  saveEditedChannelDescription() {
    this.showEditChannelDescription = false;
    if(!this.channelService.currentChannelId) {
      this.channelService.currentChannelId = this.channelService.userSubcollectionChannelId;
    }
    this.channelService.editChannel(this.channelService.currentChannelId, this.newChannel.toJSON(['description'])).then(() => {
    this.channelService.updateUserStorage(this.channelService.currentUserId, this.channelService.userSubcollectionId, this.newChannel.toJSON(['description']));
    this.channelService.currentChannelDescription = this.newChannel.description ?? '';
    });
  }

  deleteUserFromChannel() {
    this.channelService.deleteUserFromCh(this.channelService.currentChannelId, this.newChannel.toJSON(['userId']));
    this.dialogRef.close()
  }

  addUserToChannel() {
    const bottomSheetRef = this.bottomSheet.open(AddUserToChannelComponent, {
        panelClass: 'select-user-bottomsheet',
      });
  }
}