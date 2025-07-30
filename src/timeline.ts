import { Role } from "./role";
import { Settings } from "./settings";
class Timeline {
    keyframe: Array<any>
    state = {
        respawn_in_progress: false,
        multiline_message: false
    }
    constructor() {
        this.keyframe = new Array()
        this.state = {
            respawn_in_progress: false,
            multiline_message: false
        }
        this.NewKeyFrame(null, 'round_start')
    }
    Clear() {
        this.keyframe = new Array();
        this.NewKeyFrame(null, 'round_start')
        this.state.multiline_message = false
        this.state.respawn_in_progress = false
    }
    /**
     * Converts translated roles to internal
     */
    TranslateToInternal(role: string): string {
        if (role == undefined) {
            throw new Error("Unable to translate undefined role")
        }
        if (role == "None") {
            console.warn("WARNING, ROLE NONE (POSSIBLE NULL PLAYER) DETECTED!!!")
            return "None"
        }
        if (role == "Destroyed") { // TODO: Can cause issue at the end of the round in the back propagation stage
            return "Spectator"
        }
        for (const [internal, translated] of Object.entries(Role.role_dictonary)) {

            if (role == internal || role == translated) {
                return internal
            }
        }
        if (Settings.strict_mode) {
            throw new Error(`Role "${role}" has no defined translation`)
        }
        else {
            console.warn(`Role "${role}" has no defined translation`)
        }
        return "UnknownRole_ReportToLogParserProgrammer"
        // throw new Error(`Role "${role}" has no defined translation`)
    }
    /**
     * Creates new keyframe with optional parameters
     */
    NewKeyFrame(timestamp?: string | null, event?: string): number {
        let current_keyframe = this.keyframe.push(new Object()) - 1;
        this.keyframe[current_keyframe].timestamp = timestamp;
        this.keyframe[current_keyframe].event = event;
        this.keyframe[current_keyframe].player = new Object();
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
    AddPlayer(keyframe: number, UserID: string, Role: string) {
        if (keyframe == null) {
            throw new Error("keyframe is null")
        }
        if (keyframe < 0 || keyframe > this.keyframe.length - 1) {
            throw new Error(`keyframe array has size of ${this.keyframe.length}, accessing out of bounds`)
        }
        if (UserID == null) {
            throw new Error("UserID is null")
        }
        if (Role == null) {
            throw new Error("Role is null")
        }
        Role = this.TranslateToInternal(Role)
        if (this.keyframe[keyframe].player[UserID] != undefined && this.keyframe[keyframe].player[UserID] != Role) {
            if (Role != 'Scp0492') { // Write as error
                console.warn(`Player ${UserID} at ${keyframe} was ${this.keyframe[keyframe].player[UserID]} and now is ${Role}`)
            }
            else {
                console.log(`Player ${UserID} at ${keyframe} was ${this.keyframe[keyframe].player[UserID]} and now is ${Role}`)
            }
        }
        this.keyframe[keyframe].player[UserID] = Role
    }
    AddKiller(keyframe: number, userID: string) {
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
    FindNewestPlayer(UserID: string, Role?: string, keyframe?: number): number {
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

        if (Role == undefined) {
            for (let index = startfrom; index >= 0; index--) {
                if (this.keyframe[index].player[UserID] != undefined) {
                    return index
                }
            }
        }
        else {
            Role = this.TranslateToInternal(Role)
            for (let index = startfrom; index >= 0; index--) {
                if (this.keyframe[index].player[UserID] == Role) {
                    return index
                }
            }
        }
        throw new Error(`Unable to find player ${UserID} with ${Role} role`)

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