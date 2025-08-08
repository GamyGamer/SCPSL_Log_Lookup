import { beforeEach, describe, expect, it } from '@jest/globals';
import { ConnectionEvent, DeathEvent, RespawnEvent, RoundStartEvent } from '../src/keyframedata';
import { EventType } from '../src/gameevent';


describe('Create RoundStartEvent', () => {
	let Event = new RoundStartEvent()
	it('Should contain correct event_type', () => {
		expect(Event.getEventType()).toStrictEqual(EventType.Specific.RoundStart)
	})
})

describe('Create DeathEvent', () => {
	describe('One Player', () => {
		let Event: DeathEvent
		beforeEach(() => {
			Event = new DeathEvent('gamy@local', 'ClassD', 'died')
		})
		it('Should contain correct event_type', () => {
			expect(Event.getEventType()).toStrictEqual(EventType.Specific.Death)
		})
		it('Should contain correct death_type', () => {
			expect(Event.getDeathType()).toStrictEqual('died')
		})
		it('Should contain new role', () => {
			expect(Event.player.get('gamy@local')).toStrictEqual('ClassD')
		})
		it('Should fail (technically never in this state)', () => {
			Event.death_type = 'killed'
			expect(() => { Event.getKillerMap() }).toThrow('Despite not having single type kill, Killer Map does not exists')

		})

	})
	describe('Two Players', () => {
		let Event: DeathEvent
		beforeEach(() => {
			Event = new DeathEvent('gamy@local', 'ClassD', 'killed', 'Killer', 'ChaosConscript')
		})
		it('Should contain correct event_type', () => {
			expect(Event.getEventType()).toStrictEqual(EventType.Specific.Death)
		})
		it('Should contain correct death_type', () => {
			expect(Event.getDeathType()).toStrictEqual('killed')
		})
		it('Should contain new role', () => {
			expect(Event.getPlayerMap().get('gamy@local')).toStrictEqual('ClassD')
		})
		it('Should return Killer Map', () => {
			expect(Event.getKillerMap()).toStrictEqual(new Map().set('Killer', 'ChaosConscript'))
		})
		it('Should fail (technically never in this state)', () => {
			Event.death_type = 'died'
			expect(() => { Event.getKillerMap() }).toThrow('Killer Map does not exist')
		})
	})

	it('Should fail', () => {
		expect(() => { new DeathEvent('gamy@local', 'ClassD', 'killed', 'Evil@network') }).toThrow("Invalid construction of Death event, KillerID and KillerRole have to exist on death types that should contain killer data")
		expect(() => { new DeathEvent('gamy@local', 'ClassD', 'teamkilled') }).toThrow("Invalid construction of Death event, KillerID and KillerRole have to exist on death types that should contain killer data")
		expect(() => { new DeathEvent('gamy@local', 'ClassD', 'died', 'Evil@network', 'NtfSpecialist') }).toThrow("KillerID and KillerRole can't exist on death types that shouldn't contain killer data")
	})
})

describe('Create RespawnEvent', () => {
	let Event: RespawnEvent
	beforeEach(() => {
		Event = new RespawnEvent('gamy@local', 'NtfPrivate')
	})
	it('Should return all players', () => {
		expect(Event.GetPlayerMap().size).toStrictEqual(1)
		expect(Event.GetPlayerMap().get('gamy@local')).toStrictEqual('NtfPrivate')
		expect(Event.GetPlayerMap().get('Evil@network')).toBeUndefined()
		Event.AddPlayer('Evil@network', 'ChaosRifleman')
		expect(Event.GetPlayerMap().size).toStrictEqual(2)
		expect(Event.GetPlayerMap().get('gamy@local')).toStrictEqual('NtfPrivate')
		expect(Event.GetPlayerMap().get('Evil@network')).toStrictEqual('ChaosRifleman')

	})
	it('Should handle teams', () => {
		let TempEvent = new RespawnEvent('gamy@local', 'NtfPrivate', 'FoundationForces')
		expect(TempEvent.GetTeam()).toStrictEqual('FoundationForces')
		TempEvent.SetTeam('ChaosInsurgency')
		expect(TempEvent.GetTeam()).toStrictEqual('ChaosInsurgency')
	})
	it('Should fail', () => {
		expect(() => { Event.AddPlayer('gamy@local', 'ClassD') }).toThrow('This player already exists')
	})
})

describe('Create ConnectionEvent', () => {
	let Con_Event: ConnectionEvent
	let Disc_Event: ConnectionEvent
	beforeEach(() => {
		Con_Event = new ConnectionEvent('gamy@local', 'Connected')
		Disc_Event = new ConnectionEvent('Evil@network', 'Disconnected')
	})
	it('Should return connection type',()=>{
		expect(Con_Event.getConnectionType()).toStrictEqual('Connected')
		expect(Disc_Event.getConnectionType()).toStrictEqual('Disconnected')
	})
	it('Should return userID',()=>{
		expect(Con_Event.getPlayerID()).toStrictEqual('gamy@local')
		expect(Disc_Event.getPlayerID()).toStrictEqual('Evil@network')
	})
	it('Should return playerRole',()=>{
		expect(Con_Event.getPlayerRole()).toStrictEqual('None')
		Con_Event.setPlayerRole('ClassD')
		expect(Con_Event.getPlayerRole()).toStrictEqual('ClassD')
	})
	it('Should return PlayerMap',()=>{
		expect(Con_Event.getPlayerMap()).toStrictEqual(new Map().set('gamy@local','None'))
	})
	it('Should fail',()=>{
		let Test_Event = new ConnectionEvent(<any>undefined,<any>undefined)
		expect(()=>{Test_Event.getPlayerID()}).toThrow('Something went wrong when getting PlayerID')
		Con_Event.setPlayerRole(<any>undefined)
		expect(()=>{Con_Event.getPlayerRole()}).toThrow('Something went wrong when getting player role')
	})
})