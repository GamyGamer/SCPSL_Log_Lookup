import { beforeEach, describe, expect, it } from '@jest/globals';
import { ConnectionEvent, DeathEvent, DecontaminationStartedEvent, DoorEvent, ForceClassEvent, RespawnEvent, RoundFinishEvent, RoundStartEvent, ThrowableEvent, WarheadEvent } from '../src/keyframedata';
import { EventType } from '../src/gameevent';


describe('Create RoundStartEvent', () => {
	let Event = new RoundStartEvent()
	it('Should contain correct event_type', () => {
		expect(Event.getEventType()).toStrictEqual(EventType.Specific.RoundStart)
		expect(Event.hasPlayerMap()).toBeTruthy()
		Event.addPlayer('gamy@local', 'ClassD')
		expect(Event.getPlayerMap().get('gamy@local')).toStrictEqual('ClassD')
	})
})

describe('Create RoundFinishEvent', () => {
	let Event = new RoundFinishEvent()
	it('Should contain corrent event_type', () => {
		expect(Event.getEventType()).toStrictEqual(EventType.Specific.RoundFinish)
		expect(Event.hasPlayerMap()).toBeFalsy()
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
		it('Should return if it has PlayerMap', () => {
			expect(Event.hasPlayerMap()).toBeTruthy()
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
		it('Should return if it has PlayerMap', () => {
			expect(Event.hasPlayerMap()).toBeTruthy()
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
		expect(Event.getPlayerMap().size).toStrictEqual(1)
		expect(Event.getPlayerMap().get('gamy@local')).toStrictEqual('NtfPrivate')
		expect(Event.getPlayerMap().get('Evil@network')).toBeUndefined()
		Event.AddPlayer('Evil@network', 'ChaosRifleman')
		expect(Event.getPlayerMap().size).toStrictEqual(2)
		expect(Event.getPlayerMap().get('gamy@local')).toStrictEqual('NtfPrivate')
		expect(Event.getPlayerMap().get('Evil@network')).toStrictEqual('ChaosRifleman')

	})
	it('Should handle teams', () => {
		let TempEvent = new RespawnEvent('gamy@local', 'NtfPrivate', 'FoundationForces')
		expect(TempEvent.getTeam()).toStrictEqual('FoundationForces')
		TempEvent.setTeam('ChaosInsurgency')
		expect(TempEvent.getTeam()).toStrictEqual('ChaosInsurgency')
	})
	it('Should fail', () => {
		expect(() => { Event.AddPlayer('gamy@local', 'ClassD') }).toThrow('This player already exists')
	})
	it('Should return if it has PlayerMap', () => {
		expect(Event.hasPlayerMap()).toBeTruthy()
	})
})

describe('Create ConnectionEvent', () => {
	let Con_Event: ConnectionEvent
	let Disc_Event: ConnectionEvent
	beforeEach(() => {
		Con_Event = new ConnectionEvent('gamy@local', 'Connected')
		Disc_Event = new ConnectionEvent('Evil@network', 'Disconnected')
	})
	it('Should return connection type', () => {
		expect(Con_Event.getConnectionType()).toStrictEqual('Connected')
		expect(Disc_Event.getConnectionType()).toStrictEqual('Disconnected')
	})
	it('Should return userID', () => {
		expect(Con_Event.getPlayerID()).toStrictEqual('gamy@local')
		expect(Disc_Event.getPlayerID()).toStrictEqual('Evil@network')
	})
	it('Should return playerRole', () => {
		expect(Con_Event.getPlayerRole()).toStrictEqual('None')
		Con_Event.setPlayerRole('ClassD')
		expect(Con_Event.getPlayerRole()).toStrictEqual('ClassD')
	})
	it('Should return PlayerMap', () => {
		expect(Con_Event.getPlayerMap()).toStrictEqual(new Map().set('gamy@local', 'None'))
	})
	it('Should fail', () => {
		let Test_Event = new ConnectionEvent(<any>undefined, <any>undefined)
		expect(() => { Test_Event.getPlayerID() }).toThrow('Something went wrong when getting PlayerID')
		Con_Event.setPlayerRole(<any>undefined)
		expect(() => { Con_Event.getPlayerRole() }).toThrow('Something went wrong when getting player role')
	})
	it('Should return if it has PlayerMap', () => {
		expect(Con_Event.hasPlayerMap()).toBeTruthy()
	})
})

describe('Create DoorEvent', () => {
	let Event: DoorEvent
	beforeEach(() => {
		Event = new DoorEvent('gamy@local', '914', 'opened')
	})
	it('Should return correct door states', () => {
		expect(Event.getEventType()).toStrictEqual(EventType.Specific.Door)
		expect(Event.getDoorName()).toStrictEqual('914')
		expect(Event.getDoorState()).toStrictEqual('opened')
		expect(Event.isDestroyed()).toBeFalsy()
	})
	it('Should fail', () => {
		expect(() => { Event.getDoorDestructionType() }).toThrow('destructionType is undefined')
		expect(() => { new DoorEvent('gamy@local', '914', 'closed', 'Grenade') }).toThrow('Unable to assign destructionType when doorState is closed [destroyed only]')

	})
	it('Should check door with destruction mode', () => {
		Event = new DoorEvent('gamy@local', '914', 'destroyed', 'Grenade')
		expect(Event.getDoorDestructionType()).toStrictEqual('Grenade')
	})
	it('Should return if it has PlayerMap', () => {
		expect(Event.hasPlayerMap()).toBeFalsy()
	})
})

describe('Create ThrowableEvent', () => {
	let ThrewEvent: ThrowableEvent
	let AffectedEvent: ThrowableEvent
	beforeEach(() => {
		ThrewEvent = new ThrowableEvent('gamy@local', 'threw', 'GrenadeFlash')
		AffectedEvent = new ThrowableEvent('gamy@local', 'using', 'GrenadeFlash', 'evil@network', 'deafened')
	})
	it('Should return correct data', () => {
		expect(ThrewEvent.getEventType()).toStrictEqual(EventType.Specific.Throwable)
		expect(ThrewEvent.getAction()).toStrictEqual('threw')
		expect(ThrewEvent.getItem()).toStrictEqual('GrenadeFlash')
		expect(ThrewEvent.getIssuerID()).toStrictEqual('gamy@local')
		expect(() => { ThrewEvent.getAffectedID() }).toThrow('AffectedID does not exists on non using action')
		expect(() => { ThrewEvent.getStatusEffect() }).toThrow('StatusEffect does not exists on non using action')

		expect(AffectedEvent.getEventType()).toStrictEqual(EventType.Specific.Throwable)
		expect(AffectedEvent.getAction()).toStrictEqual('using')
		expect(AffectedEvent.getItem()).toStrictEqual('GrenadeFlash')
		expect(AffectedEvent.getIssuerID()).toStrictEqual('gamy@local')
		expect(AffectedEvent.getAffectedID()).toStrictEqual('evil@network')
		expect(AffectedEvent.getStatusEffect()).toStrictEqual('deafened')
	})
	it('Should throw', () => {
		expect(() => { new ThrowableEvent('gamy@local', 'threw', 'GrenadeFlash', 'evil@network', undefined) }).toThrow('statusEffect is undefined')
		expect(() => { new ThrowableEvent('gamy@local', 'threw', 'GrenadeFlash', undefined, 'deafened') }).toThrow('AffectedID is undefined')
		expect(() => { new ThrowableEvent('gamy@local', 'threw', 'GrenadeFlash', 'evil@network', 'deafened') }).toThrow('AffectedID and statusEffect cannot exist in event that stores throwing item only')
	})
	it('Should return if it has PlayerMap', () => {
		expect(ThrewEvent.hasPlayerMap()).toBeFalsy()
	})
})

describe('Create WarheadEvent', () => {
	let WarheadStart: WarheadEvent
	let WarheadDetonated: WarheadEvent
	let WarheadSet: WarheadEvent
	beforeEach(() => {
		WarheadStart = new WarheadEvent('started')
		WarheadSet = new WarheadEvent('set', 'gamy@local', 'False')
		WarheadDetonated = new WarheadEvent('detonated')
	})
	it('Should return correct data', () => {
		expect(WarheadStart.getEventType()).toStrictEqual(EventType.Specific.Warhead)
		expect(WarheadStart.getWarheadType()).toStrictEqual('started')
		expect(WarheadStart.getIssuer()).toBeUndefined()
		expect(WarheadSet.getIssuer()).toStrictEqual('gamy@local')
		expect(WarheadSet.getState()).toStrictEqual('False')
	})
	it('Should add and read data', () => {
		expect(WarheadDetonated.getPlayerMap()).toStrictEqual(new Map())
		WarheadDetonated.AddKilledPlayer('evil@network')
		expect(WarheadDetonated.getPlayerMap()).toStrictEqual(new Map().set('evil@network', 'Spectator'))
	})
	it('Should add and read data [Add w/o checking]', () => {
		WarheadDetonated.AddKilledPlayer('evil@network')
		expect(WarheadDetonated.getPlayerMap()).toStrictEqual(new Map().set('evil@network', 'Spectator'))
	})
	it('Should set issuer', () => {
		expect(WarheadStart.getIssuer()).toBeUndefined()
		WarheadStart.setIssuer('gamy@local')
		expect(WarheadStart.getIssuer()).toStrictEqual('gamy@local')
	})
	it('Should fail', () => {
		expect(() => { new WarheadEvent('started', 'gamy@local', 'True') }).toThrow('Warhead needs to have "set" action in order to have warheadState')
		expect(() => { WarheadStart.AddKilledPlayer('evil@network') }).toThrow('Warhead must be detonated in order to assign killed players')
		expect(() => { WarheadStart.getPlayerMap() }).toThrow('Warhead must be detonated in order to get killed players')
		expect(() => { WarheadDetonated.getState() }).toThrow('Warhead must be set in order to have state')
		expect(() => { new WarheadEvent('set', 'gamy@local') }).toThrow('Unable to create set WarheadEvent when warheadState is undefined')
		const invalidEvent = new WarheadEvent('set', 'gamy@local', 'False')
		//@ts-expect-error
		invalidEvent.warhead_state = undefined
		expect(() => { invalidEvent.getState() }).toThrow('An error occured when getting warhead state')
	})
	it('Should return if it has PlayerMap', () => {
		expect(WarheadStart.hasPlayerMap()).toBeFalsy()
	})
	it('Should return if it has PlayerMap', () => {
		expect(WarheadDetonated.hasPlayerMap()).toBeTruthy()
	})
	it('Should return if it has PlayerMap', () => {
		expect(WarheadSet.hasPlayerMap()).toBeFalsy()
	})
})

describe('Create DecontaminationStartedEvent', () => {
	let Event = new DecontaminationStartedEvent()
	it('Has correct data', () => {
		expect(Event.getEventType()).toStrictEqual(EventType.Specific.DecontaminationStarted)
		expect(Event.hasPlayerMap()).toBeFalsy()
	})
})

describe('Create ForceClassEvent', () => {
	let Event = new ForceClassEvent('player1@steam', 'ClassD', 'player2@steam')
	it('Should contain correct event_type', () => {
		expect(Event.getEventType()).toStrictEqual(EventType.Specific.ForceClass)
	})
	it('Should return correct data', () => {
		expect(Event.hasPlayerMap()).toBeTruthy()
		expect(Event.getPlayerMap()).toStrictEqual(new Map().set('player1@steam', 'ClassD'))
		expect(Event.AddPlayer('Player3@steam', 'Scientist'))
		expect(Event.getPlayerMap()).toStrictEqual(new Map().set('player1@steam', 'ClassD').set('Player3@steam', 'Scientist'))
		expect(() => { Event.AddPlayer('player1@steam', 'Scientist') }).toThrow('This player already exists')
	})
})