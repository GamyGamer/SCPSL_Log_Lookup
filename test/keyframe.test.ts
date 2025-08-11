import { beforeEach, describe, expect, it } from '@jest/globals';
import { Keyframe } from '../src/keyframe';
import { EventType } from '../src/gameevent';
import { DeathEvent, KeyframeData, RoundStartEvent } from '../src/keyframedata';


describe('Create simple keyframe', () => {
	let StartKeyframeData: KeyframeData
	let StartKeyframeFirst: Keyframe
	beforeEach(() => {
		StartKeyframeData = new RoundStartEvent()
		StartKeyframeFirst = new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.InternalMessage, EventType.Modules.GameLogic, StartKeyframeData)
		StartKeyframeFirst = new Keyframe(new Date('2025-08-07 17:33:18.028 +02:00'), EventType.ServerLogType.InternalMessage, EventType.Modules.GameLogic, StartKeyframeData)
	})
	it('Should return correct data', () => {
		expect(StartKeyframeFirst.GetTimestamp()).toStrictEqual(new Date('2025-08-07 17:33:18.028 +02:00'))
		StartKeyframeFirst.SetTimestamp(new Date('2025-08-07 17:33:18.028 +05:00'))
		expect(StartKeyframeFirst.GetTimestamp()).toStrictEqual(new Date('2025-08-07 17:33:18.028 +05:00'))
		expect(StartKeyframeFirst.GetData().getEventType()).toStrictEqual(EventType.Specific.RoundStart)
		expect(StartKeyframeFirst.GetModule()).toStrictEqual(EventType.Modules.GameLogic)
		expect(StartKeyframeFirst.GetServerLogType()).toStrictEqual(EventType.ServerLogType.InternalMessage)
		StartKeyframeFirst.SetModule(EventType.Modules.Administrative)
		StartKeyframeFirst.SetServerLogType(EventType.ServerLogType.AdminChat)
		expect(StartKeyframeFirst.GetModule()).toStrictEqual(EventType.Modules.Administrative)
		expect(StartKeyframeFirst.GetServerLogType()).toStrictEqual(EventType.ServerLogType.AdminChat)
		StartKeyframeFirst.SetData(new DeathEvent('gamy@local', 'Spectator', 'killed', 'evil@network', 'NtfSergeant'))
		expect(StartKeyframeFirst.GetData().getEventType()).toStrictEqual(EventType.Specific.Death)
		const DeathKeyframe = new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.InternalMessage, EventType.Modules.GameLogic, new DeathEvent('gamy@local', 'Spectator', 'killed', 'evil@network', 'NtfSergeant'))
		expect(DeathKeyframe.GetData().getEventType()).toStrictEqual(EventType.Specific.Death)
		expect((<DeathEvent>DeathKeyframe.GetData()).getPlayerMap()).toStrictEqual(new Map().set('gamy@local', 'Spectator'))
	})
	it('Should fail', () => {
		expect(() => { new Keyframe('funnydate', EventType.ServerLogType.InternalMessage, EventType.Modules.GameLogic, StartKeyframeData) }).toThrow('Provided date is invalid: funnydate')
		expect(() => { StartKeyframeFirst.SetTimestamp('funnydate') }).toThrow('Provided date is invalid: funnydate')
		expect(() => { StartKeyframeFirst.SetTimestamp(new Date('funnydate')) }).toThrow('Provided date is invalid: Invalid Date')

	})
})
