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
		this.OutOfBoundsCheck(index)
		return this.proxyArray[index].GetData().getEventType()
	}
	FindNewestPlayer(UserID: User['ID']): ProxyIndex {
		if (!this.PlayerExist(UserID)) {
			throw new Error(`Player ${UserID} Does not exists`)
		}
		for (let index = this.proxyArray.length - 1; index >= 0; index--) {
			const element = this.proxyArray[index].GetData()
			if (element.hasPlayerMap()) {
				if (typeof element.getPlayerMap().get(UserID) != 'undefined') {
					return index
				}
			}
		}
		throw new Error(`Unable to find ${UserID}`);
	}
	PlayerExist(UserID: User['ID']): boolean {
		for (let index = 0; index < this.proxyArray.length; index++) {
			const element = this.proxyArray[index].GetData();
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
			throw new Error('Not implemented exception')
		}
		else {
			if (this.HasEventType(EventType.Specific.RoundStart)) {
				if (this.FindNewestPlayer(userID) < this.FindNewestEventType(EventType.Specific.RoundStart)) {
					this.AddPlayer(this.FindNewestEventType(EventType.Specific.RoundStart), userID, Role)
					return
				}
			}
			this.AddPlayer(this.FindNewestPlayer(userID), userID, Role)
			return
		}
	}
	AddPlayer(index: ProxyIndex, userID: User['ID'], role: InternalRole) {
		this.OutOfBoundsCheck(index)

		const keyframeData = this.proxyArray[index].GetData()

		if (!keyframeData.hasPlayerMap()) {
			throw new Error(`Keyframe as virtual index ${index} doesn't store playermap (${keyframeData.getEventType()})`);
		}

		if (keyframeData.getPlayerMap().get(userID) != role) {
			if (keyframeData.getPlayerMap().get(userID) != undefined) {
				switch (role) {
					case 'Scp0492':
						console.log(`Player ${userID} at ${index} was ${keyframeData.getPlayerMap().get(userID)} and now is ${role}`)
						break
					default:
						console.warn(`Player ${userID} at ${index} was ${keyframeData.getPlayerMap().get(userID)} and now is ${role}`)
						break;
				}
			}
			keyframeData.getPlayerMap().set(userID, role)
		}
	}
	FindNewestEventType(event: EventType.Specific): ProxyIndex {
		for (let index = this.proxyArray.length - 1; index >= 0; index--) {
			if (this.proxyArray[index].GetSpecificEventType() == event) {
				return index
			}
		}
		throw new Error(`Event ${event} does not exist`)
	}
	LastEvent(): Keyframe {
		return this.proxyArray[this.proxyArray.length - 1]
	}
	get proxyArray() {
		return this.getTruncatedKeyframeArray()
	}
	private OutOfBoundsCheck(index: ProxyIndex) {
		if (index < 0 || index > this.proxyArray.length - 1) {
			throw new Error(`keyframe array has size of ${this.proxyArray.length}, accessing out of bounds`)
		}
	}
	HasEventType(event: EventType.Specific): boolean {
		for (let index = this.proxyArray.length - 1; index >= 0; index--) {
			if (this.proxyArray[index].GetSpecificEventType() == event) {
				return true
			}
		}
		return false
	}
}
export { Timeline }