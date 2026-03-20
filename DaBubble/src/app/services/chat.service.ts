import { Injectable, inject, Injector, runInInjectionContext, NgZone } from '@angular/core';
import { Firestore, collection, query, where, getDocs, addDoc, onSnapshot, serverTimestamp, orderBy, DocumentReference, doc, updateDoc, CollectionReference, getDoc, limit, increment, writeBatch, WriteBatch, arrayUnion } from '@angular/fire/firestore';
import { UserService } from './user.service';
import { MatDrawer } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { ChannelService } from './channel.service';
import { NavigationService } from './navigation.service';
import { BehaviorSubject, last } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ChatService {

    private firestore = inject(Firestore);
    private injector = inject(Injector);
    private ngZone = inject(NgZone);
    dataUser = inject(UserService);
    messages: any[] = [];
    hasMessages: boolean = false;
    messageToday: boolean = false;
    mostUsedEmojis: string[] = [];
    private drawer!: MatDrawer;
    selectedUser: any;
    channelService = inject(ChannelService);
    navigationService = inject(NavigationService);
    private router = inject(Router);
    chatService: any;
    private unsubscribeMessages?: (() => void);
    private unsubscribeMessagesThread?: (() => void);
    private _messages$ = new BehaviorSubject<any[]>([]);
    messages$ = this._messages$.asObservable();
    messageDocRef: any;
    threadRef: any
    isThreadAktiv: boolean = false;
    chatId: string = '';
    parentMessageId: string = '';
    threadId: string = '';
    senderId: string = '';
    text: string = '';
    messageText: string = '';
    messagesThread: any[] = [];
    hasMessagesThread: boolean = false;
    parentMessagesRef: any;
    batch: any;
    chatMode: 'chats' | 'channels' = 'chats';
    showThread: boolean = false;

    async getOrCreateChatId(userId1: string, userId2: string): Promise<string> {
        return runInInjectionContext(this.injector, async () => {
            const chatsRef = collection(this.firestore, 'chats');
            if (userId1 === userId2) {
                return await this.getOrCreateSelfChat(chatsRef, userId1);
            }
            const existingChatId = await this.findExistingChatBetweenUsers(chatsRef, userId1, userId2);
            if (existingChatId) {
                return existingChatId;
            }
            return await this.createNewChat(chatsRef, [userId1, userId2]);
        });
    }

    private async getOrCreateSelfChat(chatsRef: CollectionReference, userId: string): Promise<string> {
        const selfQuery = query(chatsRef, where('userId', '==', [userId]));
        const selfSnapshot = await getDocs(selfQuery);
        if (!selfSnapshot.empty) {
            return selfSnapshot.docs[0].id;
        }
        const newSelfChat = await runInInjectionContext(this.injector, () =>
            addDoc(chatsRef, { userId: [userId] })
        );
        return newSelfChat.id;
    }

    private async findExistingChatBetweenUsers(chatsRef: CollectionReference, userId1: string, userId2: string): Promise<string | null> {
        const q = query(chatsRef, where('userId', 'array-contains', userId1));
        const snapshot = await getDocs(q);
        for (const doc of snapshot.docs) {
            const users = doc.data()['userId'];
            if (Array.isArray(users) && users.includes(userId2) && users.length === 2) {
                return doc.id;
            }
        }
        return null;
    }

    private async createNewChat(chatsRef: CollectionReference, users: string[]): Promise<string> {
        return runInInjectionContext(this.injector, async () => {
            const newChat = await addDoc(chatsRef, { userId: users });
            return newChat.id;
        })
    };

    async sendChatMessage(type: string, messageText: string, senderId: any, name?: string, avatar?: string) {
        return runInInjectionContext(this.injector, async () => {
            const messagesRef = collection(this.firestore, `${this.chatMode}/${this.chatId}/message`);
            await addDoc(messagesRef, {
                text: messageText,
                senderId: senderId,
                senderName: name,
                userAvatar: avatar,
                timestamp: serverTimestamp(),
            });
        })
    }

    async getChannelMessages(channelId: string): Promise<any[]> {
        return runInInjectionContext(this.injector, async () => {
            const messagesRef = collection(this.firestore, `channels/${channelId}/message`);
            const q = query(messagesRef, orderBy('createdAt', 'asc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        });
    }

    private async getExistingThreadId(type: string, chatId: string, parentMessageId: string): Promise<string | null> {
        const threadsCol = collection(this.firestore, `${this.chatMode}/${chatId}/message/${parentMessageId}/threads`);
        const existing = await getDocs(query(threadsCol, limit(1)));
        return existing.empty ? null : existing.docs[0].id;
    }

    private createThreadDocument(type: string, batch: WriteBatch, chatId: string, parentMessageId: string, senderId: string, text: string, threadId?: string, parentTimestamp?: any, senderName?: string, userAvatar?: string,): string {
        return runInInjectionContext(this.injector, () => {
            const threadsCol = collection(this.firestore, `${this.chatMode}/${chatId}/message/${parentMessageId}/threads`);
            const newThreadRef = threadId ? doc(threadsCol, threadId) : doc(threadsCol);
            batch.set(newThreadRef, {
                senderId,
                text,
                timestamp: parentTimestamp || serverTimestamp(),
                senderName,
                userAvatar: userAvatar,
            });
            return newThreadRef.id;
        });
    }

    async getOrCreateThread(type: string, chatId: string, parentMessageId: string, senderId: string, text: string, threadId?: string, name?: string, avatar?: string): Promise<string> {
        return runInInjectionContext(this.injector, async () => {
            const existingId = await this.getExistingThreadId(this.chatMode, chatId, parentMessageId);
            if (existingId) return existingId;
            const parentMsgRef = runInInjectionContext(this.injector, () =>
                doc(this.firestore, `${this.chatMode}/${chatId}/message/${parentMessageId}`)
            );
            const parentMsgSnap = await runInInjectionContext(this.injector, () =>
                getDoc(parentMsgRef)
            );
            const parentTimestamp = parentMsgSnap.exists() ? parentMsgSnap.data()?.['timestamp'] : null;
            const batch = runInInjectionContext(this.injector, () =>
                writeBatch(this.firestore)
            );
            const newThreadId = this.createThreadDocument(this.chatMode, batch, chatId, parentMessageId, senderId, text, threadId, parentTimestamp, name, avatar);
            this.incrementThreadCount(this.chatMode, batch, chatId, parentMessageId, parentTimestamp);
            await batch.commit();
            return newThreadId;
        });
    }

    private incrementThreadCount(type: string, batch: WriteBatch, chatId: string, parentMessageId: string, lastReplyTimestamp?: any): void {
        return runInInjectionContext(this.injector, () => {
            const parentMsgRef = doc(this.firestore, `${this.chatMode}/${chatId}/message/${parentMessageId}`);
            batch.update(parentMsgRef, {
                threadCount: increment(1),
                lastThreadReply: lastReplyTimestamp || serverTimestamp()
            });
        });
    }

    async getParrentMessageId(type: string) {
        return runInInjectionContext(this.injector, async () => {
            this.parentMessagesRef = collection(this.firestore, `${this.chatMode}/${this.chatId}/message`);
            const snapshot = await getDocs(this.parentMessagesRef);
            if (!snapshot.empty) {
                return snapshot.docs[0].id;
            }
            return null;
        });
    }

    async sendThreadMessage(type: string, chatId: string, rootId: string, senderId: string, text: string, senderName: string | undefined, userAvatar: string | undefined) {
        return runInInjectionContext(this.injector, async () => {
            const batch = writeBatch(this.firestore);
            this.createThreadDocument(this.chatMode, batch, chatId, rootId, senderId, text, undefined, undefined, senderName, userAvatar);
            this.incrementThreadCount(this.chatMode, batch, chatId, rootId, serverTimestamp());
            await batch.commit();
        });
    }

    listenToMessagesThread(type: string) {
        if (this.unsubscribeMessagesThread) {
            this.unsubscribeMessagesThread();
        }
        return runInInjectionContext(this.injector, async () => {
            const messagesRef = collection(this.firestore, `${this.chatMode}/${this.chatId}/message/${this.parentMessageId}/threads`);
            const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
            this.unsubscribeMessagesThread = onSnapshot(messagesQuery, (snapshot) => {
                this.messagesThread = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.hasMessagesThread = this.messagesThread.length !== 0;
            });
        });
    }

    async checkIfMessageHasThreads(type: string, parentMessageId: string) {
        const threadsRef = collection(this.firestore, `${this.chatMode}/${this.chatId}/message/${parentMessageId}/threads`);
        const threadsSnap = await getDocs(threadsRef);
        return !threadsSnap.empty;
    }

    listenToMessages(type: string) {
        if (this.unsubscribeMessages) this.unsubscribeMessages();

        return runInInjectionContext(this.injector, async () => {
            const ref = collection(this.firestore, `${this.chatMode}/${this.chatId}/message`);
            const qy = query(ref, orderBy('timestamp', 'asc'));

            this.unsubscribeMessages = onSnapshot(qy, (snap) => {
                this.ngZone.run(() => {
                    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    this._messages$.next(msgs);
                    this.hasMessages = msgs.length > 0;
                });
            });
        });
    }

    isFirstMessageOfDay(timestamp: any, index: number, messageArray?: any[]): boolean {
        const currentDate = this.getDateWithoutTime(timestamp?.toDate());
        if (!currentDate) return false;
        if (index === 0) return true;
        const messages = messageArray || this.messages;
        if (!messages || index >= messages.length || index < 1) return true;
        const prevMsg = messages[index - 1];
        const prevDate = this.getDateWithoutTime(prevMsg?.timestamp?.toDate());
        if (!prevDate) return true;
        return currentDate.getTime() !== prevDate.getTime();
    }

    private getDateWithoutTime(date: Date | undefined | null): Date | null {
        if (!date) return null;
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    getDateLabel(timestamp: any, messageIndex: number, messageArray?: any[]): string {
        const date = timestamp?.toDate ? timestamp.toDate() : null;
        if (!date) return '';
        if (!this.isFirstMessageOfDay(timestamp, messageIndex, messageArray)) return '';
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        if (msgDate.getTime() === todayDate.getTime()) return 'Heute';
        if (msgDate.getTime() === yesterdayDate.getTime()) return 'Gestern';
        return date.toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: 'long'
        });
    }

    async updateUserMessage(type: string, messageId: string, newMessage: string): Promise<void> {
        this.messageDocRef = this.getMessageDoc(this.chatMode, messageId);
        await runInInjectionContext(this.injector, () =>
            updateDoc(this.messageDocRef, { text: newMessage })
        );
    }

    getMessageDoc(type: string, messageId: string): DocumentReference {
        return runInInjectionContext(this.injector, () =>
            doc(this.firestore, `${this.chatMode}/${this.chatId}/message/${messageId}`)
        );
    }

    saveEmoji(emoji: string) {
        const stored = JSON.parse(localStorage.getItem('frequently') || '{}');
        stored[emoji] = (stored[emoji] || 0) + 1;
        localStorage.setItem('frequently', JSON.stringify(stored));
    }

    loadMostUsedEmojis() {
        const stored = localStorage.getItem('frequently');
        if (!stored) return;
        const recent = JSON.parse(stored) as Record<string, number>;
        this.mostUsedEmojis = Object.entries(recent)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([emoji]) => emoji);
    }
    setDrawer(drawer: MatDrawer) {
        this.drawer = drawer;
    }

    toggle() {
        this.drawer?.toggle();
    }

    open() {
        this.drawer?.open();
    }

    close() {
        this.drawer?.close();
    }

    isOpen(): boolean {
        return this.drawer?.opened || false;
    }

    checkIfChatOrChannel() {
        if (this.chatMode === 'chats') {
            const chatId = this.dataUser.chatId;
            if (!chatId || chatId.trim() === '') {
                return null;
            }
            return this.chatId = chatId;
        } else if (this.chatMode === 'channels') {
            const channelId = this.channelService.currentChannelId;
            if (!channelId || channelId.trim() === '') {
                return null;
            }
            return this.chatId = channelId;
        } else {
            return null;
        }
    }

    async onUserClick(type: string, index: number, user: any) {
        this.chatMode = 'chats';
        this.selectedUser = user;
        this.channelService.setCheckdValue(user);
        this.close();
        const chatId = await this.getOrCreateChatId(this.channelService.currentUserId, user.userId);
        this.chatId = chatId;
        this.dataUser.chatId = chatId;
        await this.router.navigate(['/mainpage', this.channelService.currentUserId, 'chats', chatId]);
        this.listenToMessages(chatId);
        this.dataUser.showChannel = false;
        this.dataUser.showChatPartnerHeader = true;
        this.navigationService.setMobileHeaderDevspace(true);
        if (this.navigationService.isMobile) {
            this.showThread = false;
        }
    }

    ngOnDestroy() {
        if (this.unsubscribeMessages) {
            this.unsubscribeMessages();
        }
        if (this.unsubscribeMessagesThread) {
            this.unsubscribeMessagesThread();
        }
    }

    private async resolveThreadSenderId(parentMessageId: string): Promise<string> {
        return runInInjectionContext(this.injector, async () => {
            const parentMsgRef = doc(this.firestore, `${this.chatMode}/${this.chatId}/message/${parentMessageId}`);
            const snap = await getDoc(parentMsgRef);
            if (!snap.exists()) return this.channelService.currentUserId;
            const data = snap.data() as any;
            const senderId = data?.senderId ??
                data?.userId ??
                data?.sender?.id ??
                this.channelService.currentUserId;
            return senderId;
        });
    }
    async answerOnMessage(type: string, parentMessageId: string, parentText: string, name?: string, avatar?: string) {
        return runInInjectionContext(this.injector, async () => {
            this.checkIfChatOrChannel();
            this.parentMessageId = parentMessageId;
            const senderIdForThread = await this.resolveThreadSenderId(parentMessageId);
            this.threadId = await this.getOrCreateThread(this.chatMode, this.chatId, parentMessageId, senderIdForThread, parentText, this.threadId, name, avatar);
            this.showThread = true;
            this.open();
            this.router.navigate(['/mainpage', this.channelService.currentUserId, this.chatMode, this.chatId, 'threads', this.threadId]);
            this.listenToMessagesThread(this.chatMode);
            this.navigationService.setMobileHeaderDevspace(true);
        });
    }

    saveEmojisThreadInDatabase(type: string, selectedEmoji: string, messageId: string, parentMessageId: string,) {
        return runInInjectionContext(this.injector, async () => {
            const messagesRef = doc(this.firestore, `${this.chatMode}/${this.chatId}/message/${parentMessageId}/threads/${messageId}`);
            const messageSnap = await getDoc(messagesRef);
            await this.checkIfEmojiExists(selectedEmoji, messageSnap, messagesRef);
        });
    }

    getLastThreadReplyTime(messageId: string): Date | null {
        const message = this.messages.find(msg => msg.id === messageId);
        if (message && message.lastThreadReply) {
            try {
                if (typeof message.lastThreadReply.toDate === 'function') {
                    return message.lastThreadReply.toDate();
                }
                if (message.lastThreadReply instanceof Date) {
                    return message.lastThreadReply;
                }
                if (typeof message.lastThreadReply === 'number') {
                    return new Date(message.lastThreadReply);
                }
            } catch (error) {
                console.error('Error converting lastThreadReply to Date:', error, message.lastThreadReply);
            }
        }
        return null;
    }

    async saveEmojisInDatabase(type: string, selectedEmoji: string, messageId: string) {
        return runInInjectionContext(this.injector, async () => {
            const messagesRef = doc(this.firestore, `${this.chatMode}/${this.chatId}/message/${messageId}`);
            const messageSnap = await getDoc(messagesRef);
            await this.checkIfEmojiExists(selectedEmoji, messageSnap, messagesRef);
        });
    }

    async checkIfEmojiExists(selectedEmoji: any, messageSnap: any, messagesRef: any) {
        return runInInjectionContext(this.injector, async () => {
            if (!messageSnap.exists()) return;

            const data = messageSnap.data();
            const reactions = data['reactions'] || [];
            const exists = reactions.some((r: any) => r.emoji === selectedEmoji && r.user === this.channelService.currentUser?.name);

            if (exists) {
                const next = reactions.filter((r: any) => !(r.emoji === selectedEmoji && r.user === this.channelService.currentUser?.name));
                await updateDoc(messagesRef, { reactions: next });
            } else {
                reactions.push({
                    emoji: selectedEmoji,
                    user: this.channelService.currentUser?.name,
                    emojiCounter: 1,
                });
                await updateDoc(messagesRef, { reactions });
            }
        });
    }

    listenToEmojis(type: string, chatId: string, messageId: string) {
        const reactionsRef = collection(
            this.firestore,
            `${this.chatMode}/${chatId}/message/${messageId}/reactions`
        );
        const q = query(reactionsRef, orderBy('createdAt', 'asc'));
        return onSnapshot(q, (snapshot) => {
            const emojis = snapshot.docs.map(doc => doc.data());
        });
    }
}
