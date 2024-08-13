//@ts-check
let version = "0.0.4-rc2"
let indev = true


/*
    Tytuł projektu: SCP:SL LOG PARSER
    Cel projektu: Przetwarzanie logów rund serwera SCP:SL w celu łatwego podglądu
    Autor: GamyGamer (306161751077158933)

    TODO:
        - Utworzenie osi czasu z której można łatwo podejrzeć kto jest jaką rolą w danym okresie czasu, może pokoloruj oś podczas detonacji, markery spawnmanager
        - Podświetl wszystkie linijki z danym ID po kliknięciu na linijkę
    TOFIX:
        - People who escaped but did not appear anywhere in logs up to this point will have start roles marked as their current
            - Bandaid: Specialist > Scientist | Private > Class-D, same for Chaos
            - IT'S NOT POSSIBLE TO GET WHEN SOMEONE ESCAPED SO IT'S EITHER FULL CLASS-D OR FULL PRIVATE [IMO it should be logged, Northwood please fix]
            - I think it's actually better to keep as is, easy lookup if someone escaped
        - Martyrdom grenades
        - Honorable mention:
            -2024-07-29 10:48:57.923 +02:00 - ??? // INTENTIONAL?
            -2024-07-30 23:34:36.930 +02:00 - Prawdopodobnie nastąpił martyrdom grenade. Jako że jest to chyba JEDYNY sposób w jaki spectator zabija kogoś i ma zachowaną nadal rolę // TOFIX


    Struktura timeline [WORKS (I think) BUT NOT USED]

    timeline.keyframe[n] - dana klatka kluczowa wyrażona przez n, jeśli n = 0: start rundy
    timeline.keyframe[n].player[USER_ID] - zmieniona rola użytkownika z danym userID (steam,discord,northwood) podczas danego eventu
    
    Ze względu na sposób logowania osoby które zostały zrespione na start rundy role ich nie są wiadome do akcji z czyjąś śmiercią (Kill,TKill,Suicide) (wyjście z gry zabija)
    UWAGA, JEŚLI OSOBA PRZEŻYŁA CAŁĄ RUNDĘ TO MOŻNA INFORMACJĘ WYCIĄGNĄĆ JESZCZE Z DISCONNECTA KTÓRY AKURAT PRZECHOWUJE INFO

    Jeśli osoba nie ma żadnej referencji w logach assume pierwszą rolę jaka się pojawi w round_start (what about latejoins?)

    assumtions:
    -Warhead detonation makes foundation inaccessible (report all warhead deaths to one event)
    -It is possible to add another detonation event (ex another one from Remote Admin), it should respect newest one 
    -If someone is seen for the first time assume current role as their first role (unless respawn manager)

*/
class Roles {
    Aligments = {
        SCP: ["Scp173", "Scp106", "Scp049", "Scp079", "Scp096", "Scp0492", "Scp939", "Scp3114"],
        Foundation: ["NtfSpecialist", "NtfSergeant", "NtfCaptain", "NtfPrivate", "FacilityGuard", "Scientist"],
        Chaos: ["ChaosConscript", "ChaosRifleman", "ChaosMarauder", "ChaosRepressor", "ClassD"],
        Misc: ["Spectator", "Overwatch", "Filmmaker", "Tutorial"]
    }
    Military = ["NtfSpecialist", "NtfSergeant", "NtfCaptain", "NtfPrivate", "FacilityGuard", "ChaosConscript", "ChaosRifleman", "ChaosMarauder", "ChaosRepressor"];
    Civilian = ["Scientist", "ClassD"]
    /**
     * @param {string} Role
     * @returns {boolean}
     */
    IsCivilian(Role) {
        if (Role == undefined) {
            throw new Error("Role is undefined");
        }
        let found = false
        this.Civilian.forEach(element => {
            if (element == Role) {
                found = true
            }
        })
        return found
    }
    /**
     * @param {string} Role
     * @returns {boolean}
     */
    IsSCP(Role) {
        if (Role == undefined) {
            throw new Error("Role is undefined");
        }
        let found = false
        this.Aligments.SCP.forEach(element => {
            if (element == Role) {
                found = true
            }
        })
        return found
    }
}

class Timeline {
    keyframe = new Array();
    role_dictonary = {
        "Scp173": "SCP-173",
        "Scp106": "SCP-106",
        "Scp049": "SCP-049",
        "Scp079": "SCP-079",
        "Scp096": "SCP-096",
        "Scp0492": "SCP-049-2",
        "Scp939": "SCP-939",
        "Scp3114": "SCP-3114",
        "NtfSpecialist": "Nine-Tailed Fox Specialist",
        "NtfSergeant": "Nine-Tailed Fox Sergeant",
        "NtfCaptain": "Nine-Tailed Fox Captain",
        "NtfPrivate": "Nine-Tailed Fox Private",
        "FacilityGuard": "Facility Guard",
        "ChaosConscript": "Chaos Insurgency Conscript",
        "ChaosRifleman": "Chaos Insurgency Rifleman",
        "ChaosMarauder": "Chaos Insurgency Marauder",
        "ChaosRepressor": "Chaos Insurgency Repressor",
        "Scientist": "",
        "ClassD": "Class-D Personnel",
        "Spectator": "",
        "Overwatch": "",
        "Filmmaker": "",
        "Tutorial": "",
    }
    constructor() {
        this.NewKeyFrame(null, 'round_start')
    }
    Clear() {
        this.keyframe = new Array();
        this.NewKeyFrame(null, 'round_start')
    }
    /**
     * Converts translated roles to internal
     * @param {string} Role
     * @returns {string} 
     */
    TranslateToInternal(Role) {
        if (Role == undefined) {
            throw new Error("Unable to translate undefined role")
        }
        for (const [internal, translated] of Object.entries(timeline.role_dictonary)) {
            if (Role == internal || Role == translated) {
                return internal
            }
        }
        throw new Error(`Role "${Role}" has no defined translation`)
    }
    /**
     * Creates new keyframe with optional parameters
     * @param {string} timestamp 
     * @param {string} event 
     * @return {number}
     */
    NewKeyFrame(timestamp = undefined, event = undefined) {
        let current_keyframe = this.keyframe.push(new Object()) - 1;
        this.keyframe[current_keyframe].timestamp = timestamp;
        this.keyframe[current_keyframe].event = event;
        this.keyframe[current_keyframe].player = new Object();
        return current_keyframe;
    }
    /**
     * @param {number} keyframe
     * @param {string} event
     */
    EditKeyFrameEvent(keyframe, event) {
        if (keyframe == undefined) {
            throw new Error("keyframe is undefined");
        }
        if (event == undefined) {
            throw new Error("event is undefined");
        }
        this.keyframe[keyframe].event = event
    }
    /**
     * 
     * @param {number} keyframe Indexing starts from 0 (round start) to length of array that contains keyframes
     * @param {string} UserID 
     * @param {string} Role
     */
    AddPlayer(keyframe = null, UserID = null, Role = null) {
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
            console.log(`Player ${UserID} at ${keyframe} was ${this.keyframe[keyframe].player[UserID]} and now is ${Role}`)
        }
        this.keyframe[keyframe].player[UserID] = Role
    }
    /**
     * 
     * @param {number} keyframe 
     * @param {string} userID 
     */
    AddKiller(keyframe = undefined, userID = undefined) {
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
    /**
     * 
     * @param {string} UserID 
     * @returns {boolean}
     */
    PlayerExist(UserID = null) {
        if (UserID == null) {
            throw new Error("UserID is null")
        }
        for (let index = this.keyframe.length - 1; index >= 0; index--) {
            if (this.keyframe[index].player[UserID] != undefined) {
                return true
            }
        }
        return false;
    }
    /**
     * 
     * @param {string} event
     * @returns {number} index 
     */
    FindNewestEventType(event) {
        if (event == undefined) {
            throw new Error("event type is undefined")
        }
        for (let index = this.keyframe.length - 1; index >= 0; index--) {
            if (this.keyframe[index].event == event) {
                return index
            }
        }
        throw new Error("Event does not exist")
    }
    /**
     * Method to find newest keyframe index, passing Role and keyframe narrows searching 
     * @param {string} UserID 
     * @param {string} Role
     * @param {number} keyframe 
     * @returns {number} index
     */
    //TODO: OPTIONAL ROLE
    FindNewestPlayer(UserID, Role = undefined, keyframe = undefined) {
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
    /**
    * W momencie otrzymania roli następuje wsteczna propagacja w osi czasu
    * @param {string} UserID 
    * @param {string} Role 
    */
    BackPropagatePlayerRole(UserID, Role) {
        if (!this.PlayerExist(UserID)) { // If player does not exist assume that's their first role (round start)
            this.AddPlayer(0, UserID, Role)
        }
        else {
            this.AddPlayer(this.FindNewestPlayer(UserID), UserID, Role)  //Złap zombiaka
        }
    }

}

let timeline = new Timeline()
let Role = new Roles();
let lines = new Array();
let new_lines = new Array();
let death_logs = new String();
const admin_chat_log = window.document.getElementById('admin_chat');
let UserID_assoc = new Object();
let respawn_in_progress = false

function MakeTimeLine() {
    window.document.getElementById('welcome').style.display = 'none'

    timeline.Clear()
    respawn_in_progress = false
    death_logs = new String();
    admin_chat_log.innerText = new String().toString()
    UserID_assoc = new Object();
    let filereader = new FileReader();



    filereader.readAsText(this.files[0])
    filereader.onload = function () {
        // document.getElementById('output').textContent = filereader.result;
        // @ts-ignore
        lines = filereader.result.split('\n');

        const tbody = document.getElementById('table')
        tbody.innerHTML = ""
        lines.forEach(element => {
            if (element == "") {
                return;
            }
            new_lines = REGEX_log_split.exec(element) // Dzięki śmieszkowi który wstawił do nicku '|' :DDDDDD (Pain) [Przynajmniej znalazłem błąd który nie przechwytywał końca rundy]
            if (new_lines == null) {
                throw new Error(`Error splitting ${element}`);
            }
            if (new_lines.length != 5) {
                throw new Error(`Error splitting ${element}`);
            }

            else {
                for (let index = 0; index < new_lines.length; index++) {
                    new_lines[index] = new_lines[index].trim(); // Remove leading spaces
                }
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                const img = document.createElement('img');


                switch (new_lines[3]) {
                    case "Administrative":
                        AdministativeHandle(new_lines, tr)
                        img.src = "icons/shield.png"
                        break;
                    case "Logger":
                        LoggerHandle(new_lines, tr)
                        img.src = "icons/log.png"
                        break;
                    case "Class change":
                        ClassChangeHandle(new_lines, tr)
                        img.src = "icons/swap.png"
                        break;
                    case "Warhead":
                        WarheadHandle(new_lines, tr)
                        img.src = "icons/nuclear-explosion.png"
                        break;
                    case "Networking":
                        NetworkingHandle(new_lines, tr)
                        img.src = "icons/na.png"
                        break;

                    default:
                        img.src = "icons/na.png"
                        break;
                }

                td.appendChild(img)
                tr.appendChild(td)
                for (let index = 1; index < 5; index++) { // Przepisz fragmenty z logów do odpowiednich komórek
                    const td = document.createElement('td');
                    td.textContent = new_lines[index]
                    tr.appendChild(td)
                }
                if (new_lines[4].search(REGEX_scp_intentional_deaths) != -1) {
                    tr.style.backgroundColor = 'cornflowerblue';
                }

                //TODO: Jeśli ktoś zmienił nick to zapisz w tablicy
                let regmatch = REGEX_ID_to_username.exec(new_lines[4])
                if (regmatch != null) {
                    UserID_assoc[regmatch[1]] = regmatch[2]
                }

                tbody.appendChild(tr)
            }


        });
        window.document.getElementById('death_logs').innerText = death_logs.toString()
        if (!(admin_chat_log.innerText == '')) {
            admin_chat_log.appendChild(window.document.createElement('hr'))
        }

        if (typeof monitored_users === 'undefined' || monitored_users === null) { // monitored users are defined locally, it stores array of userIDs to monit users that specific person was found on the server (like potential cheater)
            /*
            If you want to use this functionality type in console:
            let monitored_users = new Array()
            monitored_users.push( tutaj wstaw ID osoby w pojedynczych cudzysłowiach '' )

            */
            return;
        }
        for (const [userID, Nickname] of Object.entries(UserID_assoc)) {
            monitored_users.forEach(element => {
                if (element == userID) {
                    alert(`Monitored user ${Nickname} (${userID}) was found`)
                }
            })
        }
    }
}

window.addEventListener('error', (ErrorEvent) => {
    document.getElementById('error_bar').style.display = 'block';
})
if (indev) {
    document.getElementById('warn_bar').style.display = 'block';
}

window.document.getElementById('version').innerText = `Version: ${version}`

document.getElementById('fileInput').addEventListener('change', MakeTimeLine);

/**
 * @param {any[]} new_lines
 * @param {HTMLTableRowElement} tr
 */
function ClassChangeHandle(new_lines, tr) {
    // tr.style.backgroundColor = 'red'

    //HIGH PRIORITY

    //DETONACJA WARHEAD
    let regmatch = REGEX_warhead_death.exec(new_lines[4])
    if (regmatch != null) {
        let det_keyframe = timeline.FindNewestEventType('warhead_detonated')
        death_logs += `${regmatch[1]} (${regmatch[2]}) died to Alpha Warhead\n`

        timeline.BackPropagatePlayerRole(regmatch[1], regmatch[2])
        timeline.AddPlayer(det_keyframe, regmatch[1], 'Spectator')

        tr.style.backgroundColor = 'red'
        return
    }

    //LOW PRIORITY

    //KTOŚ KOGOŚ ZABIŁ
    regmatch = REGEX_direct_kill.exec(new_lines[4])
    if (regmatch != null) {
        let current_keyframe = timeline.NewKeyFrame(new_lines[1], 'kill')

        death_logs += `${regmatch[3]} (${regmatch[4]}) killed ${regmatch[1]} (${regmatch[2]}) [${regmatch[5]}]\n`

        timeline.BackPropagatePlayerRole(regmatch[1], regmatch[2])
        timeline.BackPropagatePlayerRole(regmatch[3], regmatch[4])
        timeline.AddPlayer(current_keyframe, regmatch[1], 'Spectator')
        timeline.AddKiller(current_keyframe, regmatch[3])

        if (Role.IsSCP(timeline.TranslateToInternal(regmatch[2])) || (Role.IsCivilian(timeline.TranslateToInternal(regmatch[2])) && !Role.IsSCP(timeline.TranslateToInternal(regmatch[4])))) {
            tr.style.backgroundColor = 'red'
        }
        return;
    }

    //SAMOBÓJ
    regmatch = REGEX_suicide.exec(new_lines[4])
    if (regmatch != null) {
        let current_keyframe = timeline.NewKeyFrame(new_lines[1], 'suicide')

        death_logs += `${regmatch[1]} (${regmatch[2]}) commited suicide [${regmatch[3]}]\n`

        timeline.BackPropagatePlayerRole(regmatch[1], regmatch[2])
        timeline.AddPlayer(current_keyframe, regmatch[1], 'Spectator')
        if (Role.IsSCP(timeline.TranslateToInternal(regmatch[2]))) {
            tr.style.backgroundColor = 'red'
        }
        return;
    }
    //ZABÓJSTWO BEZ OSOBY ZABIJAJĄCEJ // TODO / TOFIX
    regmatch = REGEX_single_kill.exec(new_lines[4])
    if (regmatch != null) {
        let captured = false
        let current_keyframe = timeline.NewKeyFrame(new_lines[1])

        if (regmatch.groups.reason.search(REGEX_suicide_reason) != -1) {
            captured = true
            timeline.EditKeyFrameEvent(current_keyframe, 'suicide')
            death_logs += `${regmatch.groups.victim} (${regmatch.groups.role}) commited suicide [${regmatch[3]}]\n`
        }
        else if (regmatch.groups.reason.search(REGEX_recontained) != -1) {
            captured = true
            timeline.EditKeyFrameEvent(current_keyframe, 'kill')
            death_logs += `${regmatch.groups.victim} (${regmatch.groups.role}) has been recontained\n`
        }
        else if (regmatch.groups.reason.search(REGEX_Decayed) != -1) {
            captured = true
            timeline.EditKeyFrameEvent(current_keyframe, 'kill')
            death_logs += `${regmatch.groups.victim} (${regmatch.groups.role}) ${regmatch.groups.reason}\n`
        }

        timeline.BackPropagatePlayerRole(regmatch[1], regmatch[2])
        timeline.AddPlayer(current_keyframe, regmatch[1], 'Spectator')
        if (Role.IsSCP(timeline.TranslateToInternal(regmatch[2]))) {
            tr.style.backgroundColor = 'red'
        }
        if (!captured) {
            throw new Error(`Single kill death was not captured "${regmatch.groups.reason}"`);
        }
        return;
    }

    //TEAMKILL
    regmatch = REGEX_teamkill.exec(new_lines[4])
    if (regmatch != null) {
        let current_keyframe = timeline.NewKeyFrame(new_lines[1], 'kill')

        death_logs += `${regmatch[3]} (${regmatch[4]}) killed ${regmatch[1]} (${regmatch[2]}) [${regmatch[5]}]\n`

        timeline.BackPropagatePlayerRole(regmatch[1], regmatch[2])
        timeline.BackPropagatePlayerRole(regmatch[3], regmatch[4])
        timeline.AddPlayer(current_keyframe, regmatch[1], 'Spectator')
        timeline.AddKiller(current_keyframe, regmatch[3])
        if (Role.IsSCP(timeline.TranslateToInternal(regmatch[2])) || (Role.IsCivilian(timeline.TranslateToInternal(regmatch[2])) && !Role.IsSCP(timeline.TranslateToInternal(regmatch[4])))) {
            tr.style.backgroundColor = 'red'
        }
        return;
    }

    //SPAWN WAVE 1/2
    regmatch = REGEX_Respawned_as.exec(new_lines[4])
    if (regmatch != null) {
        if (!respawn_in_progress) { // Oznacz proces respawnu
            let current_keyframe = timeline.NewKeyFrame(null, 'spawn_wave')
            timeline.AddPlayer(current_keyframe, regmatch[1], regmatch[2])
            respawn_in_progress = true
        }
        else {
            timeline.AddPlayer(timeline.FindNewestEventType('spawn_wave'), regmatch[1], regmatch[2])
        }
        return;
    }
    //SPAWN WAVE 2/2
    regmatch = REGEX_respawn_manager.exec(new_lines[4])
    if (regmatch != null) {
        timeline.keyframe[timeline.FindNewestEventType('spawn_wave')].timestamp = new_lines[1]
        respawn_in_progress = false
        tr.style.backgroundColor = 'red'
        return;
    }
    //FORCE CLASS
    regmatch = REGEX_class_change.exec(new_lines[4])
    if (regmatch != null) {
        let current_keyframe = timeline.NewKeyFrame(new_lines[1], 'force_class')
        timeline.AddPlayer(current_keyframe, regmatch[2], regmatch[3])
        return;

    }
    throw new Error(`Could not parse Change class event.: ${new_lines[4]}`)
}


/**
 * @param {string[]} new_lines
 * @param {HTMLTableRowElement} tr
 */
function LoggerHandle(new_lines, tr) {
    tr.style.backgroundColor = 'orange'
    if (new_lines[4].search(REGEX_round_start) != -1) {
        timeline.keyframe[timeline.FindNewestEventType('round_start')].timestamp = new_lines[1];
        return
    }
    if (new_lines[4].search(REGEX_round_finish) != -1) {
        timeline.NewKeyFrame(new_lines[1], 'round_finish')
        return
    }
    //throw new Error(`Could not parse Logger event.: ${new_lines[4]}`)
}

/**
 * @param {string[]} new_lines
 * @param {HTMLTableRowElement} tr
 */
function AdministativeHandle(new_lines, tr) {
    let regmatch = REGEX_admin_chat.exec(new_lines[4])
    if (regmatch != null) {
        const admin_name = window.document.createElement('span')
        const admin_message = window.document.createTextNode(`: ${regmatch[3]}`)

        admin_name.className = 'admin_chat'
        admin_name.innerText = regmatch[1]
        admin_chat_log.appendChild(admin_name)
        admin_chat_log.appendChild(admin_message)
        admin_chat_log.appendChild(document.createElement('br'))
        return
    }
    // throw new Error(`Could not parse Administrative event.: ${new_lines[4]}`)
}

/**
 * @param {string[]} new_lines
 * @param {HTMLTableRowElement} tr
 */
function WarheadHandle(new_lines, tr) {
    tr.style.backgroundColor = 'teal'
    if (new_lines[4].search(REGEX_warhead_countdown_start) != -1) {
        timeline.NewKeyFrame(new_lines[1], 'warhead_countdown_start')
        return
    }
    if (new_lines[4].search(REGEX_warhead_countdown_paused) != -1) {
        timeline.NewKeyFrame(new_lines[1], 'warhead_countdown_paused')
        return
    }
    if (new_lines[4].search(REGEX_warhead_detonated) != -1) {
        timeline.NewKeyFrame(new_lines[1], 'warhead_detonated')
        return
    }

    //throw new Error(`Could not parse Warhead event.: ${new_lines[4]}`)
}

/**
 * @param {string[]} new_lines
 * @param {HTMLTableRowElement} tr
 */
function NetworkingHandle(new_lines, tr) {
    let regmatch = REGEX_networking_ignore.exec(new_lines[4])
    if (regmatch != null) {
        return
    }

    regmatch = REGEX_ID_to_username.exec(new_lines[4])
    if (regmatch != null) {
        UserID_assoc[regmatch[1]] = regmatch[2]
        return
    }

    regmatch = REGEX_disconnect.exec(new_lines[4])
    if (regmatch != null) {
        if (timeline.PlayerExist(regmatch.groups.user)) {
            timeline.BackPropagatePlayerRole(regmatch.groups.user,regmatch.groups.role)
        }
        return;
    }
    throw new Error(`Could not parse Networking event.: ${new_lines[4]}`)
}
