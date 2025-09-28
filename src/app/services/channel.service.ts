import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  addDoc,
  arrayUnion,
  collection,
  collectionData,
  CollectionReference,
  doc,
  Firestore,
  onSnapshot,
  updateDoc,
  Timestamp,
} from '@angular/fire/firestore';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Allchannels } from '../../models/allchannels.class';
import { User } from '../../models/user.class';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  constructor() { }

  private firestore = inject(Firestore);
  private injector = inject(Injector);

  private updateChannelByUser = new BehaviorSubject<Allchannels[]>([]);
  showChannelByUser$ = this.updateChannelByUser.asObservable();

  public channelsLoaded$ = new BehaviorSubject<boolean>(false);

  private isCheckedSubject = new BehaviorSubject<any>(null);
  public isChecked$ = this.isCheckedSubject.asObservable();

  private activeChannelIdSubject = new BehaviorSubject<string>('');
  public activeChannelId$ = this.activeChannelIdSubject.asObservable();

  private buttonRectSubject = new BehaviorSubject<DOMRect | null>(null);
  buttonRect$ = this.buttonRectSubject.asObservable();

  setButtonRect(rect: DOMRect) {
    this.buttonRectSubject.next(rect);
  }

  getButtonRect(): DOMRect | null {
    return this.buttonRectSubject.value;
  }

  userData: User[] = [];
  currentUser?: User;
  currentUserId!: string;
  channels: any[] = [];
  showChannelByUser: any[] = [];
  channelCreaterId!: string;
  channelCreaterName: string = '';
  channelCreatedAt: Date = new Date();
  currentChannelId: string = '';
  currentChannelName: string = '';
  currentChannelDescription: string = '';
  userSubcollectionId: string = '';
  userSubcollectionChannelId: string = '';
  userSubcollectionChannelName: string = '';
  userSubcollectionDescription: string = '';
  selectedUser: any;
  channelCreatedAtFormatted: string = '';

  unsubscribeUserData!: Subscription;
  unsubscribeUserChannels!: Subscription;
  unsubscribeDeleteUserFromCh!: () => void;
  unsubscribeChannelCreater!: () => void;
  unsubscribeChannelCreaterName!: () => void;
  unsubscribeUserStorage!: Subscription;

  getUsersCollection(): CollectionReference {
    return runInInjectionContext(this.injector, () =>
      collection(this.firestore, 'users')
    );
  }

  getUserSubCol(docId: string) {
    return runInInjectionContext(this.injector, () =>
      collection(this.getSingleUserRef(docId), 'userstorage')
    );
  }

  getChannelRef() {
    return runInInjectionContext(this.injector, () =>
      collection(this.firestore, 'channels')
    );
  }

  getSingleChannelRef(docId: string) {
    return runInInjectionContext(this.injector, () =>
      doc(this.getChannelRef(), docId)
    );
  }

  getSingleUserRef(docId: string) {
    return runInInjectionContext(this.injector, () =>
      doc(this.getUsersCollection(), docId)
    );
  }

  async addNewChannel(allChannels: {}, userId: string[], user: string) {
    const dateNow = new Date();
    dateNow.setHours(0, 0, 0, 0);
    const channelWithUser = {
      ...allChannels,
      userId: [...userId],
      createdBy: user,
      createdAt: dateNow,
    };
    const docRef = await runInInjectionContext(this.injector, () =>
      addDoc(collection(this.firestore, 'channels'), channelWithUser)
    );
    const generatedChannelId = docRef.id;
    await runInInjectionContext(this.injector, () =>
      updateDoc(doc(this.firestore, 'channels', generatedChannelId), {
        channelId: generatedChannelId,
      })
    )
  }

  async getChannelUserId(channelId: string) {
    const channelRef = this.getSingleChannelRef(channelId);
    this.unsubscribeChannelCreaterName = runInInjectionContext(
      this.injector,
      () =>
        onSnapshot(channelRef, (element) => {
          const data = element.data();
          if (data) {
            this.channelCreaterId = data['createdBy'];
            const createdAtValue = data['createdAt'] || data['timestamp'];
            if (createdAtValue && createdAtValue instanceof Timestamp) {
              this.channelCreatedAt = createdAtValue.toDate();
            } else if (createdAtValue instanceof Date) {
              this.channelCreatedAt = createdAtValue;
            } else {
              this.channelCreatedAt = new Date();
            }
            this.getChannelUserName(this.channelCreaterId);
            this.channelCreatedAtFormatted = this.formatChannelCreatedAt(this.channelCreatedAt);
          }
        })
    );
  }

  private formatChannelCreatedAt(date: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return 'heute';
    } else if (isYesterday) {
      return 'gestern';
    } else {
      return `am ${date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })}`;
    }
  }

  getChannelUserName(userId: string) {
    const channelRef = this.getSingleUserRef(userId);
    this.unsubscribeChannelCreater = runInInjectionContext(this.injector, () =>
      onSnapshot(channelRef, (element) => {
        const data = element.data();
        if (data) {
          this.channelCreaterName = data['name'];
        }
      })
    );
  }

  getChannelName(docId: string) {
    const channelRef = this.getSingleChannelRef(docId);
    runInInjectionContext(this.injector, () =>
      onSnapshot(channelRef, (element) => {
        const data = element.data();
        if (data) {
          this.userSubcollectionChannelName = data['channelname'];
        }
      })
    );
  }

  showUserChannel() {
    const channelRef = this.getChannelRef();
    this.unsubscribeUserChannels = runInInjectionContext(this.injector, () =>
      collectionData(channelRef, { idField: 'channelId' })
    ).subscribe((channels) => {
      this.channels = [];
      this.channels = channels;
      this.checkChannel();
      this.channelsLoaded$.next(true);
    });
  }

  checkChannel() {
    this.showChannelByUser = this.channels.filter(
      (channel) =>
        Array.isArray(channel.userId) &&
        channel.userId.includes(this.currentUserId)
    );
    this.updateChannelByUser.next(this.showChannelByUser);
  }

  async updateUserStorage(userId: string, storageId: string, item: {}) {
    const storageDocRef = runInInjectionContext(this.injector, () =>
      doc(this.getUserSubCol(userId), storageId)
    );
    await runInInjectionContext(this.injector, () =>
      updateDoc(storageDocRef, item)
    );
  }

  async editChannel(docId: string, item: {}) {
    const singleChannelRef = this.getSingleChannelRef(docId);
    await runInInjectionContext(this.injector, () =>
      updateDoc(singleChannelRef, item)
    );
  }

  async deleteUserFromCh(channelId: string, item: any) {
    const channelRef = this.getSingleChannelRef(channelId);
    this.unsubscribeDeleteUserFromCh = runInInjectionContext(
      this.injector, () =>
      onSnapshot(channelRef, async (element) => {
        const data = element.data();
        if (data && Array.isArray(data['userId'])) {
          const filteredUserIds = data['userId'].filter((channelUser: string) => channelUser !== this.currentUserId);
          item.userId = filteredUserIds;
          await runInInjectionContext(this.injector, () =>
            updateDoc(channelRef, item)
          );
        }
      })
    );
  }

  async addUserToCh(channelId: string, newUserId: string) {
    const channelRef = this.getSingleChannelRef(channelId);
    await runInInjectionContext(this.injector, () =>
      updateDoc(channelRef, {
        userId: arrayUnion(newUserId)
      })
    );
  }

  setCheckdValue(user: string) {
    this.isCheckedSubject.next(user)
  }

  setActiveChannelId(channelId: string) {
    this.activeChannelIdSubject.next(channelId);
    this.currentChannelId = channelId;
  }

  getUserData() {
    this.isChecked$.subscribe(user => {
      this.selectedUser = user
    })
  }

  resetAllStates(userService?: any) {
    this.isCheckedSubject.next(null);
    this.activeChannelIdSubject.next('');
    this.currentChannelId = '';
    this.selectedUser = null;
    this.userSubcollectionChannelId = '';

    if (userService) {
      userService.chatId = '';
      userService.showChannel = false;
      userService.showChatPartnerHeader = false;
      userService.showNewMessage = true;
    }
  }

  ngOnDestroy(): void {
    if (this.unsubscribeUserData) {
      this.unsubscribeUserData.unsubscribe();
    }
    if (this.unsubscribeUserChannels) {
      this.unsubscribeUserChannels.unsubscribe();
    }
    if (this.unsubscribeUserStorage) {
      this.unsubscribeUserStorage.unsubscribe();
    }
    if (this.unsubscribeChannelCreater) {
      this.unsubscribeChannelCreater();
    }
    if (this.unsubscribeChannelCreaterName) {
      this.unsubscribeChannelCreaterName();
    }
    if (this.unsubscribeDeleteUserFromCh) {
      this.unsubscribeDeleteUserFromCh();
    }
  }
}