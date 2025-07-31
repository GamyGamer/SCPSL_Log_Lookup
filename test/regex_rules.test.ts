import { describe, expect, it } from '@jest/globals';
import { SLRegExp } from '../src/regex_rules';
const TestData = {
  UserID: ['306161751077158933@discord', '76561198163699391@steam', 'hubertmoszka@northwood'],
  UserName: ['GamyGamer', 'Diagram [ERD]', 'Super gra (SL)'],
  Message: ['Hejka', 'Test wiadomosci', ' <-- [(On wie)]']
}



describe('Test SLRegExp captures', () => {
  let capture: SLRegExp | null
  describe('SplitLogs', () => {
    it.todo('TBD')
  })
  describe('SplitIP', () => {
    it.todo('TBD')
  })
  describe('Administrative', () => {
    describe('Check Adminchat', () => {
      it('Should capture SERVER CONSOLE', () => {
        capture = <SLRegExp>SLRegExp.Administrative.AdminChat.exec('[SERVER CONSOLE] Hejka');
        expect(capture).not.toBeNull()
        expect(capture.groups['UserID']).toBeUndefined()
        expect(capture.groups['UserName']).toStrictEqual('SERVER CONSOLE');
        expect(capture.groups['Message']).toStrictEqual('Hejka')
      });
      describe.each(TestData.UserID)(`Should capture UserID: %s`, (userid) => {
        describe.each(TestData.UserName)(`UserName: %s,`, (username) => {
          it.each(TestData.Message)(`Message: %s`, (message) => {
            capture = <SLRegExp>SLRegExp.Administrative.AdminChat.exec(`[${username} (${userid})] ${message}`)
            expect(capture).not.toBeNull()
            expect(capture.groups.UserName).toStrictEqual(username);
            expect(capture.groups.UserID).toStrictEqual(userid)
            expect(capture.groups.Message).toStrictEqual(message)
          })
        })
      })
    })
    it.todo('Tests for RoundLock')
    it.todo('Tests for LobbyLock')
    it.todo('Tests for Broadcast')
  })
  describe('Permissions', () => {
    it.todo('Tests for AssignedGroup')
  })
  describe('ClassChange', () => {
    it.todo('Tests for Ignore')
    it.todo('Tests for ForceClas')
    it.todo('Tests for RespawnAs')
    it.todo('Tests for RespawnManager')
    it.todo('Tests for Suicide')
    it.todo('Tests for Warhead')
    it.todo('Tests for SingleKill')
    it.todo('Tests for DirectKill')
    it.todo('Tests for TeamKill')
    it.todo('Tests for Death')
    describe('Skeleton', () => {
      it.todo('Tests for DisguiseSet')
      it.todo('Tests for DisguiseDrop')
    })
  })
  describe('Networking', () => {
    it.todo('Tests for Ignore')
    it.todo('Tests for Preauth')
    it.todo('Tests for Nickname')
    it.todo('Tests for Disconnect')
  })
  describe('Warhead', () => {
    it.todo('Tests for Status')
    it.todo('Tests for CountdownStart')
    it.todo('Tests for CountdownPaused')
    it.todo('Tests for Detonated')
  })
  describe('Logger', () => {
    it.todo('Tests for Ignore')
    it.todo('Tests for RoundStart')
    it.todo('Tests for RoundFinish')
  })
  describe('Door', () => {
    it.todo('TBD')
  })
  describe('DeathReason', () => {
    it.todo('Tests for SCPIntentional')
    it.todo('Tests for Decayed')
    it.todo('Tests for Recontained')
    it.todo('Tests for Suicide')
  })
})