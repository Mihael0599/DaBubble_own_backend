import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private location = inject(Location);
  mobileHeaderDevspace = false;

  public _mobileHeaderDevspace = new BehaviorSubject<boolean>(false);
  mobileHeaderDevspace$ = this._mobileHeaderDevspace.asObservable();
  
  private scrollToMessageSubject = new BehaviorSubject<{ messageId: string, highlight: boolean } | null>(null);
  public scrollToMessage$ = this.scrollToMessageSubject.asObservable();

  goBack() {
    this.location.back();
  }

  navigateToMessage(messageId: string, highlight: boolean = true) {
    this.scrollToMessageSubject.next({ messageId, highlight });
  }
  
  clearScrollTarget() {
    this.scrollToMessageSubject.next(null);
  }
}
