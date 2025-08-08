import { EventType } from "./gameevent";
import { InternalRole } from "./role";
import { User } from "./user";

type KeyframeData = RoundStartEvent | DeathEvent;

abstract class BasicEvent {
	abstract readonly event_type: EventType.Specific
	getEventType(): EventType.Specific { return this.event_type }
}

interface PlayerRef {
	//Map of user containing userID and new role
	player?: Map<User['ID'], InternalRole>
	//User who is responsible  a class change via Remote admin
	killer?: Map<User['ID'], InternalRole>
	//User who invoked a class change via Remote admin
	issuer?: User['ID']
}


export class RoundStartEvent extends BasicEvent implements PlayerRef {
	readonly event_type = EventType.Specific.RoundStart;
	readonly player: Map<User['ID'], InternalRole>
	constructor() {
		super()
		this.player = new Map()
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

export { KeyframeData }