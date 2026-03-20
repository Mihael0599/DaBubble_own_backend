export class User {
  name!: string;
  email!: string;
  password!: string;
  avatar!: string;
  userId!: string;
  userstorage!: string; 
  active: boolean;

  constructor(obj?: any) {

    this.name = obj ? obj.name : '';
    this.email = obj ? obj.email : '';
    this.password = obj ? obj.password : '';
    this.avatar = obj ? obj.avatar : '';
    this.userId! = obj ? obj.id : '';
    this.active = obj ? obj.active : false;
    this.userstorage = obj ? obj.userstorage : '';
  }

  public toJSON() {
    return {
      name: this.name,
      email: this.email,
      password: this.password,
      avatar: this.avatar,
      userId: this.userId,
      active: this.active,
      userstorage: this.userstorage
    }
  }
}