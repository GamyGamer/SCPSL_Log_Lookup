import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Timeline } from '../src/timeline';
import { Keyframe } from '../src/keyframe';
import { EventType } from '../src/gameevent';
import { ConnectionEvent, DeathEvent, DecontaminationStartedEvent, DoorEvent, RespawnEvent, RoundStartEvent, WarheadEvent, withPlayerMap } from '../src/keyframedata';

let timelime: Timeline

beforeEach(() => { // TODO: Make a sample timeline from some kind of roundlog
    timelime = new Timeline()
    for (let index = 0; index < 31; index++) {
        timelime.addPadding()
    }
})

it('Should append Keyframe to timeline', () => {
    let WarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => Promise.resolve())
    let LogSpy = jest.spyOn(console, 'log').mockImplementation(() => Promise.resolve())

    let keyframedata = new ConnectionEvent('gamy@local', 'Connected')
    expect(() => { timelime.BackPropagatePlayerRole('graczowy@remote', 'Filmmaker') }).toThrow('Unable to fallback because there are no events with PlayerMap')
    let keyframe = new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.ConnectionUpdate, EventType.Modules.Networking, keyframedata)
    timelime.addKeyframe(keyframe)
    timelime.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.ConnectionUpdate, EventType.Modules.Networking, new ConnectionEvent('evil@network', 'Connected')))
    timelime.addPadding()
    timelime.addPadding()
    timelime.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.KillLog, EventType.Modules.ClassChange, new DeathEvent('gamy@local', 'Spectator', 'killed', 'evil@network', 'Scp049')))

    expect(timelime.proxyArray.length).toStrictEqual(3)

    expect(() => { timelime.getKeyframeSpecificType(3) }).toThrow(`keyframe array has size of 3, accessing out of bounds`)
    expect(timelime.getKeyframeSpecificType(0)).toStrictEqual(EventType.Specific.Connection)
    expect(timelime.getKeyframeSpecificType(1)).toStrictEqual(EventType.Specific.Connection)
    expect(timelime.getKeyframeSpecificType(2)).toStrictEqual(EventType.Specific.Death)
    expect(timelime.FindNewestPlayer('evil@network')).toStrictEqual(1)
    timelime.BackPropagatePlayerRole('gamy@local', 'ClassD')
    expect(WarnSpy).toHaveBeenLastCalledWith('Player gamy@local at 2 was Spectator and now is ClassD')
    expect((<withPlayerMap>timelime.proxyArray[timelime.FindNewestEventType(EventType.Specific.Death)].GetData()).getPlayerMap().get('gamy@local')).toStrictEqual('ClassD')

    timelime.BackPropagatePlayerRole('gamy@local', 'Spectator')
    expect(WarnSpy).toHaveBeenLastCalledWith('Player gamy@local at 2 was ClassD and now is Spectator')


    expect(timelime.FindNewestEventType(EventType.Specific.Death)).toStrictEqual(2)
    expect((<withPlayerMap>timelime.proxyArray[timelime.FindNewestEventType(EventType.Specific.Death)].GetData()).getPlayerMap().get('gamy@local')).toStrictEqual('Spectator')
    timelime.BackPropagatePlayerRole('gamy@local', 'Scp0492')
    expect(LogSpy).toHaveBeenLastCalledWith('Player gamy@local at 2 was Spectator and now is Scp0492')

    expect((<withPlayerMap>timelime.proxyArray[timelime.FindNewestEventType(EventType.Specific.Death)].GetData()).getPlayerMap().get('gamy@local')).toStrictEqual('Scp0492')
    expect(timelime.LastEvent().GetData().getEventType()).toStrictEqual(EventType.Specific.Death)
    expect(timelime.LastEvent().GetModule()).toStrictEqual(EventType.Modules.ClassChange)
    // Verify that original keyframe still has padding
    expect(timelime.getKeyframeArray()[3]).toStrictEqual(2)
    expect(() => { timelime.FindNewestPlayer('gamy@remote') }).toThrow('Player gamy@remote Does not exists')

    timelime.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.GameEvent, EventType.Modules.GameLogic, new DecontaminationStartedEvent()))
    timelime.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.GameEvent, EventType.Modules.ClassChange, new RespawnEvent('1337@steam', 'NtfCaptain')))
    expect(timelime.FindNewestPlayer('1337@steam')).toStrictEqual(4)
    expect(timelime.FindNewestPlayer('gamy@local')).toStrictEqual(2)
    expect(timelime.HasEventType(EventType.Specific.Death)).toBeTruthy()
    expect(timelime.HasEventType(EventType.Specific.Suicide)).toBeFalsy()

    {
        let PlayerMapOnly = timelime.getKeyframeArrayWithPlayerMap()
        for (let index = 0; index < PlayerMapOnly.length; index++) {
            const element = PlayerMapOnly[index];
            expect(element.GetData().hasPlayerMap()).toBeTruthy()
        }
    }

    expect(() => { timelime.FindNewestEventType(EventType.Specific.Warhead) }).toThrow('Event warhead does not exist')
    timelime.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.GameEvent, EventType.Modules.Warhead, new WarheadEvent('detonated')))
    expect(() => { timelime.FindNewestEventType(EventType.Specific.Warhead) }).not.toThrow('Event warhead does not exist')
    timelime.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.GameEvent, EventType.Modules.Door, new DoorEvent('gamy@local', '914', 'opened')))
    expect(() => { timelime.AddPlayer(timelime.FindNewestEventType(EventType.Specific.Door), 'gamy@remote', 'ClassD') }).toThrow(`Keyframe as virtual index 6 doesn't store playermap (door)`)

    timelime.AddPlayer(5, 'gamy@local', 'Spectator')
    {
        let data = timelime.proxyArray[5].GetData()
        if (data.hasPlayerMap()) {
            expect(data.getPlayerMap()).toStrictEqual(new Map().set('gamy@local', 'Spectator'))
        }
        else {
            expect('oops').toStrictEqual('somehow playermap does not exists')
        }
    }
    timelime.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.GameEvent, EventType.Modules.GameLogic, new RoundStartEvent()))
    timelime.BackPropagatePlayerRole('gamy@local', 'Scientist')
    expect((<withPlayerMap>timelime.proxyArray[timelime.FindNewestPlayer('gamy@local')].GetData()).getPlayerMap()).toStrictEqual(new Map().set('gamy@local', 'Scientist'))
    timelime.BackPropagatePlayerRole('gamy@local', 'ClassD')
    expect((<withPlayerMap>timelime.proxyArray[timelime.FindNewestPlayer('gamy@local')].GetData()).getPlayerMap()).toStrictEqual(new Map().set('gamy@local', 'ClassD'))
    timelime.BackPropagatePlayerRole('graczowy@remote', 'Filmmaker')
    expect(WarnSpy).toHaveBeenLastCalledWith('Player graczowy@remote does not exist, fallbacking to newest event with PlayerMap')
    expect((<withPlayerMap>timelime.getKeyframeArrayWithPlayerMap()[timelime.getKeyframeArrayWithPlayerMap().length - 1].GetData()).getPlayerMap()).toStrictEqual(new Map().set('graczowy@remote', 'Filmmaker').set('gamy@local', 'ClassD'))
    {
        let filtered_data = timelime.getFilteredKeyframes('ServerLogType', EventType.ServerLogType.GameEvent)
        expect(filtered_data.length).toStrictEqual(5)
        expect(filtered_data[0].GetData().getEventType()).toStrictEqual(EventType.Specific.DecontaminationStarted)
        expect(filtered_data[1].GetData().getEventType()).toStrictEqual(EventType.Specific.Respawn)
        expect(filtered_data[2].GetData().getEventType()).toStrictEqual(EventType.Specific.Warhead)
        expect(filtered_data[3].GetData().getEventType()).toStrictEqual(EventType.Specific.Door)
        expect(filtered_data[4].GetData().getEventType()).toStrictEqual(EventType.Specific.RoundStart)

        filtered_data = timelime.getFilteredKeyframes('Module', EventType.Modules.GameLogic)
        expect(filtered_data.length).toStrictEqual(2)
        expect(filtered_data[0].GetData().getEventType()).toStrictEqual(EventType.Specific.DecontaminationStarted)
        expect(filtered_data[1].GetData().getEventType()).toStrictEqual(EventType.Specific.RoundStart)

        filtered_data = timelime.getFilteredKeyframes('Specific', EventType.Specific.Respawn)
        expect(filtered_data.length).toStrictEqual(1)
        expect(filtered_data[0].GetData().getEventType()).toStrictEqual(EventType.Specific.Respawn)

        //@ts-expect-error
        expect(() => {timelime.getFilteredKeyframes('Invalid :)',EventType.Modules.Administrative)}).toThrow('Invalid Filter by option: Invalid :)')
    }
})