import { Component, inject } from '@angular/core';
import { HeaderStartComponent } from "../shared/header-start/header-start.component";
import { Router, RouterLink } from '@angular/router';
import { FooterStartComponent } from "../shared/footer-start/footer-start.component";
import { User } from '../../models/user.class';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { NgClass } from '@angular/common';
import { isValidPassword, PasswordValidationService } from '../services/password-validation.service';

@Component({
  selector: 'app-signup',
  imports: [
    HeaderStartComponent,
    RouterLink,
    FooterStartComponent,
    FormsModule,
    NgClass
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  public userService = inject(UserService);
  private router = inject(Router);
  private passwordValidationService = inject(PasswordValidationService);

  isPolicyAccepted = false;
  isHovering = false;
  user = new User();
  emailTouched = false;
  nameTouched = false;
  passwordTouched: boolean = false;
  policyTouched = false;

  private isValidEmail(email: string): boolean {
    const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailPattern.test(email);
  }

  get showPasswordError(): boolean {
    return this.passwordValidationService.showPasswordError(this.user.password, this.passwordTouched);
  }

  get passwordErrorMessage(): string {
    return this.passwordValidationService.getPasswordErrorMessage(this.user.password);
  }

  get showEmailError(): boolean {
    return this.emailTouched && !!this.user.email && !this.isValidEmail(this.user.email);
  }

  get showNameError(): boolean {
    return this.nameTouched && !this.user.name;
  }

  get showPolicyError(): boolean {
    return this.policyTouched && !this.isPolicyAccepted;
  }

  get isFormValid() {
    return (
      this.isPolicyAccepted &&
      !!this.user.name &&
      !!this.user.email &&
      this.isValidEmail(this.user.email) &&
      !!this.user.password &&
      this.passwordValidationService.isValidPassword(this.user.password)
    );
  }

  markEmailTouched() {
    this.emailTouched = true;
  }

  markNameTouched() {
    this.nameTouched = true;
  }

  markPasswordTouched() {
    this.passwordTouched = true;
  }

  togglePolicy() {
    this.isPolicyAccepted = !this.isPolicyAccepted;
    this.policyTouched = true;
  }

  getCheckboxImage(): string {
    if (this.isPolicyAccepted) {
      return this.isHovering ? 'signup/box-checked-hover.png' : 'signup/box-checked.png';
    } else {
      return this.isHovering ? 'signup/box-hover.png' : 'signup/box.png';
    }
  }

  navigateToAvatar() {
    this.userService.createInitialUser(this.user).then(() => {
      this.router.navigate(['/avatar']);
    }).catch(error => {
      console.error('Error during user creation:', error);
    });
  }
}
