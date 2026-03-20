import { Component, inject, OnInit } from '@angular/core';
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
import {
  MatBottomSheet,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-create-channel-section',
  imports: [MatIcon, MatInputModule, MatButtonModule, MatFormFieldModule, MatDialogActions, CommonModule, FormsModule, MatBottomSheetModule],
  templateUrl: './create-channel-section.component.html',
  styleUrl: './create-channel-section.component.scss'
})
export class CreateChannelSectionComponent implements OnInit {

  dialogRef = inject(MatDialogRef<SelectUserToAddComponent>, { optional: true });
  bottomSheetRef = inject(MatBottomSheetRef<SelectUserToAddComponent>, { optional: true });
  dataUser = inject(UserService);
  channelService = inject(ChannelService);
  newChannel = new Allchannels();
  currentUserId = this.channelService.currentUserId;
  selectUserDialog = inject(MatDialog);
  private bottomSheet = inject(MatBottomSheet);
  isEnabled = false;
  nameExist = false;

  ngOnInit() {
    this.channelService.showAllChannels();
  }

  checkChannelName() {
    const channelName = this.newChannel.channelname.trim();
    const inputHasLetter = /[a-zA-Z]/.test(channelName);
    const nameExists = this.channelService.allChannelsName.some(n => n.toLowerCase() === channelName.toLowerCase()); 
    if(inputHasLetter && nameExists) {
      this.nameExist = true;
      this.isEnabled = false;
    } else {
      this.nameExist = false;
      this.isEnabled = true;
    }
  }

  close() {
    this.dialogRef?.close();
    this.bottomSheetRef?.dismiss();
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
    this.close();
  }

  async createChannelMobile() {
    const bottomSheetRef = this.bottomSheet.open(SelectUserToAddComponent, {
    panelClass: 'select-user-bottomsheet'
    });
    bottomSheetRef.instance.channelName = this.newChannel.channelname;
    bottomSheetRef.instance.channelDescription = this.newChannel.description;
    this.close();
  }

   ngOnDestroy() {
    this.channelService.unsubscribeAllChannels();
  }
}