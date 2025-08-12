import { EventType } from "./gameevent";
import { Keyframe } from "./keyframe";
import { InternalRole } from "./role";
import { User } from "./user";

type KeyframeArray = Array<Keyframe | number>;
type ProxyIndex = number
type TrueIndex = number
type ProxyArray = Array<Keyframe>;

//Class representing one ROUND, it does not represent whole file (Since when SL stores multiple rounds in one file?)
class Timeline {
	//Keyframe: Specific keyframe that we do care about
	//number: Amount of ignored lines, it should save space due to not needing to create so many objects

	//All default operations works on a proxy array that ignores number, to get raw data you need to call getKeyframeArray
	private keyframe: KeyframeArray
	constructor() {
		this.keyframe = new Array();
	}
	getKeyframeArray(): KeyframeArray {
		return this.keyframe
	}
	addKeyframe(keyframe: Keyframe): TrueIndex {
		return this.keyframe.push(keyframe)
	}
	addPadding(): void {
		if (this.keyframe.length == 0) {
			this.keyframe[0] = 1;
		} else if (typeof this.keyframe[this.keyframe.length - 1] == 'number') {
			(<number>this.keyframe[this.keyframe.length - 1]) += 1
		}
		else {
			this.keyframe.push(1)
		}
	}
	getTruncatedKeyframeArray(): ProxyArray {
		const prepared: ProxyArray = new Array()
		for (let index = 0; index < this.keyframe.length; index++) {
			const element = this.keyframe[index]
			if (typeof element != 'number') {
				prepared.push(element)
			}
		}
		return prepared
	}
	getKeyframeSpecificType(index: ProxyIndex): EventType.Specific {
		return this.getTruncatedKeyframeArray()[index].GetData().getEventType()
	}
	FindNewestPlayer(UserID: User['ID']): ProxyIndex {
		if (!this.PlayerExist(UserID)) {
			throw new Error(`Player ${UserID} Does not exists`)
		}
		const proxyArray = this.getTruncatedKeyframeArray()
		for (let index = proxyArray.length - 1; index >= 0; index--) {
			const element = proxyArray[index].GetData()
			if (element.hasPlayerMap()) {
				if (typeof element.getPlayerMap().get(UserID) != 'undefined') {
					return index
				}
			}
		}
		throw new Error(`Unable to find ${UserID}`);
	}
	PlayerExist(UserID: User['ID']): boolean {
		const proxyArray = this.getTruncatedKeyframeArray()
		for (let index = 0; index < proxyArray.length; index++) {
			const element = proxyArray[index].GetData();
			if (element.hasPlayerMap()) {
				if (typeof element.getPlayerMap().get(UserID) != 'undefined') {
					return true;
				}
			}
		}
		return false
	}
	BackPropagatePlayerRole(userID: User['ID'], Role: InternalRole) {
		if (!this.PlayerExist(userID)) {

		}
		else {
			this.AddPlayer(this.FindNewestPlayer(userID), userID, Role)
		}
	}
	AddPlayer(index: ProxyIndex, userID: User['ID'], role: InternalRole) {
		const proxyArray = this.getTruncatedKeyframeArray()
		if (index < 0 || index > proxyArray.length - 1) {
			throw new Error(`keyframe array has size of ${proxyArray.length}, accessing out of bounds`)
		}
		const keyframeData = proxyArray[index].GetData()
		if (keyframeData.hasPlayerMap()) {
			switch (keyframeData.getPlayerMap().get(userID)) {
				case undefined:
					break;
				case 'Scp0492':
					console.log(`Player ${userID} at ${index} was ${keyframeData.getPlayerMap().get(userID)} and now is ${role}`)
					break
				default:
					console.warn(`Player ${userID} at ${index} was ${keyframeData.getPlayerMap().get(userID)} and now is ${role}`)
					break;
			}
			keyframeData.getPlayerMap().set(userID,role)
		}
		else {
			throw new Error(`Keyframe as virtual index ${index} doesn't store playermap (${keyframeData.getEventType()})`);
		}
	}
	FindNewestEventType(event: EventType.Specific): ProxyIndex {
		const proxyArray = this.getTruncatedKeyframeArray()
		for (let index = proxyArray.length - 1; index >= 0; index--) {
			if (proxyArray[index].GetSpecificEventType() == event) {
				return index
			}
		}
		throw new Error(`Event ${event} does not exist`)
	}

}
export { Timeline }