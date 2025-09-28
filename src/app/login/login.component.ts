import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FooterStartComponent } from "../shared/footer-start/footer-start.component";
import { CommonModule } from '@angular/common';
import { IntroService } from '../services/intro.service';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { MatDialogModule } from '@angular/material/dialog';
import { ChannelService } from '../services/channel.service';

@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    FooterStartComponent,
    CommonModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  loginError = '';
  showIntroLogo = false;
  userId!: string;

  private introService = inject(IntroService);
  private userService = inject(UserService);
  private channelService = inject(ChannelService);
  private router = inject(Router);
  private dataUser = this.userService;

  get isFormValid(): boolean {
    return (
      !!this.email &&
      !!this.password
    );
  }

  ngOnInit() {
    if (!this.introService.hasIntroBeenShown()) {
      this.showIntroLogo = true;
      this.introService.markIntroAsShown();
      setTimeout(() => {
        this.showIntroLogo = false;
      }, 6000);
    } else {
      this.showIntroLogo = false;
    }
  }

  onEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.isFormValid) {
      this.login();
    }
  }

  async login() {
    const backgroundOverlay = document.getElementById('background-overlay');
    try {
      await this.userService.loginService(this.email, this.password);
      if (this.userService.loginIsSucess) {
        this.handleSuccessfulLogin(backgroundOverlay);
      } else {
        this.loginError = 'Ungültige Email oder Passwort';
      }
    } catch (error) {
      console.error('Login-Fehler:', error);
      this.loginError = 'Ein Fehler ist aufgetreten';
    }
  }

  private handleSuccessfulLogin(backgroundOverlay: HTMLElement | null) {
    if (backgroundOverlay) {
      backgroundOverlay.classList.add('active');
      setTimeout(() => {
        backgroundOverlay.classList.remove('active');
        setTimeout(() => {
          this.userId = this.channelService.currentUserId;
          this.resetLoginForm();
          this.channelService.resetAllStates(this.userService);
          this.userService.showChannel = false;
          this.userService.showChatPartnerHeader = false;
          this.userService.showNewMessage = true;
          this.router.navigate(['mainpage', this.userId, 'new-message']);
        }, 125);
      }, 2000);
    }
  }

  private resetLoginForm() {
    this.email = '';
    this.password = '';
    this.loginError = '';
  }

  loginWithGoogle() {
    this.userService.signInWithGoogle()
      .catch(error => {
        console.error('Google sign in error', error);
        this.loginError = 'Anmeldung bei Google fehlgeschlagen. Bitte versuchen Sie es erneut.';
      });
  }

  loginWithGuest() {
    const backgroundOverlay = document.getElementById('background-overlay');
    if (backgroundOverlay) {
      this.userService.signInWithGuest().then(() => {
        if (this.userService.loginIsSucess) {
          this.handleSuccessfulGuestLogin(backgroundOverlay);
        } else {
          console.error('Guest login failed.');
        }
      }).catch(error => {
        console.error('Error during guest login:', error);
      });
    }
  }

  private handleSuccessfulGuestLogin(backgroundOverlay: HTMLElement | null) {
    if (backgroundOverlay) {
      this.userId = this.channelService.currentUserId;
      backgroundOverlay.classList.add('active');
      setTimeout(() => {
        backgroundOverlay.classList.remove('active');
        setTimeout(() => {
          this.channelService.resetAllStates(this.dataUser);
          this.dataUser.showChannel = false;
          this.dataUser.showChatPartnerHeader = false;
          this.dataUser.showNewMessage = true;
          this.router.navigate(['mainpage', this.userId, 'new-message']);
        }, 125);
      }, 2000);
    }
  }
}
