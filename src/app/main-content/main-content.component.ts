import { Component } from '@angular/core';
import { ChatSectionComponent } from "./chat-section/chat-section.component";
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { WorkSpaceSectionComponent } from './work-space-section/work-space-section.component';
import { ThreadSectionComponent } from './thread-section/thread-section.component';

@Component({
  selector: 'app-main-content',
  imports: [ChatSectionComponent, CommonModule, HeaderComponent, WorkSpaceSectionComponent, ThreadSectionComponent],
  templateUrl: './main-content.component.html',
  styleUrl: './main-content.component.scss'
})
export class MainContentComponent {

}