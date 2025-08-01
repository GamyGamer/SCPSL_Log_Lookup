import { describe, expect, it } from '@jest/globals';
import { User, UserList } from '../src/user';

let listOfUsers: UserList
let TestData = [
    ['306161751077158933@discord', 'gamygamer#0', '127.0.0.1'],
    ['76561198163699391@steam', 'Paczka', '192.168.1.1'],
    ['hubertmoszka@northwood', 'Hubert', '10.100.100.100']
]


listOfUsers = new UserList()
for (let index = 0; index < TestData.length; index++) {
    const element = TestData[index];
    listOfUsers.AddUser(new User(element[0], element[1], element[2]))
}

describe('User', () => {
    it('User should exist', () => {
        expect(listOfUsers.UserExist('306161751077158933@discord')).toBeTruthy()
        expect(listOfUsers.UserExist('76561198163699391@steam')).toBeTruthy()
        expect(listOfUsers.UserExist('hubertmoszka@northwood')).toBeTruthy()
        expect(listOfUsers.UserExist('nieznany@gdzies')).toBeFalsy()
    })
    it('Should return index of userdata', () => {
        expect(listOfUsers.FindUser('306161751077158933@discord')).toStrictEqual(0)
        expect(listOfUsers.FindUser('76561198163699391@steam')).toStrictEqual(1)
        expect(listOfUsers.FindUser('hubertmoszka@northwood')).toStrictEqual(2)
        expect(() => { listOfUsers.FindUser('nieznany@gdzies') }).toThrow('User with UserID:nieznany@gdzies could not be found in UserList')
    })
    it('Should not allow adding same user', () => {
        expect(() => { listOfUsers.AddUser(new User('nieznany@gdzies', 'aaa', 'aaa')) }).not.toThrow(`User with UserID:nieznany@gdzies already exits and cannot be added`)
        expect(() => { listOfUsers.AddUser(new User('nieznany@gdzies', 'aaa', 'aaa')) }).toThrow(`User with UserID:nieznany@gdzies already exits and cannot be added`)
    })
    it('Should add new Nickname', () => {
        listOfUsers.GetUser('306161751077158933@discord').AddNickname('Paczkomat')
        expect(listOfUsers.GetUser('306161751077158933@discord').GetNickname()).not.toContain('aaa')
        expect(listOfUsers.GetUser('306161751077158933@discord').GetNickname()).toContain('Paczkomat')
        expect(listOfUsers.GetUser('306161751077158933@discord').GetNickname()).toContain('gamygamer#0')
    })
    it('Should add new IP', () => {
        listOfUsers.GetUser('306161751077158933@discord').AddIP('127.0.0.2')
        expect(listOfUsers.GetUser('306161751077158933@discord').GetIP()).not.toContain('127.0.0.3')
        expect(listOfUsers.GetUser('306161751077158933@discord').GetIP()).toContain('127.0.0.1')
        expect(listOfUsers.GetUser('306161751077158933@discord').GetIP()).toContain('127.0.0.2')

    })
    it('Nickname should be unique',()=>{
        expect(listOfUsers.GetUser('306161751077158933@discord').GetNickname().size).toStrictEqual(2)
        listOfUsers.GetUser('306161751077158933@discord').AddNickname('Paczkomat')
        expect(listOfUsers.GetUser('306161751077158933@discord').GetNickname().size).toStrictEqual(2)
    })
    it('IP should be unique',()=>{
        expect(listOfUsers.GetUser('306161751077158933@discord').GetIP().size).toStrictEqual(2)
        listOfUsers.GetUser('306161751077158933@discord').AddIP('127.0.0.3')
        expect(listOfUsers.GetUser('306161751077158933@discord').GetIP().size).toStrictEqual(3)
        listOfUsers.GetUser('306161751077158933@discord').AddIP('127.0.0.1')
        expect(listOfUsers.GetUser('306161751077158933@discord').GetIP().size).toStrictEqual(3)
    });
});
