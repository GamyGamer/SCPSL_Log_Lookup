// import { InternetProtocol } from "./internetprotocol";

//This class should be the only one that stores `User` class as a whole, other modules that are dependent on User should store UserID only. Also it has to be unique
class UserList {
    UserList: Array<User>
    constructor() {
        this.UserList = new Array();
    }
    FindUser(userid: User['ID']): number {
        for (let index = 0; index < this.UserList.length; index++) {
            const element = this.UserList[index];
            if (element.ID == userid) {
                return index;
            }
        }
        throw new Error(`User with UserID:${userid} could not be found in UserList.`);
    }
    UserExist(userid: User['ID']): boolean {
        for (let index = 0; index < this.UserList.length; index++) {
            const element = this.UserList[index];
            if (element.ID == userid) {
                return true;
            }
        }
        return false
    }
    AddUser(user: User): void {
        if (!this.UserExist(user.ID)) { this.UserList.push(user) }
        else {
            throw new Error(`User with UserID:${user.ID} already exits and cannot be added`);
        }
    }

}

class User {
    ID: string;
    nickname: Array<string>;
    IP: Array<string>;
    constructor(ID: string, nickname: string, IP: string) {
        this.ID = ID;
        this.nickname = new Array(nickname);
        this.IP = new Array(IP)
    }
    AddNickname(nickname: string) {
        this.nickname.push(nickname)
    }
    AddIP(ip: string) {
        this.IP.push(ip);
    }
}

export { User, UserList }