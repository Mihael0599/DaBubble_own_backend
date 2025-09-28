import { Component, inject } from '@angular/core';
import { HeaderStartComponent } from "../header-start/header-start.component";
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-imprint',
  imports: [
    HeaderStartComponent,
  ],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss'
})
export class ImprintComponent {
  public navigation = inject(NavigationService);
}
