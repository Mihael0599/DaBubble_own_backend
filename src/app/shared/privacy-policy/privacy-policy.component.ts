import { Component, inject } from '@angular/core';
import { HeaderStartComponent } from "../header-start/header-start.component";
import { NavigationService } from '../../services/navigation.service';


@Component({
  selector: 'app-privacy-policy',
  imports: [
    HeaderStartComponent,
  ],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss'
})
export class PrivacyPolicyComponent {
  public navigation = inject(NavigationService);
}
