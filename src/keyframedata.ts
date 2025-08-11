import { EventType } from "./gameevent";
import { InternalRole } from "./role";
import { User } from "./user";

type KeyframeData = RoundStartEvent | DeathEvent | RespawnEvent | ConnectionEvent | DoorEvent | ThrowableEvent;

abstract class BasicEvent {
	abstract readonly event_type: EventType.Specific
	getEventType(): EventType.Specific { return this.event_type }
}

interface PlayerRef {
	//Map of user containing userID and new role (From this point this user IS this role, NO EXCEPTIONS! (Well... Maybe for plague doctor because he doesn't give info when someone turned))
	player?: Map<User['ID'], InternalRole>
	//User who is responsible for class change, Shows current role
	killer?: Map<User['ID'], InternalRole>
	//User who invoked a class change via Remote admin, UserID only
	issuer?: User['ID']
	//User who has been affected by issuer, UserID only
	affected?: User['ID']
}


export class RoundStartEvent extends BasicEvent implements PlayerRef {
	readonly event_type = EventType.Specific.RoundStart;
	readonly player: Map<User['ID'], InternalRole>
	constructor() {
		super()
		this.player = new Map() // This will be our fallback for detected players mid round but still no official spawn 
	}
}

export class DeathEvent extends BasicEvent implements PlayerRef {
	readonly event_type = EventType.Specific.Death;
	death_type: string
	readonly player: Map<User['ID'], InternalRole>;
	killer?: Map<User['ID'], InternalRole>;
	constructor(playerID: User['ID'], playerRole: InternalRole, deathType: string, killerID?: User['ID'], killerRole?: InternalRole) {
		super();
		this.player = new Map()
		this.player.set(playerID, playerRole);
		switch (deathType) {
			case 'died':
			case 'suicide':
				if (killerID || killerRole) {
					throw new Error("KillerID and KillerRole can't exist on death types that shouldn't contain killer data");
				}
				break;
			case 'killed':
			case 'teamkilled':
				if (killerID && killerRole) {
					this.killer = new Map()
					this.killer.set(killerID, killerRole);
				}
				else {
					throw new Error("Invalid construction of Death event, KillerID and KillerRole have to exist on death types that should contain killer data");
				}

		}
		this.death_type = deathType
	}
	getDeathType(): string {
		return this.death_type
	}
	getPlayerMap(): Map<User['ID'], InternalRole> {
		return this.player
	}
	getKillerMap(): Map<User['ID'], InternalRole> {
		switch (this.death_type) {
			case 'died':
			case 'suicide':
				throw new Error("Killer Map does not exist");

			default:
				if (typeof this.killer == 'undefined') {
					throw new Error("Despite not having single type kill, Killer Map does not exists");
				}
				return this.killer
		}
	}
}

export class RespawnEvent extends BasicEvent implements PlayerRef {
	readonly event_type = EventType.Specific.Respawn;
	readonly player: Map<string, InternalRole>;
	private team?: 'FoundationForces' | 'ChaosInsurgency'

	constructor(UserID: User['ID'], Role: InternalRole, Team?: 'FoundationForces' | 'ChaosInsurgency') {
		super()
		this.player = new Map()
		this.player.set(UserID, Role)
		if (Team) {
			this.team = Team
		}
	}
	AddPlayer(UserID: User['ID'], Role: InternalRole) {
		if (typeof this.player.get(UserID) != 'undefined') {
			throw new Error("This player already exists");
		}
		this.player.set(UserID, Role)
	}
	GetPlayerMap(): Map<string, InternalRole> {
		return this.player
	}
	GetTeam(): 'FoundationForces' | 'ChaosInsurgency' | undefined {
		return this.team
	}
	SetTeam(Team: 'FoundationForces' | 'ChaosInsurgency') {
		this.team = Team
	}
}

export class ConnectionEvent extends BasicEvent implements PlayerRef {
	readonly event_type = EventType.Specific.Connection;
	private connection_type: 'Connected' | 'Disconnected'
	readonly player: Map<User['ID'], InternalRole>
	constructor(UserID: User['ID'], Type: 'Connected' | 'Disconnected') {
		super()
		this.player = new Map()
		this.connection_type = Type
		// When first joining assume role to be none, if it happened before round start keep as is, if after it can be edited when he gets referenced
		// When disconnecting player loses it's role and is nothing. Technically after disconnection this shouldn't be able to be edited
		this.player.set(UserID, 'None')
	}
	getConnectionType() {
		return this.connection_type
	}
	getPlayerMap(): Map<User['ID'], InternalRole> {
		return this.player
	}
	getPlayerRole(): InternalRole {
		let Role = this.player.get(this.getPlayerID())
		if (Role) {
			return Role
		}
		throw new Error("Something went wrong when getting player role");
	}
	setPlayerRole(Role: InternalRole) {
		this.player.set(this.getPlayerID(), Role)
	}
	getPlayerID(): User['ID'] {
		let PlayerID = this.player.keys().next()
		if (PlayerID.value) {
			return PlayerID.value
		}
		else {
			throw new Error(`Something went wrong when getting PlayerID`);
		}
	}
}

type DoorState = 'destroyed' | 'opened' | 'closed';

export class DoorEvent extends BasicEvent implements PlayerRef {
	readonly event_type = EventType.Specific.Door;
	readonly issuer: User['ID'];
	private doorName: string;
	private doorState: DoorState;
	private destructionType?: string;
	constructor(userID: User['ID'], doorName: string, doorState: DoorState, destructionType?: string) {
		super();
		this.issuer = userID;
		this.doorName = doorName;
		this.doorState = doorState
		if (doorState == 'destroyed' && (typeof destructionType == 'string')) {
			this.destructionType = destructionType
		}
		else if (doorState != 'destroyed' && (typeof destructionType == 'string')) {
			throw new Error(`Unable to assign destructionType when doorState is ${doorState} [destroyed only]`);
		}
	}
	getDoorName(): string {
		return this.doorName
	}
	getDoorState(): DoorState {
		return this.doorState
	}
	getDoorDestructionType(): string {
		if (typeof this.destructionType == 'undefined') {
			throw new Error("destructionType is undefined");
		}
		return this.destructionType
	}
	isDestroyed(): boolean {
		return this.doorState == 'destroyed'
	}
}

export class ThrowableEvent extends BasicEvent implements PlayerRef {
	readonly event_type = EventType.Specific.Throwable;
	readonly issuer: User['ID'];
	private action: 'threw' | 'using';
	private item: string;
	readonly affected?: User['ID'];
	private statusEffect?: string;
	constructor(IssuerID: User['ID'], action: 'threw' | 'using', item: string, AffectedID?: string, statusEffect?: string) {
		super();
		this.issuer = IssuerID;
		this.action = action;
		this.item = item;
		if ((typeof AffectedID == 'string') || (typeof statusEffect == 'string')) {
			if (typeof AffectedID == 'undefined') { throw new Error("AffectedID is undefined"); }
			if (typeof statusEffect == 'undefined') { throw new Error("statusEffect is undefined"); }
			if (action != 'using') { throw new Error('AffectedID and statusEffect cannot exist in event that stores throwing item only') }
			this.affected = AffectedID;
			this.statusEffect = statusEffect;
		}
	}
	getAction(): 'threw' | 'using' {
		return this.action;
	}
	getItem(): string {
		return this.item;
	}
	getIssuerID(): User['ID'] {
		return this.issuer;
	}
	getAffectedID(): User['ID'] {
		if (this.action == 'using') {
			return this.affected!;
		}
		throw new Error("AffectedID does not exists on non using action");
	}
	getStatusEffect(): string {
		if (this.action == 'using') {
			return this.statusEffect!
		}
		throw new Error("StatusEffect does not exists on non using action");
	}
}

export { KeyframeData }