import { beforeEach, describe, expect, it } from '@jest/globals';
import { Timeline } from '../src/timeline';
import { Keyframe } from '../src/keyframe';
import { EventType } from '../src/gameevent';
import { ConnectionEvent } from '../src/keyframedata';

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
    timelime.addKeyframe(keyframe)
    timelime.addPadding()
    timelime.addPadding()
    timelime.addKeyframe(keyframe)

	expect(timelime.getTruncatedKeyframeArray().length).toStrictEqual(3)


    expect(()=>{timelime.getKeyframeSpecificType(3)}).toThrow(`Cannot read properties of undefined (reading 'GetData')`)
    expect(timelime.getKeyframeSpecificType(2)).toStrictEqual(EventType.Specific.Connection)

})