import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ChannelService } from '../../../services/channel.service';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../../services/user.service';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Router } from '@angular/router';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-add-user-to-channel',
  imports: [MatIcon, FormsModule, MatButtonModule, CommonModule, MatAutocompleteModule],
  templateUrl: './add-user-to-channel.component.html',
  styleUrl: './add-user-to-channel.component.scss'
})
export class AddUserToChannelComponent implements OnInit {

  channelService = inject(ChannelService);
  userService = inject(UserService);
  dialogRef = inject(MatDialogRef<AddUserToChannelComponent>, { optional: true });
  bottomSheetRef = inject(MatBottomSheetRef<AddUserToChannelComponent>, { optional: true });
  router = inject(Router);
  searchInput: string = '';
  selectedUser: any;
  filteredUsers: { name: string; avatar: string; userId: string; active: boolean }[] = [];
  currentChannelId?: string;
  showSelectedUser = false;
  isEnabled = false;
  addedUsers: string | undefined;

  ngOnInit() {
  
  }

  addUserToChannel() {
    if (this.currentChannelId && this.selectedUser?.userId) {
      this.channelService.addUserToCh(this.currentChannelId, this.selectedUser.userId);
      this.userService.getUserIdsFromChannel(this.currentChannelId);
    }
    this.close();
  }

  close() {
    this.dialogRef?.close();
    this.bottomSheetRef?.dismiss();
  }

  filterUsers() {
    if (this.searchInput === '') {
      this.filteredUsers = [];
      this.isEnabled = false;
      return;
    }
    this.isEnabled = true;
    this.userService.showFilteredUsers(this.searchInput).subscribe((users) => {
    this.filteredUsers = users.filter(
      (user) => !this.userService.usersIdsInChannel.includes(user.userId)
      );
      this.isEnabled = this.filteredUsers.length > 0;
    });
  }

  displayUser(user: any): string {
  return user && user.name ? user.name : '';
  }

  selectUser(user: any) {
    this.selectedUser = user;
    this.showSelectedUser = true;
    const parts = this.router.url.split('/').filter(Boolean);
    const channelId = parts[3];
    this.currentChannelId = channelId;
  }

  removeSelectedUser() {
    this.selectedUser = null;
    this.searchInput = '';
    this.filteredUsers = [];
    this.showSelectedUser = false;
    this.isEnabled = false;
  } 
}