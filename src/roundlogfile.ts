// //This class will be used to parse specific file, will store state handlers that currently are just a function
/*
Reading strategy
Load file
Parse line by line, keep count of active players
When amount of connected players drop to 0 check if round have started, if not then completly drop timeline
when round has started introduce a 'lock' that prevents timeline from being dropped
when round has ended and connected players drop to 0 save timeline as finished
*/

import { SLRegExp } from "./regex_rules";
import { Timeline } from "./timeline";
import { EventType } from "./gameevent";
import { User, UserList } from "./user";
import { ConnectionEvent, DeathEvent, DeathType, DoorEvent, DoorState, ForceClassEvent, RespawnEvent, RoundFinishEvent, RoundStartEvent } from "./keyframedata";
import { Keyframe } from "./keyframe";
import { Role } from "./role";

class RoundLogFile {
	timelineArray: Array<Timeline>
	state = {
		roundNum: 0,
		connectedPlayers: 0,
		multilineMessage: false,
		roundInProgress: false,
		fileTerminated: false,
		respawnInProgress: false
	}
	constructor() {
		this.timelineArray = new Array()
	}
	consumeLine(log_line: string, UserListRef: UserList) {
		const parsed_line = <SLRegExp>SLRegExp.SplitLogs.exec(log_line)
		if (this.state.fileTerminated) {
			throw new Error("Tried reading file when it was already declared to be terminated");
		}
		if (log_line == "") {
			if (!this.state.multilineMessage) {
				this.state.fileTerminated = true
				return
			}
			throw new Error("Multiline message is not implemented");
		}

		if (parsed_line == null || parsed_line.groups.Timestamp == undefined || parsed_line.groups.Type == undefined || parsed_line.groups.Module == undefined || parsed_line.groups.Message == undefined) {
			throw new Error(`An error occured when parsing line: ${log_line}`);
		}

		if (this.state.connectedPlayers == 0) {
			if (this.currentTimeline?.HasEventType(EventType.Specific.Connection)) {
				if (!this.state.roundInProgress) {
					if (this.currentTimeline.HasEventType(EventType.Specific.RoundStart)) {
						this.state.roundNum++
						console.debug(`New round have started`)
					}
					else {
						console.debug(`Everyone disconnected before round would commence`)
					}
				}
			}
		}

		if (this.timelineArray[this.state.roundNum] == undefined) { // Create timeline if doesn't exist
			this.timelineArray[this.state.roundNum] = new Timeline()
		}


		switch (parsed_line.groups.Module) {
			case EventType.Modules.Networking:
				this.NetworkingHandle(UserListRef, parsed_line)
				break;
			case EventType.Modules.Door:
				this.DoorHandle(parsed_line)
				break;
			case EventType.Modules.ClassChange:
				this.ClassChangeHandle(parsed_line)
				break
			case EventType.Modules.GameLogic:
				this.GameLogicHandle(parsed_line)
				break
			case EventType.Modules.Permissions:
				this.PermissionHandle(UserListRef, parsed_line)
				break
			default:
				this.currentTimeline.addPadding()
				console.warn(`Module ${parsed_line.groups.Module} not implemented: ${parsed_line.groups.Message}`)
				break;
		}



		// console.log(parsed_line.groups.Message)
	}
	private PermissionHandle(UserListRef: UserList, ParsedLine: SLRegExp) {
		let parsed_message = <SLRegExp | null>SLRegExp.Permissions.AssignedGroup.exec(ParsedLine.groups.Message)
		if (parsed_message) {
			if (UserListRef.UserExist(parsed_message.groups.UserID)) {
				UserListRef.GetUser(parsed_message.groups.UserID).AddGroup(parsed_message.groups.PermissionGroup)
			}
			else {
				const user = new User(parsed_message.groups.UserID,parsed_message.groups.UserName,undefined,parsed_message.groups.PermissionGroup)
				UserListRef.AddUser(user)
			}
			this.currentTimeline.addPadding()
			return
		}
		throw new Error(`Unable to parse Permission event: ${ParsedLine.groups.Message}`);
	}
	private GameLogicHandle(ParsedLine: SLRegExp) {
		let parsed_message = <SLRegExp | null>SLRegExp.Logger.RoundStart.exec(ParsedLine.groups.Message)
		if (parsed_message) {
			const keyframedata = new RoundStartEvent()
			const keyframe = new Keyframe(ParsedLine.groups.Timestamp, EventType.ServerLogType.GameEvent, EventType.Modules.GameLogic, keyframedata)
			this.currentTimeline.addKeyframe(keyframe)
			this.state.roundInProgress = true;
			return
		}
		parsed_message = <SLRegExp | null>SLRegExp.Logger.RoundFinish.exec(ParsedLine.groups.Message)
		if (parsed_message) {
			const keyframedata = new RoundFinishEvent()
			const keyframe = new Keyframe(ParsedLine.groups.Timestamp, EventType.ServerLogType.GameEvent, EventType.Modules.GameLogic, keyframedata)
			this.currentTimeline.addKeyframe(keyframe)
			this.state.roundInProgress = false;
			return
		}
		if (SLRegExp.Logger.DecontaminationStarted.test(ParsedLine.groups.Message)) {
			const keyframedata = new RoundFinishEvent()
			const keyframe = new Keyframe(ParsedLine.groups.Timestamp, EventType.ServerLogType.GameEvent, EventType.Modules.GameLogic, keyframedata)
			this.currentTimeline.addKeyframe(keyframe)
			return
		}
		if (SLRegExp.Logger.Ignore.test(ParsedLine.groups.Message)) {
			this.currentTimeline.addPadding()
			return
		}
		console.error(`Unable to parse Game logic Event: ${ParsedLine.groups.Message}`);

	}
	private ClassChangeHandle(ParsedLine: SLRegExp) {
		let parsed_message = <SLRegExp | null>SLRegExp.ClassChange.Death.exec(ParsedLine.groups.Message)
		if (parsed_message) { // Someone died
			this.currentTimeline.BackPropagatePlayerRole(parsed_message.groups.UserID, Role.TranslateToInternal(parsed_message.groups.UserRole))

			const IssuerRole = parsed_message.groups.IssuerRole ? Role.TranslateToInternal(parsed_message.groups.IssuerRole) : undefined
			if (IssuerRole) {
				this.currentTimeline.BackPropagatePlayerRole(parsed_message.groups.IssuerID, IssuerRole)
			}

			const keyframedata = new DeathEvent(parsed_message.groups.UserID, "Spectator", <DeathType>parsed_message.groups.Classifier, parsed_message.groups.IssuerID, IssuerRole)
			const keyframe = new Keyframe(ParsedLine.groups.Timestamp, <EventType.ServerLogType>ParsedLine.groups.Type, EventType.Modules.ClassChange, keyframedata)
			this.currentTimeline.addKeyframe(keyframe)
			return
		}
		parsed_message = <SLRegExp | null>SLRegExp.ClassChange.RespawnAs.exec(ParsedLine.groups.Message)
		if (parsed_message) { // SpawnWave in progress
			if (!this.state.respawnInProgress) {
				const keyframedata = new RespawnEvent(parsed_message.groups.UserID, Role.TranslateToInternal(parsed_message.groups.Role))
				const keyframe = new Keyframe(ParsedLine.groups.Timestamp, EventType.ServerLogType.GameEvent, EventType.Modules.ClassChange, keyframedata)
				this.currentTimeline.addKeyframe(keyframe)
				this.state.respawnInProgress = true
				return
			}
			this.currentTimeline.AddPlayer(this.currentTimeline.FindNewestEventType(EventType.Specific.Respawn), parsed_message.groups.UserID, Role.TranslateToInternal(parsed_message.groups.Role))
			return
		}
		parsed_message = <SLRegExp | null>SLRegExp.ClassChange.RespawnManager.exec(ParsedLine.groups.Message)
		if (parsed_message) { // SpawnWave finished
			let RespawnEvent = this.currentTimeline.LastEvent()
			if (!(RespawnEvent.GetData().getEventType() == EventType.Specific.Respawn)) {
				console.warn(`Last event was NOT RespawnEvent, correcting...`)
				RespawnEvent = this.currentTimeline.proxyArray[this.currentTimeline.FindNewestEventType(EventType.Specific.Respawn)]
			}
			RespawnEvent.SetTimestamp(ParsedLine.groups.Timestamp);
			(<RespawnEvent>RespawnEvent.GetData()).setTeam(<"FoundationForces" | "ChaosInsurgency">parsed_message.groups.Team)
			this.state.respawnInProgress = false
			this.currentTimeline.addPadding()
			return
		}
		if (SLRegExp.ClassChange.Ignore.test(ParsedLine.groups.Message)) { // IgnoreMessages
			this.currentTimeline.addPadding()
			return
		}
		parsed_message = <SLRegExp | null>SLRegExp.ClassChange.ForceClass.exec(ParsedLine.groups.Message)
		if (parsed_message) {
			const keyframeData = new ForceClassEvent(parsed_message.groups.UserID, Role.TranslateToInternal(parsed_message.groups.Role), parsed_message.groups.IssuerID)
			const keyframe = new Keyframe(ParsedLine.groups.Timestamp, EventType.ServerLogType.RemoteAdminActivity_GameChanging, EventType.Modules.ClassChange, keyframeData)
			this.currentTimeline.addKeyframe(keyframe)
			return
		}
		throw new Error(`Unable to parse Change Class Event: ${ParsedLine.groups.Message}`);
	}
	private DoorHandle(ParsedLine: SLRegExp) {
		let parsed_message = <SLRegExp | null>SLRegExp.Door.Change.exec(ParsedLine.groups.Message)
		if (parsed_message) {
			const keyframedata = new DoorEvent(parsed_message.groups.UserID, parsed_message.groups.DoorName, <DoorState>parsed_message.groups.State, parsed_message.groups.Type)
			const keyframe = new Keyframe(ParsedLine.groups.Timestamp, EventType.ServerLogType.GameEvent, EventType.Modules.Door, keyframedata)
			this.currentTimeline.addKeyframe(keyframe)
			return
		}
		throw new Error(`Unable to parse Door Event: ${ParsedLine.groups.Message}`);
	}
	private NetworkingHandle(UserListRef: UserList, ParsedLine: SLRegExp) {
		let parsed_message: SLRegExp | null
		parsed_message = <SLRegExp>SLRegExp.Networking.Auth.exec(ParsedLine.groups.Message)
		if (parsed_message) {
			if (UserListRef.UserExist(parsed_message.groups.UserID)) {
				UserListRef.GetUser(parsed_message.groups.UserID).AddIP(parsed_message.groups.IPaddress)
			}
			else {
				const user = new User(parsed_message.groups.UserID, undefined, parsed_message.groups.IPaddress, undefined)
				UserListRef.AddUser(user)
			}
			const keyframedata = new ConnectionEvent(parsed_message.groups.UserID, 'Connected')
			if (this.state.roundInProgress) {
				keyframedata.getPlayerMap().set(parsed_message.groups.UserID, 'Spectator')
			}
			const keyframe = new Keyframe(ParsedLine.groups.Timestamp, EventType.ServerLogType.ConnectionUpdate, EventType.Modules.Networking, keyframedata)
			this.currentTimeline.addKeyframe(keyframe)
			this.state.connectedPlayers++
			return
		}
		parsed_message = <SLRegExp>SLRegExp.Networking.Nickname.exec(ParsedLine.groups.Message)
		if (parsed_message) {
			if (UserListRef.UserExist(parsed_message.groups.UserID)) {
				UserListRef.GetUser(parsed_message.groups.UserID).AddNickname(parsed_message.groups.UserName)
			}
			else {
				const user = new User(parsed_message.groups.UserID, parsed_message.groups.UserName, undefined, undefined)
				UserListRef.AddUser(user)
			}
			return
		}
		parsed_message = <SLRegExp>SLRegExp.Networking.Disconnect.exec(ParsedLine.groups.Message)
		if (parsed_message) {
			if (Role.TranslateToInternal(parsed_message.groups.Role) != 'Spectator') {
				this.currentTimeline.BackPropagatePlayerRole(parsed_message.groups.UserID, Role.TranslateToInternal(parsed_message.groups.Role))
			}
			const keyframedata = new ConnectionEvent(parsed_message.groups.UserID, 'Disconnected')
			const keyframe = new Keyframe(ParsedLine.groups.Timestamp, EventType.ServerLogType.ConnectionUpdate, EventType.Modules.Networking, keyframedata)
			this.currentTimeline.addKeyframe(keyframe)
			this.state.connectedPlayers--
			return
		}
		if (SLRegExp.Networking.Preauth.test(ParsedLine.groups.Message)) {
			this.currentTimeline.addPadding()
			return
		}
		// throw new Error(`Unable to parse Networking event: ${ParsedLine.groups.Message}`);
	}
	private get currentTimeline(): Timeline {
		return this.timelineArray[this.state.roundNum]
	}
}


// class SCPRLParser {
//     constructor(parameters) {

// private keyframe: Array<Keyframe | number>
// //to be moved to scprlparser
// state = {
// 	respawn_in_progress: false,
// 	multiline_message: false
// }
// constructor() {
// 	this.keyframe = new Array()
// }
// Clear() {
// 	this.keyframe = new Array();
// 	this.NewKeyFrame(null, 'round_start')
// 	this.state.multiline_message = false
// 	this.state.respawn_in_progress = false
// }
// /**
//  * Creates new keyframe, returns index of new keyframe
//  */
// NewKeyFrame(timestamp: string, event?: string): number {
// 	let current_keyframe = this.keyframe.push(new Keyframe(timestamp, event, event)) - 1;
// 	// this.keyframe[current_keyframe].timestamp = new Date(timestamp);
// 	// this.keyframe[current_keyframe].event = event;
// 	// this.keyframe[current_keyframe].player = new Object();
// 	return current_keyframe;
// }
// EditKeyFrameEvent(keyframe: number, event: string) {
// 	if (keyframe == undefined) {
// 		throw new Error("keyframe is undefined");
// 	}
// 	if (event == undefined) {
// 		throw new Error("event is undefined");
// 	}
// 	this.keyframe[keyframe].event = event
// }
// AddPlayer(keyframe: number, UserID: User['ID'], role: InternalRole) {
// 	if (keyframe == null) {
// 		throw new Error("keyframe is null")
// 	}
// 	if (keyframe < 0 || keyframe > this.keyframe.length - 1) {
// 		throw new Error(`keyframe array has size of ${this.keyframe.length}, accessing out of bounds`)
// 	}
// 	role = Role.TranslateToInternal(role)
// 	if (this.keyframe[keyframe].player[UserID] != undefined && this.keyframe[keyframe].player[UserID] != role) {
// 		if (role != 'Scp0492') { // Write as error
// 			console.warn(`Player ${UserID} at ${keyframe} was ${this.keyframe[keyframe].player[UserID]} and now is ${role}`)
// 		}
// 		else {
// 			console.log(`Player ${UserID} at ${keyframe} was ${this.keyframe[keyframe].player[UserID]} and now is ${role}`)
// 		}
// 	}
// 	this.keyframe[keyframe].player[UserID] = role
// }
// AddKiller(keyframe: number, userID: User['ID']) {
// 	if (keyframe == undefined) {
// 		throw new Error("keyframe is undefined")
// 	}
// 	if (keyframe < 0 || keyframe > this.keyframe.length - 1) {
// 		throw new Error(`keyframe array has size of ${this.keyframe.length}, accessing out of bounds`)
// 	}
// 	if (userID == undefined) {
// 		throw new Error("UserID is undefined")
// 	}
// 	this.keyframe[keyframe].killer = userID;
// }
// PlayerExist(UserID: string): boolean {
// 	for (let index = this.keyframe.length - 1; index >= 0; index--) {
// 		if (this.keyframe[index].player[UserID] != undefined) {
// 			return true
// 		}
// 	}
// 	return false;
// }
// FindNewestEventType(event: string): number {
// 	if (event == undefined) {
// 		throw new Error("event type is undefined")
// 	}
// 	for (let index = this.keyframe.length - 1; index >= 0; index--) {
// 		if (this.keyframe[index].event == event) {
// 			return index
// 		}
// 	}
// 	throw new Error(`Event ${event} does not exist`)
// }
// /**
//  * Method to find newest keyframe index, passing Role and keyframe narrows searching 
//  */
// FindNewestPlayer(UserID: User['ID'], role?: string, keyframe?: number): number {
// 	if (!this.PlayerExist(UserID)) {
// 		throw new Error(`Player ${UserID} Does not exists`)
// 	}
// 	let startfrom;
// 	if (keyframe == undefined) {
// 		startfrom = this.keyframe.length - 1;
// 	}
// 	else {
// 		startfrom = keyframe
// 	}

// 	if (role == undefined) {
// 		for (let index = startfrom; index >= 0; index--) {
// 			if (this.keyframe[index].player[UserID] != undefined) {
// 				return index
// 			}
// 		}
// 	}
// 	else {
// 		role = Role.TranslateToInternal(role)
// 		for (let index = startfrom; index >= 0; index--) {
// 			if (this.keyframe[index].player[UserID] == role) {
// 				return index
// 			}
// 		}
// 	}
// 	throw new Error(`Unable to find player ${UserID} with ${role} role`)

// }
// FindPlayerWithRole(role: string) {
// 	for (const [playerID, playerRole] of Object.entries(this.keyframe[0].player)) {
// 		if (playerRole == role) {
// 			return playerID;
// 		}
// 	}
// 	return null;
// }
// /**
// * W momencie otrzymania roli następuje wsteczna propagacja w osi czasu
// */
// BackPropagatePlayerRole(UserID: string, Role: string) {
// 	if (!this.PlayerExist(UserID)) { // If player does not exist assume that's their first role (round start)
// 		this.AddPlayer(0, UserID, Role)
// 	}
// 	else {
// 		this.AddPlayer(this.FindNewestPlayer(UserID), UserID, Role)  //Złap zombiaka
// 	}
// }
//     }
// }

export { RoundLogFile }