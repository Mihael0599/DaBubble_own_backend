import { Component, inject } from '@angular/core';
import { HeaderStartComponent } from '../../shared/header-start/header-start.component';
import { Router, RouterLink } from '@angular/router';
import { FooterStartComponent } from "../../shared/footer-start/footer-start.component";
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password-send-email',
  imports: [
    HeaderStartComponent,
    FooterStartComponent,
    FormsModule,
    MatDialogModule,
    RouterLink,
    CommonModule
  ],
  templateUrl: './password-send-email.component.html',
  styleUrl: './password-send-email.component.scss'
})
export class PasswordSendEmailComponent {
  emailTouched = false;
  isCheckingEmail = false;
  emailNotFoundError = false;
  isSending = false;

  public userService = inject(UserService);
  public user = { email: '' };
  private router = inject(Router);

  get isFormValid() {
    return !!this.user.email && this.isValidEmail(this.user.email);
  }

  private isValidEmail(email: string): boolean {
    const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailPattern.test(email);
  }

  get showEmailError(): boolean {
    return this.emailTouched && !!this.user.email && !this.isValidEmail(this.user.email);
  }

  markEmailTouched() {
    this.emailTouched = true;
  }

  async sendEmailForResetPassword() {
    if (!this.isFormValid || this.isSending) return;
    this.isSending = true;
    this.userService.forgotPassword(this.user.email).subscribe({
      next: () => {
        this.showSuccessfullySendEmailOverlay();
        this.isSending = false;
      },
      error: (err: any) => {
        console.error('Fehler:', err);
        this.isSending = false;
      }
    });
  }

  async showSuccessfullySendEmailOverlay() {
    const backgroundOverlay = document.getElementById('background-overlay');
    if (backgroundOverlay) {
      backgroundOverlay.classList.add('active');
      setTimeout(() => {
        backgroundOverlay.classList.remove('active');
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 125);
      }, 2000);
    }
  }
}