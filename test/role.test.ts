import { describe, expect, it, jest } from '@jest/globals';
import { Role } from '../src/role';
import { Settings } from '../src/settings';

describe('Check SCPS', () => {
	it.each(Role.Aligments.SCP)(`Check if role is SCP`, (role) => {
		expect(Role.IsSCP(role)).toBeTruthy();
	});
	it.each(Role.Aligments.Chaos)(`Check if role is not SCP`, (role) => {
		expect(Role.IsSCP(role)).toBeFalsy();
	});
	it.each(Role.Aligments.Foundation)(`Check if role is not SCP`, (role) => {
		expect(Role.IsSCP(role)).toBeFalsy();
	});
	it.each(Role.Aligments.Misc)(`Check if role is not SCP`, (role) => {
		expect(Role.IsSCP(role)).toBeFalsy();
	});
	it('should throw an error', () => {
		expect(() => { Role.IsSCP(<any>undefined) }).toThrow('Role is undefined')
	})
});
describe('Check Civilian', () => {
	it.each(Role.Aligments.Foundation)(`Check if role is Civilian`, (role) => {
		if (role == 'Scientist') {
			expect(Role.IsCivilian(role)).toBeTruthy();
		}
		else {
			expect(Role.IsCivilian(role)).toBeFalsy();
		}
	});
	it('should throw an error', () => {
		expect(() => { Role.IsCivilian(<any>undefined) }).toThrow('Role is undefined')
	});
});
describe('Check TranslateToInternal', () => {
	let logSpy = jest.spyOn(console, 'warn').mockImplementation(() => Promise.resolve())
	it('Should throw an exception because nothing was provided', () => {
		expect(() => { Role.TranslateToInternal(<any>undefined) }).toThrow('Unable to translate undefined role')
	})
	it('Should print warn in console that role none was detected', () => {
		expect(Role.TranslateToInternal('None')).toBe('None')
		expect(logSpy).toHaveBeenCalledWith('WARNING, ROLE NONE (POSSIBLE NULL PLAYER) DETECTED!!!')
	})
	it('Should return Specator when Destroyed was encountered', () => {
		expect(Role.TranslateToInternal('Destroyed')).toBe('Spectator')
	})
	it('Should return internal Role name', () => {
		expect(Role.TranslateToInternal('SCP-173')).toBe('Scp173')
	})
	it('Should return Unknown role when it doesn`t exists', () => {
		expect(Role.TranslateToInternal('FunnyRole')).toBe('UnknownRole_ReportToLogParserProgrammer')
		expect(logSpy).toHaveBeenCalledWith('Role "FunnyRole" has no defined translation')
	})
	it('Should throw an exception when strict mode is enabled', () => {
		Settings.strict_mode = true
		expect(() => { Role.TranslateToInternal('FunnyRole') }).toThrow('Role "FunnyRole" has no defined translation')
	})
})