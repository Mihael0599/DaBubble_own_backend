export class Allchannels {
  channelname!: string;
  description?: string;
  channelId: string;
  createdAt: Date;
  createdBy: string;
  userId: string[];


  constructor(obj?: any) {
    this.channelname = obj ? obj.channelname : '';
    this.description = obj ? obj.description : '';
    this.channelId = obj ? obj.channelId : '';
    this.createdAt = obj && obj.createdAt ? new Date(obj.createdAt) : new Date();
    this.createdBy = obj ? obj.createdBy : '';
    this.userId = obj?.userId || [];
  }

  public toJSON(fields?: (keyof Allchannels)[]) {
    const json: any = {};
    const allFields:any  = {
      channelname: this.channelname,
      description: this.description,
      channelId: this.channelId,
      createdAt: this.createdAt,
      createdBy: this.createdBy,
      userId: this.userId
    };
    if (!fields) return allFields;
    for (const key of fields) {
      json[key] = allFields[key];
    }
    return json;
  }
}