import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { FormsModule } from '@angular/forms';
import { HeaderStartComponent } from '../../../shared/header-start/header-start.component';
import { FooterStartComponent } from '../../../shared/footer-start/footer-start.component';
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
  private validationService = inject(ValidationService);

  token: string = '';
  email: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  confirmPasswordTouched: boolean = false;
  tokenValid: boolean = true;
  isLoading: boolean = false;
  passwordTouched: boolean = false;

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    this.tokenValid = !!(this.token && this.email);
  }

  onPasswordInput() { this.passwordTouched = true; }
  onConfirmPasswordInput() { this.confirmPasswordTouched = true; }

  get showPasswordError(): boolean {
    return this.validationService.showPasswordError(this.newPassword, this.passwordTouched);
  }

  get passwordErrorMessage(): string {
    return this.validationService.getPasswordErrorMessage(this.newPassword);
  }

  get showConfirmPasswordError(): boolean {
    return this.confirmPasswordTouched &&
      this.confirmPassword.length > 0 &&
      this.newPassword !== this.confirmPassword;
  }

  isFormValid(): boolean {
    return this.newPassword.length >= 6 &&
      this.newPassword === this.confirmPassword &&
      this.tokenValid;
  }

  async resetPassword() {
    if (!this.isFormValid()) return;
    this.isLoading = true;
    this.userService.resetPassword(this.email, this.token, this.newPassword).subscribe({
      next: () => {
        this.showSuccessMessage();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Fehler:', err);
        alert('Fehler beim Zurücksetzen des Passworts.');
        this.isLoading = false;
      }
    });
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
}