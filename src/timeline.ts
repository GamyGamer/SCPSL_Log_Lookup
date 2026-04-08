import { EventType } from "./gameevent";
import { Keyframe } from "./keyframe";
import { KeyframeData, withPlayerMap } from "./keyframedata";
import { InternalRole } from "./role";
import { User } from "./user";


/**
 * `KeyframeArray` stores information about specific keyframes and number (padding) of ignored lines from original file.
 * Ignored lines exists due to some information being irrelevant to the round processing (Or not being implemented yet)
 */
type KeyframeArray = Array<Keyframe | number>;
/**
 * `ProxyIndex` represents index of `ProxyArray`
 */
type ProxyIndex = number
/**
 * `TrueIndex` represents index of `KeyframeArray`
 */
type TrueIndex = number
/**
 * Same as `KeyframeArray`, but padding data is removed
 */
type ProxyArray = Array<Keyframe>;

/**
 * Class representing one ROUND, it does not represent whole file (Since when SL stores multiple rounds in one file?)
 */
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
	getKeyframeArrayWithPlayerMap(): Array<Keyframe> {
		const prepared: Array<Keyframe> = new Array()
		for (let index = 0; index < this.proxyArray.length; index++) {
			const element = this.proxyArray[index]
			if (element.GetData().hasPlayerMap()) {
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
		throw new Error(`Unable to find ${UserID}. This line in theory should not fire so if you get this error something is very wrong, please report.`);
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
			console.warn(`Player ${userID} does not exist, fallbacking to newest event with PlayerMap`)
			let withPlayerMap = this.getKeyframeArrayWithPlayerMap();
			if (withPlayerMap.length == 0) {
				throw new Error("Unable to fallback because there are no events with PlayerMap");
			}
			(<withPlayerMap>withPlayerMap[withPlayerMap.length - 1].GetData()).getPlayerMap().set(userID, Role)
		}
		else {
			if (this.HasEventType(EventType.Specific.RoundStart)) {
				//Player had role changed before round started, quite possibly due to forceclass event before game start
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
	getFilteredKeyframes(FilterBy: 'ServerLogType' | 'Module' | 'Specific', Scope: EventType.Modules | EventType.ServerLogType | EventType.Specific): Array<Keyframe> {
		let proxyArray = this.proxyArray // cache
		let prepared = new Array()
		for (let index = 0; index < proxyArray.length; index++) {
			const element = proxyArray[index];
			switch (FilterBy) {
				case 'ServerLogType':
					if (element.GetServerLogType() == Scope) {
						prepared.push(element)
					}
					break;
				case "Module":
					if (element.GetModule() == Scope) {
						prepared.push(element)
					}
					break
				case "Specific":
					if (element.GetSpecificEventType() == Scope) {
						prepared.push(element)
					}
					break
				default:
					throw new Error(`Invalid Filter by option: ${FilterBy}`);
			}

		}
		return prepared
	}
}
export { Timeline }