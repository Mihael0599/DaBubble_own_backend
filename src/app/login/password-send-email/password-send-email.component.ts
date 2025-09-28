import { Component, inject, runInInjectionContext, Injector } from '@angular/core';
import { HeaderStartComponent } from '../../shared/header-start/header-start.component';
import { Router, RouterLink } from '@angular/router';
import { FooterStartComponent } from "../../shared/footer-start/footer-start.component";
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { query, where, getDocs } from '@angular/fire/firestore';
import emailjs from '@emailjs/browser';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password-send-email',
  imports: [
    HeaderStartComponent,
    FooterStartComponent,
    FormsModule,
    MatDialogModule,
    RouterLink,
    FormsModule,
    CommonModule
  ],
  templateUrl: './password-send-email.component.html',
  styleUrl: './password-send-email.component.scss'
})
export class PasswordSendEmailComponent {
  emailTouched = false;
  emailExistsInDB = false;
  isCheckingEmail = false;
  emailNotFoundError = false;

  public userService = inject(UserService);
  public user = { email: '' };
  private router = inject(Router);
  private injector = inject(Injector);

  private emailjsConfig = {
    serviceId: 'service_mnrcyib',
    templateId: 'template_h7uqtyb',
    publicKey: 'ckQdz_0ZFKfuDjXTf'
  };

  get isFormValid() {
    return (
      !!this.user.email &&
      this.isValidEmail(this.user.email) &&
      this.emailExistsInDB &&
      !this.isCheckingEmail
    );
  }

  private isValidEmail(email: string): boolean {
    const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailPattern.test(email);
  }

  get showEmailError(): boolean {
    return this.emailTouched && !!this.user.email && (!this.isValidEmail(this.user.email) || this.emailNotFoundError);
  }

  async markEmailTouched() {
    this.emailTouched = true;
    if (this.user.email && this.isValidEmail(this.user.email)) {
      await this.checkEmailExists();
    } else {
      this.emailExistsInDB = false;
      this.emailNotFoundError = false;
    }
  }

  private async checkEmailExists(): Promise<void> {
    this.isCheckingEmail = true;
    this.emailNotFoundError = false;
    try {
      const result = await runInInjectionContext(this.injector, () => (
        getDocs(query(this.userService.getUsersCollection(), where('email', '==', this.user.email))
        )));
      this.emailExistsInDB = !result.empty;
      this.emailNotFoundError = result.empty;
    } finally {
      this.isCheckingEmail = false;
    }
  }

  async sendEmailForResetPassword() {
    if (!this.isFormValid) return;
    this.showSuccessfullySendEmailOverlay();
    try {
      const userDoc = await this.getUserDocument();
      const resetToken = this.generateResetToken();
      const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await this.updateUserResetData(userDoc.id, resetToken, resetExpiry);
      const resetLink = this.generateResetLink(resetToken, userDoc.id);
      await this.sendResetEmail(userDoc.data(), resetLink);
    } catch (error: any) {
      this.handleResetPasswordError(error);
    }
  }

  private async getUserDocument() {
    const result = await runInInjectionContext(this.injector, () => (
      getDocs(query(this.userService.getUsersCollection(), where('email', '==', this.user.email)))));
    return result.docs[0];
  }

  private async updateUserResetData(userId: string, resetToken: string, resetExpiry: Date) {
    await this.userService.updateUserDocument(userId, {
      resetToken,
      resetTokenExpiry: resetExpiry,
    });
  }

  private generateResetLink(resetToken: string, userId: string): string {
    return `http://localhost:4200/password-reset?token=${resetToken}&userId=${userId}`;
  }

  private async sendResetEmail(userData: any, resetLink: string) {
    const templateParams = {
      to_name: userData['name'] || 'Benutzer',
      user_email: this.user.email,
      reset_link: resetLink,
      company_name: 'DABubble',
      logo: 'https://dabubble-413.developerakademie.net/logo/logo-with-text.png',
    };
    await emailjs.send(
      this.emailjsConfig.serviceId,
      this.emailjsConfig.templateId,
      templateParams,
      this.emailjsConfig.publicKey
    );
  }

  private handleResetPasswordError(error: any) {
    console.error('Fehler beim Passwort-Reset:', error);
    const message = error.text
      ? `Fehler beim Senden der E-Mail: ${error.text}`
      : 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
    alert(message);
  }

  generateResetToken(): string {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36);
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