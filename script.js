//@ts-check
let version = "0.2.0"
let indev = false


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
        - Reference logs:
            -2024-07-29 10:48:57.923 +02:00 - ??? // INTENTIONAL?
            -2024-07-30 23:34:36.930 +02:00 - Prawdopodobnie nastąpił martyrdom grenade. Jako że jest to chyba JEDYNY sposób w jaki spectator zabija kogoś i ma zachowaną nadal rolę // TOFIX
            -2024-08-13 11:55:53 - Przeanalizować sytuację z naukowcem
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
        if (Role == "None") {
            console.log("WARNING, ROLE NONE (POSSIBLE NULL PLAYER) DETECTED!!!")
            return "None"
        }
        for (const [internal, translated] of Object.entries(this.role_dictonary)) {
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
            if (Role != 'Scp0492') { // Write as error
                console.warn(`Player ${UserID} at ${keyframe} was ${this.keyframe[keyframe].player[UserID]} and now is ${Role}`)
            }
            else {
                console.log(`Player ${UserID} at ${keyframe} was ${this.keyframe[keyframe].player[UserID]} and now is ${Role}`)
            }
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
        throw new Error(`Event ${event} does not exist`)
    }
    /**
     * Method to find newest keyframe index, passing Role and keyframe narrows searching 
     * @param {string} UserID 
     * @param {string} Role
     * @param {number} keyframe 
     * @returns {number} index
     */
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

let timeline = new Object();
let Role = new Roles();
let lines = new Array();
let new_lines = new Array();
let UserID_assoc = new Object();
let IPaddress_assoc = new Object();
const article_array = new Object();

function Selector() {
    this.parentElement.childNodes.forEach(element => {
        if (element.getAttribute('class') != null) {
            element.removeAttribute('class')
        }
    });
    this.setAttribute('class', 'selected')
    let index = 0;
    let currentItem = this
    while (currentItem.previousSibling) {
        currentItem = currentItem.previousSibling
        index++
    }
    console.log(index)
    const main = window.document.getElementsByTagName('main')[0]
    main.getElementsByClassName('selected')[0].removeAttribute('class')

    main.children[index].setAttribute('class', 'selected')


    //TODO: HIDE AND SELECT
}

function MakeTimeLine() {
    window.document.getElementById('progress_bar').style.display = 'block'
    window.document.getElementById('welcome').style.display = 'none'
    window.document.getElementById('log_select').innerHTML = ''
    window.document.getElementsByTagName('main')[0].innerHTML = ''
    for (let index = 0; index < this.files.length; index++) {
        let li = window.document.createElement('li')
        // li.id=`file_selector_${index}` // 
        li.addEventListener("click", Selector)
        li.innerText = `${this.files[index].name}`
        if (index == 0) {
            li.className = 'selected'
        }
        window.document.getElementById('log_select').appendChild(li);
    }
    timeline = new Object();
    console.clear()
    UserID_assoc = new Object();
    IPaddress_assoc = new Object();
    let progressbar_current = 0
    window.document.getElementById('progress_bar').setAttribute('max', (this.files.length - 1).toString())


    for (const [index, file] of Object.entries(this.files)) {
        console.log(`${index}: ${file}`)
        let filereader = new FileReader();
        filereader.addEventListener('load', () => {

            // DOM CREATION
            const article = window.document.createElement('article')
            const table = window.document.createElement('table')
            const tbody = window.document.createElement('tbody')
            const death_log = window.document.createElement('span')
            const admin_chat_log = window.document.createElement('span')

            table.appendChild(tbody)

            article.appendChild(table)
            article.appendChild(death_log)
            let death_log_text = new String().toString();

            article.appendChild(window.document.createElement('hr'))
            article.appendChild(admin_chat_log)
            article_array[index] = article;


            let state = {
                respawn_in_progress: false,
                is_broadcasting: false,
            }
            window.document.getElementById('progress_bar').setAttribute('value', (progressbar_current++).toString())
            timeline[index] = new Timeline();
            console.debug(index)
            // document.getElementById('output').textContent = filereader.result;
            // @ts-ignore
            lines = filereader.result.split('\n');

            // const tbody = document.getElementById('table')
            tbody.innerHTML = ""
            lines.forEach(element => {
                if (element == "") {
                    return;
                }
                new_lines = REGEX_log_split.exec(element) // Dzięki śmieszkowi który wstawił do nicku '|' :DDDDDD (Pain) [Przynajmniej znalazłem błąd który nie przechwytywał końca rundy]

                if (new_lines == null) {
                    if (state.is_broadcasting) {
                        if (element == "") {
                            element = "\n"
                        }
                        //Is linesplit happened before broadcast ended I have to edit last element
                        //article.table.tbody.[last tr].[last td].textContent
                        article.children[0].children[0].lastChild.lastChild.textContent += element
                        return
                    }
                    throw new Error(`Error splitting ${element}`);
                }
                if (new_lines.length != 5) {
                    throw new Error(`Error splitting ${element}`);
                }
                else {
                    state.is_broadcasting = false;
                    for (let index = 0; index < new_lines.length; index++) {
                        new_lines[index] = new_lines[index].trim(); // Remove leading spaces
                    }
                    const tr = document.createElement('tr');
                    const td = document.createElement('td');
                    const img = document.createElement('img');


                    switch (new_lines[3]) {
                        case "Administrative":
                            AdministativeHandle(new_lines, tr, timeline[index], state, admin_chat_log)
                            img.src = "icons/shield.png"
                            break;
                        case "Logger":
                            LoggerHandle(new_lines, tr, timeline[index])
                            img.src = "icons/log.png"
                            break;
                        case "Class change":
                            ClassChangeHandle(new_lines, tr, timeline[index], state, death_log)
                            img.src = "icons/swap.png"
                            break;
                        case "Warhead":
                            WarheadHandle(new_lines, tr, timeline[index])
                            img.src = "icons/nuclear-explosion.png"
                            break;
                        case "Networking":
                            NetworkingHandle(new_lines, tr, timeline[index])
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
                        if (tr.classList.contains("notable_death")) {
                            tr.classList.remove("notable_death")
                        }
                        tr.classList.add("unusual_death")
                    }

                    //TODO: Jeśli ktoś zmienił nick to zapisz w tablicy
                    // let regmatch = REGEX_ID_to_username.exec(new_lines[4])
                    // if (regmatch != null) {
                    //     UserID_assoc[regmatch[1]] = regmatch[2]
                    // }

                    tbody.appendChild(tr)
                }


            });
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
                monitored_users.UserID.forEach(element => {
                    if (element == userID) {
                        alert(`Monitored user ${Nickname} (${userID}) was found`)
                    }
                })
            }
            for (const [IPaddress, userID] of Object.entries(IPaddress_assoc)) {
                monitored_users.IPaddress.forEach(element => {
                    let DatabaseIP = REGEX_IPaddress_split.exec(element)
                    let PlayerIP = REGEX_IPaddress_split.exec(IPaddress)
                    if (DatabaseIP != null && PlayerIP != null) {
                        let db_IP = Number(DatabaseIP[1]).toString(2).padStart(8, '0') + Number(DatabaseIP[2]).toString(2).padStart(8, '0') + Number(DatabaseIP[3]).toString(2).padStart(8, '0') + Number(DatabaseIP[4]).toString(2).padStart(8, '0')
                        let player_IP = Number(PlayerIP[1]).toString(2).padStart(8, '0') + Number(PlayerIP[2]).toString(2).padStart(8, '0') + Number(PlayerIP[3]).toString(2).padStart(8, '0') + Number(PlayerIP[4]).toString(2).padStart(8, '0')
                        if (DatabaseIP.groups.CIDR != undefined) { // if no CIDR just compare
                            player_IP = player_IP.slice(0, Number(DatabaseIP.groups.CIDR)).padEnd(32, '0')
                            db_IP = db_IP.slice(0, Number(DatabaseIP.groups.CIDR)).padEnd(32, '0')

                        }
                        if (db_IP == player_IP) {
                            alert(`Monitored user ${UserID_assoc[userID]} (${IPaddress_assoc[IPaddress]}) [${IPaddress}] [${element}] was found`)
                        }
                    }
                    else {
                        throw new Error(`Unable to split network address ${element}`);
                    }
                })
            }

            if (progressbar_current == this.files.length) {
                console.debug('ready to display')
                for (const [index, article] of Object.entries(article_array)) {
                    if (Number(index) == 0) {
                        article.setAttribute('class', 'selected')
                    }
                    window.document.getElementsByTagName('main')[0].appendChild(article)
                }
                window.document.getElementById('progress_bar').setAttribute('max', (this.files.length).toString())
                window.document.getElementById('progress_bar').setAttribute('value', (progressbar_current).toString())
            }
        }, { once: true })
        filereader.readAsText(file)
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
 * @param {Timeline} timeline
 * @param {{ respawn_in_progress: boolean; is_broadcasting: boolean; }} state
 * @param {HTMLSpanElement} death_log 
 */
function ClassChangeHandle(new_lines, tr, timeline, state, death_log) {
    // tr.classList.add("notable_death")

    //HIGH PRIORITY

    //DETONACJA WARHEAD
    let regmatch = REGEX_warhead_death.exec(new_lines[4])
    if (regmatch != null) {
        let det_keyframe = timeline.FindNewestEventType('warhead_detonated')
        DeathLogAttacher(death_log, `${regmatch[1]} (${regmatch[2]}) died to Alpha Warhead`)
        timeline.BackPropagatePlayerRole(regmatch[1], regmatch[2])
        timeline.AddPlayer(det_keyframe, regmatch[1], 'Spectator')

        tr.classList.add("notable_death")
        return
    }

    //LOW PRIORITY

    //KTOŚ KOGOŚ ZABIŁ
    regmatch = REGEX_direct_kill.exec(new_lines[4])
    if (regmatch != null) {
        let current_keyframe = timeline.NewKeyFrame(new_lines[1], 'kill')

        DeathLogAttacher(death_log, `${regmatch[3]} (${regmatch[4]}) killed ${regmatch[1]} (${regmatch[2]}) [${regmatch[5]}]`)

        timeline.BackPropagatePlayerRole(regmatch[1], regmatch[2])
        timeline.BackPropagatePlayerRole(regmatch[3], regmatch[4])
        timeline.AddPlayer(current_keyframe, regmatch[1], 'Spectator')
        timeline.AddKiller(current_keyframe, regmatch[3])

        if (Role.IsSCP(timeline.TranslateToInternal(regmatch[2])) || (Role.IsCivilian(timeline.TranslateToInternal(regmatch[2])) && !Role.IsSCP(timeline.TranslateToInternal(regmatch[4])))) {
            tr.classList.add("notable_death")
        }
        return;
    }

    //SAMOBÓJ
    regmatch = REGEX_suicide.exec(new_lines[4])
    if (regmatch != null) {
        let current_keyframe = timeline.NewKeyFrame(new_lines[1], 'suicide')

        DeathLogAttacher(death_log, `${regmatch[1]} (${regmatch[2]}) commited suicide [${regmatch[3]}]`)

        timeline.BackPropagatePlayerRole(regmatch[1], regmatch[2])
        timeline.AddPlayer(current_keyframe, regmatch[1], 'Spectator')
        if (Role.IsSCP(timeline.TranslateToInternal(regmatch[2]))) {
            tr.classList.add("notable_death")
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
            DeathLogAttacher(death_log, `${regmatch.groups.victim} (${regmatch.groups.role}) commited suicide [${regmatch[3]}]`)
        }
        else if (regmatch.groups.reason.search(REGEX_recontained) != -1) {
            captured = true
            timeline.EditKeyFrameEvent(current_keyframe, 'kill')
            DeathLogAttacher(death_log, `${regmatch.groups.victim} (${regmatch.groups.role}) has been recontained`)
        }
        else if (regmatch.groups.reason.search(REGEX_Decayed) != -1) {
            captured = true
            timeline.EditKeyFrameEvent(current_keyframe, 'kill')
            DeathLogAttacher(death_log, `${regmatch.groups.victim} (${regmatch.groups.role}) ${regmatch.groups.reason}`)
        }
        else {
            captured = true
            timeline.EditKeyFrameEvent(current_keyframe, 'unknown')
            console.warn(`unknown kill reason "${regmatch.groups.reason}"`)
            DeathLogAttacher(death_log, `${regmatch.groups.victim} (${regmatch.groups.role}) [${regmatch[3]}]`)
        }

        timeline.BackPropagatePlayerRole(regmatch[1], regmatch[2])
        timeline.AddPlayer(current_keyframe, regmatch[1], 'Spectator')
        if (Role.IsSCP(timeline.TranslateToInternal(regmatch[2]))) {
            tr.classList.add("notable_death")
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

        DeathLogAttacher(death_log, `${regmatch[3]} (${regmatch[4]}) killed ${regmatch[1]} (${regmatch[2]}) [${regmatch[5]}]`)

        timeline.BackPropagatePlayerRole(regmatch[1], regmatch[2])
        timeline.BackPropagatePlayerRole(regmatch[3], regmatch[4])
        timeline.AddPlayer(current_keyframe, regmatch[1], 'Spectator')
        timeline.AddKiller(current_keyframe, regmatch[3])
        if (Role.IsSCP(timeline.TranslateToInternal(regmatch[2])) || (Role.IsCivilian(timeline.TranslateToInternal(regmatch[2])) && !Role.IsSCP(timeline.TranslateToInternal(regmatch[4])))) {
            tr.classList.add("notable_death")
        }
        return;
    }

    //SPAWN WAVE 1/2
    regmatch = REGEX_Respawned_as.exec(new_lines[4])
    if (regmatch != null) {
        DeathLogAttacher(death_log, `${regmatch[1]} spawned as ${regmatch[2]}`)
        if (!state.respawn_in_progress) { // Oznacz proces respawnu
            let current_keyframe = timeline.NewKeyFrame(null, 'spawn_wave')
            timeline.AddPlayer(current_keyframe, regmatch[1], regmatch[2])
            state.respawn_in_progress = true
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
        state.respawn_in_progress = false
        tr.classList.add("notable_death")
        return;
    }
    //FORCE CLASS
    regmatch = REGEX_class_change.exec(new_lines[4])
    if (regmatch != null) {
        let current_keyframe = timeline.NewKeyFrame(new_lines[1], 'force_class')
        timeline.AddPlayer(current_keyframe, regmatch[2], regmatch[3])
        return;

    }
    console.error(`Could not parse Change class event.: ${new_lines[4]}`)
    // throw new Error(`Could not parse Change class event.: ${new_lines[4]}`)
}

/**
 * @param {string[]} new_lines
 * @param {HTMLTableRowElement} tr
 */
function LoggerHandle(new_lines, tr, timeline) {
    tr.classList.add("logger_event")
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
 * @param {Timeline} timeline
 * @param {HTMLSpanElement} admin_chat_log
 * @param {{ respawn_in_progress: boolean; is_broadcasting: boolean; }} state
 */
function AdministativeHandle(new_lines, tr, timeline, state, admin_chat_log) {
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
    regmatch = REXEX_broadcast_text.exec(new_lines[4])
    if (regmatch != null) {
        state.is_broadcasting = true
        return
    }

    // throw new Error(`Could not parse Administrative event.: ${new_lines[4]}`)
}
/**
 * 
 * @param {HTMLSpanElement} death_log 
 * @param {string} death_log_text 
 */
function DeathLogAttacher(death_log, death_log_text) {
    death_log.appendChild(window.document.createTextNode(death_log_text))
    death_log.appendChild(window.document.createElement('br'))
    return
}

/**
 * @param {string[]} new_lines
 * @param {HTMLTableRowElement} tr
 * @param {Timeline} timeline 
 */
function WarheadHandle(new_lines, tr, timeline) {
    tr.classList.add("warhead_event")
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
 * @param {Timeline} timeline 
 */
function NetworkingHandle(new_lines, tr, timeline) {
    let regmatch = REGEX_networking_ignore.exec(new_lines[4])
    if (regmatch != null) {
        return
    }

    regmatch = REGEX_ID_to_username.exec(new_lines[4])
    if (regmatch != null) {
        UserID_assoc[regmatch[1]] = regmatch[2]
        return
    }

    regmatch = REGEX_preauth.exec(new_lines[4])
    if (regmatch != null) {
        //TODO: ALT DETECTION
        IPaddress_assoc[regmatch.groups.IPaddress] = regmatch.groups.UserID
        return
    }
    regmatch = REGEX_disconnect.exec(new_lines[4])
    if (regmatch != null) {
        timeline.BackPropagatePlayerRole(regmatch.groups.user, regmatch.groups.role)
        return;
    }
    throw new Error(`Could not parse Networking event.: ${new_lines[4]}`)
}
