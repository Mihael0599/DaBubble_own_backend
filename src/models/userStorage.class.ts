interface UserstorageOptions {
    channelId?: string;
    chatId?: string;
    showChannel?: boolean;
}

export class Userstorage {
    channelId!: string;
    chatId!: string;
    showChannel!: boolean;

    constructor(obj?: UserstorageOptions) {
        this.channelId = obj?.channelId ?? '';
        this.chatId = obj?.chatId ?? '';
        this.showChannel = obj?.showChannel ?? false;
    }

  public toJSON(fields?: (keyof Userstorage)[]) {
    const json: any = {};
    const allFields:any  = {
      channelId: this.channelId,
      chatId: this.chatId,
      showChannel: this.showChannel
    };
    if (!fields) return allFields;
    for (const key of fields) {
      json[key] = allFields[key];
    }
    return json;
  }
}