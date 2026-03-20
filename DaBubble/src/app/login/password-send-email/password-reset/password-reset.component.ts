import { Component, inject, OnInit, runInInjectionContext, Injector } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { FormsModule } from '@angular/forms';
import { HeaderStartComponent } from '../../../shared/header-start/header-start.component';
import { FooterStartComponent } from '../../../shared/footer-start/footer-start.component';
import { getDoc, doc, updateDoc } from '@angular/fire/firestore';
import { MatDialogModule } from "@angular/material/dialog";
import { ValidationService } from '../../../services/validation.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password-reset',
  imports: [
    FormsModule,
    HeaderStartComponent,
    RouterLink,
    FooterStartComponent,
    MatDialogModule,
    CommonModule
  ],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.scss'
})
export class PasswordResetComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private injector = inject(Injector);
  private validationService = inject(ValidationService);

  token: string = '';
  userId: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  confirmPasswordTouched: boolean = false;
  tokenValid: boolean = false;
  isLoading: boolean = false;
  passwordTouched: boolean = false;
  user: { password: string } = { password: '' };

  async ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.userId = this.route.snapshot.queryParamMap.get('userId') || '';
    if (this.token && this.userId) {
      await this.validateToken();
    }
  }

  async validateToken() {
    try {
      const userDoc = await this.getUserDocument();
      if (!userDoc) {
        return;
      }
      this.tokenValid = this.isTokenValid(userDoc.data());
    } catch (error) {
      this.handleValidationError(error);
    }
  }

  onPasswordInput() {
    this.passwordTouched = true;
  }

  onConfirmPasswordInput() {
    this.confirmPasswordTouched = true;
  }

  get showPasswordError(): boolean {
    return this.validationService.showPasswordError(this.newPassword, this.passwordTouched);
  }

  get passwordErrorMessage(): string {
    return this.validationService.getPasswordErrorMessage(this.newPassword);
  }

  get showConfirmPasswordError(): boolean {
    return this.confirmPasswordTouched && this.confirmPassword.length > 0 && this.newPassword !== this.confirmPassword;
  }

  isFormValid(): boolean {
    return this.newPassword.length >= 8 &&
      this.validationService.isValidPassword(this.newPassword) &&
      this.newPassword === this.confirmPassword
      && this.tokenValid;
  }

  private async getUserDocument() {
    return await runInInjectionContext(this.injector, () => {
      const userDoc = getDoc(doc(this.userService.getUsersCollection(), this.userId));
      return userDoc;
    });
  }

  private isTokenValid(userData: any): boolean {
    const { resetToken, resetTokenExpiry } = userData;
    return resetToken === this.token && resetTokenExpiry && new Date() < resetTokenExpiry.toDate();
  }

  private handleValidationError(error: any) {
    console.error('Fehler bei Token-Validierung:', error);
  }

  async resetPassword() {
    try {
      await this.updatePassword();
      this.showSuccessMessage();
    } catch (error) {
      this.handleResetError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private async updatePassword() {
    await runInInjectionContext(this.injector, () => (
      updateDoc(doc(this.userService.getUsersCollection(), this.userId), {
        password: this.newPassword,
        resetToken: null,
        resetTokenExpiry: null,
      })
    ));
  }

  private showSuccessMessage() {
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

  private handleResetError(error: any) {
    console.error('Fehler beim Passwort-Reset:', error);
    alert('Fehler beim Zurücksetzen des Passworts. Bitte versuchen Sie es erneut.');
  }

  private showError() {
    this.tokenValid = false;
  }
}