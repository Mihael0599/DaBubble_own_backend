import { Injectable, inject, Injector, runInInjectionContext} from '@angular/core';
import { Firestore, collection, query, where, getDocs, addDoc, doc, CollectionReference, collectionData, getDoc, updateDoc, deleteDoc, docData, } from '@angular/fire/firestore';
import { User } from '../../models/user.class';
import { map, Observable } from 'rxjs';
import { Auth, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ChannelService } from './channel.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore = inject(Firestore);
  channelService = inject(ChannelService);
  private router = inject(Router);
  private auth = inject(Auth);
  private injector = inject(Injector);
  onlineUser: string = 'status/online.png';
  offlineUser: string = 'status/offline.png';
  showChannel = false;
  showChatPartnerHeader = false;
  showNewMessage = true;
  private freshLogin = false;
  usersIdsInChannel: any[] = [];
  userNamesInChannel: any[] = [];
  userAvatarInChannel: any[] = [];
  private pendingRegistrationId = new BehaviorSubject<string | null>(null);
  pendingRegistrationId$ = this.pendingRegistrationId.asObservable();
  userAvatarInChannel$ = new BehaviorSubject<{ name: string; avatar: string; userId: string, userActive: boolean, email: string, active: boolean }[]>([]);
  pendingUser: User | null = null;
  loginIsSucess = false;
  chatId: any = '';

  getUsersCollection(): CollectionReference {
    return runInInjectionContext(this.injector, () =>
      collection(this.firestore, 'users')
    );
  }

  getSingleUserRef(docId: string) {
    return runInInjectionContext(this.injector, () =>
      doc(this.getUsersCollection(), docId)
    );
  }

  getUserRefsByIds() {
    return this.usersIdsInChannel.map((id) => {
      if (!id || id.trim() === '') {
        return null;
      }
      return runInInjectionContext(this.injector, () =>
        doc(this.getUsersCollection(), id)
      );
    }).filter(ref => ref !== null);
  }

  getChatRef(docId: string) {
    return runInInjectionContext(this.injector, () =>
      collection(this.getSingleUserRef(docId), 'chats')
    );
  }

  async loginService(email: string, password: string) {
    const userQuery = runInInjectionContext(this.injector, () =>
      query(
        this.getUsersCollection(),
        where('email', '==', email),
        where('password', '==', password)
      )
    );

    const result = await runInInjectionContext(this.injector, () =>
      getDocs(userQuery)
    );

    if (!result.empty) {
      const userDoc = result.docs[0];
      this.channelService.currentUserId = userDoc.id;
      await this.updateUserDocument(this.channelService.currentUserId, {
        active: true,
      });
    }
    const userStorageSnapshot = await runInInjectionContext(this.injector, () =>
      getDocs(
        this.channelService.getUserSubCol(this.channelService.currentUserId)
      )
    );
    if (!userStorageSnapshot.empty) {
      const userStorage = userStorageSnapshot.docs[0];
      this.channelService.userSubcollectionId = userStorage.id;
    }
    this.loginIsSucess = true;
    this.freshLogin = true;
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await runInInjectionContext(this.injector, () =>
        signInWithPopup(this.auth, provider)
      );
      const user = credential.user;

      const userQuery = runInInjectionContext(this.injector, () =>
        query(this.getUsersCollection(), where('email', '==', user.email))
      );

      const result = await runInInjectionContext(this.injector, () =>
        getDocs(userQuery)
      );

      if (result.empty) {
        const newUser = new User();
        newUser.email = user.email || '';
        newUser.name = user.displayName || user.email?.split('@')[0] || '';
        newUser.avatar = 'empty-avatar.png';
        newUser.active = true;
        const { userId, userStorageId } = await this.createUserBySignInWithGoogle(newUser);
        this.channelService.currentUserId = userId;
        this.channelService.userSubcollectionId = userStorageId;
      } else {
        const userDoc = result.docs[0];
        this.channelService.currentUserId = userDoc.id;
        await this.updateUserDocument(this.channelService.currentUserId, {
          active: true,
        });
        
        const userStorageSnapshot = await runInInjectionContext(this.injector, () =>
          getDocs(
            this.channelService.getUserSubCol(this.channelService.currentUserId)
          )
        );
        if (!userStorageSnapshot.empty) {
          const userStorage = userStorageSnapshot.docs[0];
          this.channelService.userSubcollectionId = userStorage.id;
        }
      }
      this.loginIsSucess = true;
      this.freshLogin = true;
      this.router.navigate(['mainpage', this.channelService.currentUserId]);
      return user;
    } catch (error) {
      console.log('Error during Google sign in', error);
      throw error;
    }
  }

  async signInWithGuest() {
    const guestEmail = 'guestemail@gmail.com';
    const userQuery = runInInjectionContext(this.injector, () =>
      query(this.getUsersCollection(), where('email', '==', guestEmail))
    );

    const result = await runInInjectionContext(this.injector, () =>
      getDocs(userQuery)
    );

    if (!result.empty) {
      if (!result.empty) {
        const userDoc = result.docs[0];
        this.channelService.currentUserId = userDoc.id;
        this.channelService.currentUser = new User(userDoc.data());
        await this.updateUserDocument(this.channelService.currentUserId, {
          active: true,
        });
        this.loginIsSucess = true;
        this.freshLogin = true;
      }
    } else {
      console.log('Guest user not found. Please create a guest user first.');
    }
  }

  async createUserBySignInWithGoogle(
    user: User
  ): Promise<{ userId: string; userStorageId: string }> {
    try {
      const userData: any = {
        active: true,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      };
      if (user.password) {
        userData.password = user.password;
      }

      const userRef = await runInInjectionContext(this.injector, () =>
        addDoc(collection(this.firestore, 'users'), userData)
      );
      const userId = userRef.id;
      const userStorageColRef = runInInjectionContext(this.injector, () =>
        collection(userRef, 'userstorage')
      );
      const userStorageDocRef = await runInInjectionContext(this.injector, () =>
        addDoc(userStorageColRef, {
          channel: user.userstorage,
        })
      );
      const userStorageId = userStorageDocRef.id;
      return {
        userId,
        userStorageId,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateUserDocument(userId: string, data: any) {
    return runInInjectionContext(this.injector, () => {
      const userDocRef = doc(this.firestore, 'users', userId);
      return updateDoc(userDocRef, data);
    });
  }

  async createInitialUser(
    user: User
  ): Promise<{ userId: string; userStorageId: string }> {
    try {
      const userData: any = {
        active: false,
        name: user.name,
        email: user.email,
        password: user.password,
        avatar: 'empty-avatar.png',
        registrationComplete: false,
      };

      const userRef = await runInInjectionContext(this.injector, () =>
        addDoc(collection(this.firestore, 'users'), userData)
      );
      const userId = userRef.id;
      const userStorageColRef = runInInjectionContext(this.injector, () =>
        collection(userRef, 'userstorage')
      );

      const userStorageDocRef = await runInInjectionContext(this.injector, () =>
        addDoc(userStorageColRef, {})
      );
      const userStorageId = userStorageDocRef.id;
      this.pendingRegistrationId.next(userId);
      this.pendingUser = user;
      return {
        userId,
        userStorageId,
      };
    } catch (error) {
      console.log('Error creating initial user:', error);
      throw error;
    }
  }

  getPendingRegistrationId(): string | null {
    return this.pendingRegistrationId.getValue();
  }

  async completeUserRegistration(avatarPath: string): Promise<boolean> {
    const userId = this.pendingRegistrationId.getValue();
    if (!userId) {
      return false;
    }
    try {
      await runInInjectionContext(this.injector, () =>
        updateDoc(doc(this.firestore, 'users', userId), {
          avatar: avatarPath,
          registrationComplete: true,
        })
      );
      this.pendingRegistrationId.next(null);
      return true;
    } catch (error) {
      console.log('Update failed:', error);
      return false;
    }
  }

  async cleanupIncompleteRegistration(): Promise<void> {
    const userId = this.pendingRegistrationId.getValue();
    if (userId) {
      await runInInjectionContext(this.injector, () =>
        deleteDoc(doc(this.firestore, 'users', userId))
      );
      this.pendingRegistrationId.next(null);
      this.pendingUser = null;
    }
  }

  async updateUserName(newName: string): Promise<void> {
    if (!this.channelService.currentUserId) {
      throw new Error('Kein eingeloggter Benutzer');
    }
    const userRef = this.getSingleUserRef(this.channelService.currentUserId);
    await runInInjectionContext(this.injector, () =>
      updateDoc(userRef, { name: newName })
    );
    if (this.channelService.currentUser) {
      this.channelService.currentUser.name = newName;
    }
  }

  async updateUserAvatar(newAvatar: string): Promise<void> {
    if (!this.channelService.currentUserId) {
      throw new Error('Kein eingeloggter Benutzer');
    }
    const userRef = this.getSingleUserRef(this.channelService.currentUserId);
    await runInInjectionContext(this.injector, () =>
      updateDoc(userRef, { avatar: newAvatar })
    );
    if (this.channelService.currentUser) {
      this.channelService.currentUser.avatar = newAvatar;
    }
  }

  getAllUsers(): Observable<User[]> {
    return runInInjectionContext(this.injector, () =>
      collectionData(this.getUsersCollection(), { idField: 'userId' })
    ) as Observable<User[]>;
  }

  async getUserIdsFromChannel(docId: string) {
    this.clearUserInChannelsArray();
    try {
      const snapshot = await runInInjectionContext(this.injector, () =>
        getDoc(this.channelService.getSingleChannelRef(docId))
      );
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data['userId'])) {
          this.usersIdsInChannel.push(...data['userId']);
          for (const id of this.usersIdsInChannel) {
            const nameSnap = await runInInjectionContext(this.injector, () =>
              getDoc(this.getSingleUserRef(id))
            );
            const dataName = nameSnap.data();
            if (dataName) {
              this.userAvatarInChannel$.next([
                ...this.userAvatarInChannel$.value,
                { avatar: dataName['avatar'], name: dataName['name'], userId: id, userActive: dataName['active'], email: dataName['email'], active: dataName['active'] }
              ]);
            }
          }
        }
      }
    } catch (error) {
      console.log('Error getting user IDs from channel:', error);
    }
  }

  async showCurrentUserData() {
    const userRef = this.getSingleUserRef(this.channelService.currentUserId);
    this.channelService.unsubscribeUserData = runInInjectionContext(
      this.injector,
      () => docData(userRef)
    ).subscribe((data) => {
      this.channelService.currentUser = new User(data);
    });
    const storageRef = this.channelService.getUserSubCol(
      this.channelService.currentUserId
    );
    const storageSnapshot = await runInInjectionContext(this.injector, () =>
      getDocs(storageRef)
    );
    storageSnapshot.forEach((doc) => {
      const data = doc.data();
      this.channelService.userSubcollectionChannelId = data['channelId'];
      this.channelService.userSubcollectionId = doc.id;
      
      if (!this.freshLogin) {
        if (this.channelService.userSubcollectionChannelId && 
            this.channelService.userSubcollectionChannelId.trim() !== '') {
          this.channelService.getChannelName(this.channelService.userSubcollectionChannelId);
        }
        if (data['chatId'] && data['chatId'].trim() !== '') {
          this.chatId = data['chatId'];
        }
      }
    });
    
    if (!this.freshLogin) {
      if (this.channelService.userSubcollectionChannelId && 
          this.channelService.userSubcollectionChannelId.trim() !== '') {
        this.getUserIdsFromChannel(this.channelService.userSubcollectionChannelId);
      }
    } else {
      this.freshLogin = false;
      this.showChannel = false;
      this.showChatPartnerHeader = false;
      this.showNewMessage = true;
      this.chatId = '';
    }
    this.channelService.showUserChannel();
  }

  clearUserInChannelsArray() {
    this.usersIdsInChannel = [];
    this.userAvatarInChannel$.next([]);
  }

  showFilteredUsers(input: string): Observable<User[]> {
    return this.getAllUsers().pipe(
      map((users: User[]) =>
        users.filter((user: User) =>
          user.name.toLowerCase().startsWith(input.toLowerCase())
        )
      )
    );
  }
}
