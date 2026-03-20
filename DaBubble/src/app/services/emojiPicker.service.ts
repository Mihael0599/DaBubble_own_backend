import { Injectable, ElementRef } from '@angular/core';

export type PickerSide = 'left' | 'right';
export type PickerContext = 'chat' | 'channel' | 'thread';

interface PickerState {
  visible: boolean;
  top: number;
  left: number;
  anchorEl?: HTMLElement;
  anchorSide: 'left' | 'right';
  currentMessage?: any;
  currentMessageIndex?: number;
  chatContainer?: ElementRef<HTMLElement>;
  emojiPickerRef?: ElementRef<HTMLElement>;
}

@Injectable({ providedIn: 'root' })
export class EmojiPickerService {
  private states: Record<PickerContext, PickerState> = {
    chat: { visible: false, top: 0, left: 0, anchorSide: 'left' },
    thread: { visible: false, top: 0, left: 0, anchorSide: 'left' },
    channel: { visible: false, top: 0, left: 0, anchorSide: 'left' },
  };

  bindElements(ctx: PickerContext, chatContainer: ElementRef, emojiPickerRef: ElementRef) {
    this.states[ctx].chatContainer = chatContainer;
    this.states[ctx].emojiPickerRef = emojiPickerRef;
  }

  get state() { return this.states; } // für Templates: state.chat.visible etc.

  open(ev: { anchor: HTMLElement; side: 'left' | 'right'; message: any; index: number; context: 'chat' | 'thread' | 'channel' }) {
    const s = this.states[ev.context];
    s.visible = true;
    s.anchorEl = ev.anchor;
    s.anchorSide = ev.side;                // <- WICHTIG: Vorgabe der Komponente respektieren
    s.currentMessage = ev.message;
    s.currentMessageIndex = ev.index;

    setTimeout(() => this.reposition(ev.context));
  }

  hide(ctx: PickerContext) {
    this.states[ctx].visible = false;
  }

  reposition(ctx: 'chat' | 'thread' | 'channel') {
    const s = this.states[ctx];
    const container = s.chatContainer?.nativeElement;
    const anchor = s.anchorEl;
    const pickerEl = s.emojiPickerRef?.nativeElement;
    if (!container || !anchor || !pickerEl) return;

    const cRect = container.getBoundingClientRect();
    const aRect = anchor.getBoundingClientRect();
    const pickerW = pickerEl.offsetWidth || 320;
    const pickerH = pickerEl.offsetHeight || 340;

    const styles = getComputedStyle(container);
    const padL = parseFloat(styles.paddingLeft) || 0;
    const padR = parseFloat(styles.paddingRight) || 0;
    const padT = parseFloat(styles.paddingTop) || 0;
    const padB = parseFloat(styles.paddingBottom) || 0;

    const topIn = (aRect.top - cRect.top) + container.scrollTop;
    const leftIn = (aRect.left - cRect.left) + container.scrollLeft;

    // oberhalb, sonst unterhalb
    let top = topIn - pickerH;
    const minTop = container.scrollTop + padT;
    const maxTop = container.scrollTop + container.clientHeight - padB - pickerH;
    if (top < minTop) top = topIn + aRect.height;
    top = Math.max(minTop, Math.min(top, maxTop));

    // links/rechts anhand anchorSide, dann clampen
    let left = s.anchorSide === 'left'
      ? leftIn
      : leftIn + aRect.width - pickerW;

    const minLeft = container.scrollLeft + padL;
    const maxLeft = container.scrollLeft + container.clientWidth - padR - pickerW;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    s.top = top;
    s.left = left;
  }


  private chooseSide(ctx: PickerContext, anchorEl: HTMLElement, preferred: 'left' | 'right'): 'left' | 'right' {
    const s = this.states[ctx];
    const container = s.chatContainer?.nativeElement;
    const pickerEl = s.emojiPickerRef?.nativeElement;
    if (!container || !anchorEl) return preferred;

    const cRect = container.getBoundingClientRect();
    const aRect = anchorEl.getBoundingClientRect();
    const pickerW = pickerEl?.offsetWidth || 320;

    const spaceLeft = aRect.left - cRect.left;
    const spaceRight = cRect.right - aRect.right;

    if (preferred === 'left' && spaceLeft < pickerW && spaceRight >= spaceLeft) return 'right';
    if (preferred === 'right' && spaceRight < pickerW && spaceLeft >= spaceRight) return 'left';
    return preferred;
  }
}
