import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { AvatarComponent } from './signup/avatar/avatar.component';
import { MainContentComponent } from './main-content/main-content.component';
import { ImprintComponent } from './shared/imprint/imprint.component';
import { PrivacyPolicyComponent } from './shared/privacy-policy/privacy-policy.component';
import { PasswordSendEmailComponent } from './login/password-send-email/password-send-email.component';
import { PasswordResetComponent } from './login/password-send-email/password-reset/password-reset.component';
import { UserChannelChatSectionComponent } from './main-content/user-channel-chat-section/user-channel-chat-section.component';
import { ChatSectionComponent } from './main-content/chat-section/chat-section.component';
import { ThreadSectionComponent } from './main-content/thread-section/thread-section.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'imprint', component: ImprintComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'password-send-mail', component: PasswordSendEmailComponent },
  { path: 'password-reset', component: PasswordResetComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'avatar', component: AvatarComponent },
  {
    path: 'mainpage/:id',
    component: MainContentComponent,
    children: [
      { path: 'chats/:chatId', component: ChatSectionComponent },
      { path: 'chats/:chatId/threads/:threadId', component: ThreadSectionComponent },
      { path: 'channels/:channelId', component: UserChannelChatSectionComponent },
      { path: 'channels/:channelId/threads/:threadId', component: ThreadSectionComponent },
      { path: 'new-message', component: ChatSectionComponent },
    ],
  },
];