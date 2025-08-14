import { beforeEach, describe, expect, it } from '@jest/globals';
import { Timeline } from '../src/timeline';
import { Keyframe } from '../src/keyframe';
import { EventType } from '../src/gameevent';
import { ConnectionEvent, DeathEvent } from '../src/keyframedata';

let timelime: Timeline

beforeEach(() => { // TODO: Make a sample timeline from some kind of roundlog
    timelime = new Timeline()
    for (let index = 0; index < 31; index++) {
        timelime.addPadding()
    }
})

it('Should append Keyframe to timeline', () => {
    let keyframedata = new ConnectionEvent('gamy@local', 'Connected')
    let keyframe = new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.ConnectionUpdate, EventType.Modules.Networking, keyframedata)
    timelime.addKeyframe(keyframe)
    timelime.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.ConnectionUpdate, EventType.Modules.Networking, new ConnectionEvent('evil@network', 'Connected')))
    timelime.addPadding()
    timelime.addPadding()
    timelime.addKeyframe(new Keyframe('2025-08-07 17:33:18.028 +02:00', EventType.ServerLogType.ConnectionUpdate, EventType.Modules.Networking, new DeathEvent('gamy@local', 'Spectator', 'killed', 'evil@network', 'Scp049')))

    expect(timelime.proxyArray.length).toStrictEqual(3)

    expect(() => { timelime.getKeyframeSpecificType(3) }).toThrow(`keyframe array has size of 3, accessing out of bounds`)
    expect(timelime.getKeyframeSpecificType(0)).toStrictEqual(EventType.Specific.Connection)
    expect(timelime.getKeyframeSpecificType(1)).toStrictEqual(EventType.Specific.Connection)
    expect(timelime.getKeyframeSpecificType(2)).toStrictEqual(EventType.Specific.Death)
    expect(timelime.FindNewestPlayer('evil@network')).toStrictEqual(1)
    timelime.BackPropagatePlayerRole('gamy@local', 'ClassD')
    //@ts-ignore
    expect(timelime.proxyArray[timelime.FindNewestEventType(EventType.Specific.Death)].GetData().getPlayerMap().get('gamy@local')).toStrictEqual('ClassD')

    timelime.BackPropagatePlayerRole('gamy@local', 'Spectator')

    expect(timelime.FindNewestEventType(EventType.Specific.Death)).toStrictEqual(2)
    //@ts-ignore
    expect(timelime.proxyArray[timelime.FindNewestEventType(EventType.Specific.Death)].GetData().getPlayerMap().get('gamy@local')).toStrictEqual('Spectator')
    timelime.BackPropagatePlayerRole('gamy@local', 'Scp0492')
    //@ts-ignore

    expect(timelime.proxyArray[timelime.FindNewestEventType(EventType.Specific.Death)].GetData().getPlayerMap().get('gamy@local')).toStrictEqual('Scp0492')



})