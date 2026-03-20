import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { HeaderStartComponent } from "../../shared/header-start/header-start.component";
import { FooterStartComponent } from "../../shared/footer-start/footer-start.component";
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User } from '../../../models/user.class';
import { MatDialogContent } from '@angular/material/dialog';

@Component({
  selector: 'app-avatar',
  imports: [
    HeaderStartComponent,
    FooterStartComponent,
    MatDialogContent
  ],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss'
})
export class AvatarComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  public userService = inject(UserService);
  private registrationCompleted = false;

  selectedAvatar = 'avatar/empty-avatar.png';
  user: User = new User();

  items = [
    'avatar/woman1.png',
    'avatar/men1.png',
    'avatar/men2.png',
    'avatar/men3.png',
    'avatar/woman2.png',
    'avatar/men4.png',
  ];

  ngOnInit() {
    this.userService.pendingRegistrationId$.subscribe;
  }

  getUserName(): string {
    return this.userService.pendingUser?.name || 'Unbekannter Benutzer';
  }

  selectAvatar(avatarSrc: string) {
    this.selectedAvatar = avatarSrc;
    const filename = avatarSrc.replace('avatar/', '');
    this.user.avatar = filename;
  }

  removeAvatar() {
    this.selectedAvatar = 'avatar/empty-avatar.png';
  }

  async showSuccessfullyCreateContactOverlay() {
    const avatarFilename = this.getAvatarFilename();
    const success = await this.completeRegistration(avatarFilename);

    if (success) {
      this.registrationCompleted = true;
      this.showOverlayAndNavigate();
    } else {
      console.error('Registrierung konnte nicht abgeschlossen werden');
    }
  }

  private getAvatarFilename(): string {
    return this.selectedAvatar.replace('avatar/', '');
  }

  private async completeRegistration(avatarFilename: string): Promise<boolean> {
    try {
      return await this.userService.completeUserRegistration(avatarFilename);
    } catch (error) {
      console.error('Fehler bei der Registrierung:', error);
      return false;
    }
  }

  private showOverlayAndNavigate() {
    const backgroundOverlay = document.getElementById('background-overlay');
    if (backgroundOverlay) {
      backgroundOverlay.classList.add('active');
      setTimeout(() => {
        backgroundOverlay.classList.remove('active');
        setTimeout(() => {
          this.router.navigate(['/']);
          this.userService.pendingUser = null;
        }, 125);
      }, 2000);
    }
  }

  navigateBack() {
    this.userService.cleanupIncompleteRegistration();
    this.router.navigate(['/signup']);
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: any) {
    if (!this.registrationCompleted) {
      this.userService.cleanupIncompleteRegistration();
    }
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: any) {
    if (!this.registrationCompleted) {
      this.userService.cleanupIncompleteRegistration();
    }
  }

  ngOnDestroy() {
    if (!this.registrationCompleted) {
      this.userService.cleanupIncompleteRegistration();
    }
  }
}
