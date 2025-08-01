// import { InternetProtocol } from "./internetprotocol";

//This class should be the only one that stores `User` class as a whole, other modules that are dependent on User should store UserID only. //TODO: Also it has to be unique
class UserList {
    private UserList: Array<User>
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
    GetUser(userid: User['ID']): User {
        return this.UserList[this.FindUser(userid)]
    }
}

class User {
    ID: string;
    private nickname: Set<string>;
    private IP: Set<string>; //TODO: This will be changed to some kind of InternetProtocol class/interface/types
    constructor(ID: string, nickname: string, IP: string) {
        this.ID = ID;
        this.nickname = new Set([nickname]);
        this.IP = new Set([IP])
    }
    AddNickname(nickname: string) {
        this.nickname.add(nickname)
    }
    AddIP(ip: string) {
        this.IP.add(ip);
    }
    GetNickname(): Set<string> {
        return this.nickname
    }
    GetIP():Set<string>{
        return this.IP;
    }
}

export { User, UserList }