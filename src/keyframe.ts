import { InternalRole } from "./role";
import { User } from "./user";



class Keyframe {
    timestamp: Date;
    event: string;
    player: Map<User["ID"], InternalRole>
    issuer: Map<User['ID'], InternalRole>
    constructor(date: Date | string, event: string, player?: User, issuer?: User) {
        this.timestamp = new Date(date)
        if (Number.isNaN(this.timestamp.valueOf())) {
            throw new Error(`Provided date is invalid: ${date}`);
        }
        this.event = event
        this.player = new Map()
        this.issuer = new Map()
    }
}
export { Keyframe }