import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Timeline } from '../src/timeline';
import { Keyframe } from '../src/keyframe';
import { EventType } from '../src/gameevent';
import { ConnectionEvent, DeathEvent, DecontaminationStartedEvent, DoorEvent, RespawnEvent, RoundStartEvent, WarheadEvent, withPlayerMap } from '../src/keyframedata';

let timeline: Timeline

beforeEach(() => { // TODO: Make a sample timeline from some kind of roundlog
    timeline = new Timeline()
    for (let index = 0; index < 31; index++) {
        timeline.addPadding()
    }
})

it('Should append Keyframe to timeline', () => {
    let WarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => Promise.resolve())
    let LogSpy = jest.spyOn(console, 'log').mockImplementation(() => Promise.resolve())

    let keyframedata = new ConnectionEvent('gamy@local', 'Connected')
    expect(() => { timeline.BackPropagatePlayerRole('graczowy@remote', 'Filmmaker') }).toThrow('Unable to fallback because there are no events with PlayerMap')
    let keyframe = new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.ConnectionUpdate, EventType.Modules.Networking, keyframedata)
    timeline.addKeyframe(keyframe)
    timeline.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.ConnectionUpdate, EventType.Modules.Networking, new ConnectionEvent('evil@network', 'Connected')))
    timeline.addPadding()
    timeline.addPadding()
    timeline.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.KillLog, EventType.Modules.ClassChange, new DeathEvent('gamy@local', 'Spectator', 'killed', 'evil@network', 'Scp049')))
    timeline.AddPlayer(timeline.FindNewestEventType(EventType.Specific.Death), 'gamy@local', 'Spectator')

    expect(timeline.proxyArray.length).toStrictEqual(3)

    expect(() => { timeline.getKeyframeSpecificType(3) }).toThrow(`keyframe array has size of 3, accessing out of bounds`)
    expect(timeline.getKeyframeSpecificType(0)).toStrictEqual(EventType.Specific.Connection)
    expect(timeline.getKeyframeSpecificType(1)).toStrictEqual(EventType.Specific.Connection)
    expect(timeline.getKeyframeSpecificType(2)).toStrictEqual(EventType.Specific.Death)
    expect(timeline.FindNewestPlayer('evil@network')).toStrictEqual(1)
    timeline.BackPropagatePlayerRole('gamy@local', 'ClassD')
    expect(WarnSpy).toHaveBeenLastCalledWith('Player gamy@local at 2 was Spectator and now is ClassD')
    expect((<withPlayerMap>timeline.proxyArray[timeline.FindNewestEventType(EventType.Specific.Death)].GetData()).getPlayerMap().get('gamy@local')).toStrictEqual('ClassD')

    timeline.BackPropagatePlayerRole('gamy@local', 'Spectator')
    expect(WarnSpy).toHaveBeenLastCalledWith('Player gamy@local at 2 was ClassD and now is Spectator')


    expect(timeline.FindNewestEventType(EventType.Specific.Death)).toStrictEqual(2)
    expect((<withPlayerMap>timeline.proxyArray[timeline.FindNewestEventType(EventType.Specific.Death)].GetData()).getPlayerMap().get('gamy@local')).toStrictEqual('Spectator')
    timeline.BackPropagatePlayerRole('gamy@local', 'Scp0492')
    expect(LogSpy).toHaveBeenLastCalledWith('Player gamy@local at 2 was Spectator and now is Scp0492')

    expect((<withPlayerMap>timeline.proxyArray[timeline.FindNewestEventType(EventType.Specific.Death)].GetData()).getPlayerMap().get('gamy@local')).toStrictEqual('Scp0492')
    expect(timeline.LastEvent().GetData().getEventType()).toStrictEqual(EventType.Specific.Death)
    expect(timeline.LastEvent().GetModule()).toStrictEqual(EventType.Modules.ClassChange)
    // Verify that original keyframe still has padding
    expect(timeline.getKeyframeArray()[3]).toStrictEqual(2)
    expect(() => { timeline.FindNewestPlayer('gamy@remote') }).toThrow('Player gamy@remote Does not exists')

    timeline.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.GameEvent, EventType.Modules.GameLogic, new DecontaminationStartedEvent()))
    timeline.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.GameEvent, EventType.Modules.ClassChange, new RespawnEvent('1337@steam', 'NtfCaptain')))
    expect(timeline.FindNewestPlayer('1337@steam')).toStrictEqual(4)
    expect(timeline.FindNewestPlayer('gamy@local')).toStrictEqual(2)
    expect(timeline.HasEventType(EventType.Specific.Death)).toBeTruthy()
    expect(timeline.HasEventType(EventType.Specific.Suicide)).toBeFalsy()

    {
        let PlayerMapOnly = timeline.getKeyframeArrayWithPlayerMap()
        for (let index = 0; index < PlayerMapOnly.length; index++) {
            const element = PlayerMapOnly[index];
            expect(element.GetData().hasPlayerMap()).toBeTruthy()
        }
    }

    expect(() => { timeline.FindNewestEventType(EventType.Specific.Warhead) }).toThrow('Event warhead does not exist')
    timeline.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.GameEvent, EventType.Modules.Warhead, new WarheadEvent('detonated')))
    expect(() => { timeline.FindNewestEventType(EventType.Specific.Warhead) }).not.toThrow('Event warhead does not exist')
    timeline.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.GameEvent, EventType.Modules.Door, new DoorEvent('gamy@local', '914', 'opened')))
    expect(() => { timeline.AddPlayer(timeline.FindNewestEventType(EventType.Specific.Door), 'gamy@remote', 'ClassD') }).toThrow(`Keyframe as virtual index 6 doesn't store playermap (door)`)

    timeline.AddPlayer(5, 'gamy@local', 'Spectator')
    {
        let data = timeline.proxyArray[5].GetData()
        if (data.hasPlayerMap()) {
            expect(data.getPlayerMap()).toStrictEqual(new Map().set('gamy@local', 'Spectator'))
        }
        else {
            expect('oops').toStrictEqual('somehow playermap does not exists')
        }
    }
    timeline.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.GameEvent, EventType.Modules.GameLogic, new RoundStartEvent()))
    timeline.BackPropagatePlayerRole('gamy@local', 'Scientist')
    expect((<withPlayerMap>timeline.proxyArray[timeline.FindNewestPlayer('gamy@local')].GetData()).getPlayerMap()).toStrictEqual(new Map().set('gamy@local', 'Scientist'))
    timeline.BackPropagatePlayerRole('gamy@local', 'ClassD')
    expect((<withPlayerMap>timeline.proxyArray[timeline.FindNewestPlayer('gamy@local')].GetData()).getPlayerMap()).toStrictEqual(new Map().set('gamy@local', 'ClassD'))
    timeline.BackPropagatePlayerRole('graczowy@remote', 'Filmmaker')
    expect(WarnSpy).toHaveBeenLastCalledWith('Player graczowy@remote does not exist, fallbacking to newest event with PlayerMap')
    expect((<withPlayerMap>timeline.getKeyframeArrayWithPlayerMap()[timeline.getKeyframeArrayWithPlayerMap().length - 1].GetData()).getPlayerMap()).toStrictEqual(new Map().set('graczowy@remote', 'Filmmaker').set('gamy@local', 'ClassD'))
    {
        let filtered_data = timeline.getFilteredKeyframes('ServerLogType', EventType.ServerLogType.GameEvent)
        expect(filtered_data.length).toStrictEqual(5)
        expect(filtered_data[0].GetData().getEventType()).toStrictEqual(EventType.Specific.DecontaminationStarted)
        expect(filtered_data[1].GetData().getEventType()).toStrictEqual(EventType.Specific.Respawn)
        expect(filtered_data[2].GetData().getEventType()).toStrictEqual(EventType.Specific.Warhead)
        expect(filtered_data[3].GetData().getEventType()).toStrictEqual(EventType.Specific.Door)
        expect(filtered_data[4].GetData().getEventType()).toStrictEqual(EventType.Specific.RoundStart)

        filtered_data = timeline.getFilteredKeyframes('Module', EventType.Modules.GameLogic)
        expect(filtered_data.length).toStrictEqual(2)
        expect(filtered_data[0].GetData().getEventType()).toStrictEqual(EventType.Specific.DecontaminationStarted)
        expect(filtered_data[1].GetData().getEventType()).toStrictEqual(EventType.Specific.RoundStart)

        filtered_data = timeline.getFilteredKeyframes('Specific', EventType.Specific.Respawn)
        expect(filtered_data.length).toStrictEqual(1)
        expect(filtered_data[0].GetData().getEventType()).toStrictEqual(EventType.Specific.Respawn)

        //@ts-expect-error
        expect(() => { timeline.getFilteredKeyframes('Invalid :)', EventType.Modules.Administrative) }).toThrow('Invalid Filter by option: Invalid :)')
    }
})