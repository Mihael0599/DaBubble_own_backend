import { Injectable, inject, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { BehaviorSubject, Subscription, fromEvent } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private location = inject(Location);
  mobileHeaderDevspace = false;
  mobileScreenWidth = window.innerWidth < 1000;

  public _mobileHeaderDevspace = new BehaviorSubject<boolean>(false);
  mobileHeaderDevspace$ = this._mobileHeaderDevspace.asObservable();
  
  private scrollToMessageSubject = new BehaviorSubject<{ messageId: string, highlight: boolean } | null>(null);
  public scrollToMessage$ = this.scrollToMessageSubject.asObservable();
  
  private scrollToBottomSubject = new BehaviorSubject<boolean>(false);
  public scrollToBottom$ = this.scrollToBottomSubject.asObservable();

  isMobile = window.innerWidth < 1000; 
  private resizeSubscription: Subscription | undefined;

  private_ = (() => {
    this.resizeSubscription = fromEvent(window, 'resize')
      .pipe(
        map(() => window.innerWidth),       
        startWith(window.innerWidth)       
      )
      .subscribe(width => {
        this.isMobile = width < 1000;     
      });
  })();

  setMobileHeaderDevspace(value: boolean): void {
    this._mobileHeaderDevspace.next(value);
  }

  goBack() {
    this.location.back();
  }

  navigateToMessage(messageId: string, highlight: boolean = true) {
    this.scrollToMessageSubject.next({ messageId, highlight });
  }
  
  clearScrollTarget() {
    this.scrollToMessageSubject.next(null);
  }
  
  triggerScrollToBottom() {
    this.scrollToBottomSubject.next(true);
  }

   ngOnDestroy(): void {
    this.resizeSubscription?.unsubscribe();
  }
}