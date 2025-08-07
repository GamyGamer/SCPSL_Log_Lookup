import { InternalRole, Role } from "./role";
import { Keyframe } from "./keyframe";
import { User } from "./user";


class Timeline {
	//Keyframe: Specific keyframe that we do care about
	//number: Amount of ignored lines, it should save space due to not needing to create so many objects
	private keyframe: Array<Keyframe | number>
	//to be moved to scprlparser
	state = {
		respawn_in_progress: false,
		multiline_message: false
	}
	constructor() {
		this.keyframe = new Array()
	}
	Clear() {
		this.keyframe = new Array();
		this.NewKeyFrame(null, 'round_start')
		this.state.multiline_message = false
		this.state.respawn_in_progress = false
	}
	/**
	 * Creates new keyframe, returns index of new keyframe
	 */
	NewKeyFrame(timestamp: string, event?: string): number {
		let current_keyframe = this.keyframe.push(new Keyframe(timestamp, event, event)) - 1;
		// this.keyframe[current_keyframe].timestamp = new Date(timestamp);
		// this.keyframe[current_keyframe].event = event;
		// this.keyframe[current_keyframe].player = new Object();
		return current_keyframe;
	}
	EditKeyFrameEvent(keyframe: number, event: string) {
		if (keyframe == undefined) {
			throw new Error("keyframe is undefined");
		}
		if (event == undefined) {
			throw new Error("event is undefined");
		}
		this.keyframe[keyframe].event = event
	}
	AddPlayer(keyframe: number, UserID: User['ID'], role: InternalRole) {
		if (keyframe == null) {
			throw new Error("keyframe is null")
		}
		if (keyframe < 0 || keyframe > this.keyframe.length - 1) {
			throw new Error(`keyframe array has size of ${this.keyframe.length}, accessing out of bounds`)
		}
		role = Role.TranslateToInternal(role)
		if (this.keyframe[keyframe].player[UserID] != undefined && this.keyframe[keyframe].player[UserID] != role) {
			if (role != 'Scp0492') { // Write as error
				console.warn(`Player ${UserID} at ${keyframe} was ${this.keyframe[keyframe].player[UserID]} and now is ${role}`)
			}
			else {
				console.log(`Player ${UserID} at ${keyframe} was ${this.keyframe[keyframe].player[UserID]} and now is ${role}`)
			}
		}
		this.keyframe[keyframe].player[UserID] = role
	}
	AddKiller(keyframe: number, userID: User['ID']) {
		if (keyframe == undefined) {
			throw new Error("keyframe is undefined")
		}
		if (keyframe < 0 || keyframe > this.keyframe.length - 1) {
			throw new Error(`keyframe array has size of ${this.keyframe.length}, accessing out of bounds`)
		}
		if (userID == undefined) {
			throw new Error("UserID is undefined")
		}
		this.keyframe[keyframe].killer = userID;
	}
	PlayerExist(UserID: string): boolean {
		for (let index = this.keyframe.length - 1; index >= 0; index--) {
			if (this.keyframe[index].player[UserID] != undefined) {
				return true
			}
		}
		return false;
	}
	FindNewestEventType(event: string): number {
		if (event == undefined) {
			throw new Error("event type is undefined")
		}
		for (let index = this.keyframe.length - 1; index >= 0; index--) {
			if (this.keyframe[index].event == event) {
				return index
			}
		}
		throw new Error(`Event ${event} does not exist`)
	}
	/**
	 * Method to find newest keyframe index, passing Role and keyframe narrows searching 
	 */
	FindNewestPlayer(UserID: User['ID'], role?: string, keyframe?: number): number {
		if (!this.PlayerExist(UserID)) {
			throw new Error(`Player ${UserID} Does not exists`)
		}
		let startfrom;
		if (keyframe == undefined) {
			startfrom = this.keyframe.length - 1;
		}
		else {
			startfrom = keyframe
		}

		if (role == undefined) {
			for (let index = startfrom; index >= 0; index--) {
				if (this.keyframe[index].player[UserID] != undefined) {
					return index
				}
			}
		}
		else {
			role = Role.TranslateToInternal(role)
			for (let index = startfrom; index >= 0; index--) {
				if (this.keyframe[index].player[UserID] == role) {
					return index
				}
			}
		}
		throw new Error(`Unable to find player ${UserID} with ${role} role`)

	}
	FindPlayerWithRole(role: string) {
		for (const [playerID, playerRole] of Object.entries(this.keyframe[0].player)) {
			if (playerRole == role) {
				return playerID;
			}
		}
		return null;
	}
	/**
	* W momencie otrzymania roli następuje wsteczna propagacja w osi czasu
	*/
	BackPropagatePlayerRole(UserID: string, Role: string) {
		if (!this.PlayerExist(UserID)) { // If player does not exist assume that's their first role (round start)
			this.AddPlayer(0, UserID, Role)
		}
		else {
			this.AddPlayer(this.FindNewestPlayer(UserID), UserID, Role)  //Złap zombiaka
		}
	}

}
export { Timeline }