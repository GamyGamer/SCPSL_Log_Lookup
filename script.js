//@ts-check
let version = "0.3.3"
let indev = false


/*
    Tytuł projektu: SCP:SL LOG PARSER
    Cel projektu: Przetwarzanie logów rund serwera SCP:SL w celu łatwego podglądu
    Autor: GamyGamer (306161751077158933)

    TODO:
        - Przenieść state do klasy Timeline
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
class Role {
    static Aligments = {
        SCP: ["Scp173", "Scp106", "Scp049", "Scp079", "Scp096", "Scp0492", "Scp939", "Scp3114"],
        Foundation: ["NtfSpecialist", "NtfSergeant", "NtfCaptain", "NtfPrivate", "FacilityGuard", "Scientist"],
        Chaos: ["ChaosConscript", "ChaosRifleman", "ChaosMarauder", "ChaosRepressor", "ClassD"],
        Misc: ["Spectator", "Overwatch", "Filmmaker", "Tutorial"]
    }
    static Military = ["NtfSpecialist", "NtfSergeant", "NtfCaptain", "NtfPrivate", "FacilityGuard", "ChaosConscript", "ChaosRifleman", "ChaosMarauder", "ChaosRepressor"];
    static Civilian = ["Scientist", "ClassD"]
    static role_dictonary = {
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
        "Scientist": "Scientist",
        "ClassD": "Class-D Personnel",
        "Spectator": "Spectator",
        "Overwatch": "Overwatch",
        "Filmmaker": "Filmmaker",
        "Tutorial": "Tutorial",
        "Destroyed": "Destroyed"
    }
    static Order = ["Scp173", "Scp106", "Scp049", "Scp079", "Scp096", "Scp0492", "Scp939", "Scp3114", "NtfSpecialist", "NtfSergeant", "NtfCaptain", "NtfPrivate", "FacilityGuard", "ChaosConscript", "ChaosRifleman", "ChaosMarauder", "ChaosRepressor", "Scientist", "ClassD", "Spectator", "None", "Overwatch", "Filmmaker", "Tutorial"]
    /**
     * @param {string} Role
     * @returns {boolean}
     */
    static IsCivilian(Role) {
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
    static IsSCP(Role) {
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
    state = {
        respawn_in_progress: false,
        multiline_message: false
    }
    constructor() {
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
     * @param {string} role
     * @returns {string} 
     */
    TranslateToInternal(role) {
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
     * 
     * @param {string} role 
     */
    FindPlayerWithRole(role = undefined) {
        if (role == undefined) {
            throw new Error("Role is undefined");
        }
        for (const [playerID, playerRole] of Object.entries(this.keyframe[0].player)) {
            if (playerRole == role) {
                return playerID;
            }
        }
        return null;


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
let UserID_assoc = new Object();
let IPaddress_assoc = new Object();
const article_array = new Object();


/**
 * @this {HTMLLIElement}
 */
function FileSelector() {
    this.parentElement.childNodes.forEach(element => {
        if (/**@type {HTMLLIElement} */ (element).getAttribute('class') != null) {
            /**@type {HTMLLIElement} */ (element).removeAttribute('class')
        }
    });
    this.setAttribute('class', 'selected')
    let index = 0;
    let currentItem = this
    while (currentItem.previousSibling) {
        currentItem = /**@type {HTMLLIElement} */ (currentItem.previousSibling)
        index++
    }
    console.log(index)
    const main = window.document.getElementsByTagName('main')[0]
    main.getElementsByClassName('selected')[0].removeAttribute('class')

    main.children[index].setAttribute('class', 'selected')
    //TODO: HIDE AND SELECT
}
window.document.getElementById('test').addEventListener('click', SelectPlayer)

function CreateBadges() {
    const spectator_viewer = window.document.getElementById('spectator_badges')
    spectator_viewer.innerHTML = ''
    //DOM CREATION
    for (const [UserID, Current_Role] of Object.entries(timeline[0].keyframe[0].player)) {
        const badge = window.document.createElement('div');
        const image = window.document.createElement('img');
        const nickname = window.document.createElement('span');
        const role = window.document.createElement('span')


        badge.classList.add('spectator_badge')
        badge.classList.add(Current_Role)
        badge.setAttribute('userid', UserID);
        nickname.classList.add('nickname')
        role.classList.add('role')

        nickname.innerText = UserID_assoc[UserID]

        badge.appendChild(image)
        badge.appendChild(nickname)
        badge.appendChild(role)
        badge.addEventListener('click', SelectPlayer)
        spectator_viewer.appendChild(badge)
    }

}


/**
 * @this {HTMLDivElement}
 */
function SelectPlayer() {
    let userID = this.getAttribute('userid');
    let username = UserID_assoc[userID];

    window.document.getElementById('userinfo').children['nickname'].innerText = username;
    window.document.getElementById('userinfo').children['playerid'].innerText = '2';
    window.document.getElementById('userinfo').children['ipaddress']
    window.document.getElementById('userinfo').children['userid'].innerText = userID;
    window.document.getElementById('userinfo').children['class'].innerText = this.classList[1]
}

/**
 * @this {HTMLInputElement}
 */
function MakeTimeLine() {
    window.document.getElementById('progress_bar').style.display = 'block'
    window.document.getElementById('welcome').style.display = 'none'
    window.document.getElementById('log_select').innerHTML = ''
    window.document.getElementsByTagName('main')[0].innerHTML = ''
    for (let index = 0; index < this.files.length; index++) { // Generate file selector
        const li = window.document.createElement('li')
        // li.id=`file_selector_${index}` // 
        li.addEventListener("click", FileSelector)
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
        filereader.addEventListener('load', () => { //WARNING: This is done in async way, note possible race conditions

            // DOM CREATION
            const article = window.document.createElement('article');

            const table3114 = window.document.createElement('table');
            // table3114.style.display='none'
            const tbody3114 = window.document.createElement('tbody');
            tbody3114.style.display = 'none'

            const table = window.document.createElement('table')
            const tbody = window.document.createElement('tbody')
            const death_log = window.document.createElement('span')
            const admin_chat_log = window.document.createElement('span')

            table.appendChild(tbody)

            table3114.appendChild(tbody3114)
            article.appendChild(table3114)
            const th3114 = window.document.createElement('th')
            th3114.colSpan = 2
            tbody3114.appendChild(th3114)

            article.appendChild(table)
            article.appendChild(death_log)

            article.appendChild(window.document.createElement('hr'))
            article.appendChild(admin_chat_log)
            article_array[index] = article;


            let state = { //TOFIX: somehow state can 'leak' into other files, issue found by getting an error in broadcast handler when no broadcast was present in specific file and yet it was marked
                respawn_in_progress: false,
                broadcast: false,
                is_3114_in_game: false,
                admin_chat: false,
            }
            let lines = new Array();
            /**
             * @type {RegExpExecArray}
             */
            let log_line;
            window.document.getElementById('progress_bar').setAttribute('value', (progressbar_current++).toString())
            timeline[index] = new Timeline();
            console.debug(index)
            // document.getElementById('output').textContent = filereader.result;

            if (typeof filereader.result === 'string') {
                lines = filereader.result.split('\n');
            }
            else {
                console.warn(typeof filereader.result)
                throw new Error("Something went horribly wrong (reading data as binary instead of text?)");
            }

            // const tbody = document.getElementById('table')
            tbody.innerHTML = ""
            lines.forEach(element => {
                if (element == "") {
                    return;
                }
                log_line = SLRegExp.SplitLogs.exec(element) // Dzięki śmieszkowi który wstawił do nicku '|' :DDDDDD (Pain) [Przynajmniej znalazłem błąd który nie przechwytywał końca rundy]
                if (log_line == null) {
                    console.log(index)
                    console.log(admin_chat_log)
                    if (element == "") {//If linesplit happened before message ended I have to edit last element
                        element = "\n"
                    }
                    if (state.broadcast) {

                        //article.table.tbody.[last tr].[last td].textContent
                        article.children[1].children[0].lastChild.lastChild.textContent += element
                        return
                    }
                    if (state.admin_chat) {
                        article.children[1].children[0].lastChild.lastChild.textContent += element
                        admin_chat_log.appendChild(window.document.createTextNode(`${element}`))
                        admin_chat_log.appendChild(document.createElement('br'))
                        return
                    }
                    throw new Error(`Error splitting ${element}`);
                }
                if (log_line.length != 5) {
                    throw new Error(`Error splitting ${element}`);
                }

                state.broadcast = false; // move to timeline
                state.admin_chat = false;

                {
                    log_line.groups["Timestamp"] = log_line.groups["Timestamp"].trim()
                    log_line.groups["Type"] = log_line.groups["Type"].trim()
                    log_line.groups["Module"] = log_line.groups["Module"].trim()
                    log_line.groups["Message"] = log_line.groups["Message"].trim()
                }

                for (let index = 0; index < log_line.length; index++) {
                    log_line[index] = log_line[index].trim(); // Remove leading spaces
                }
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                const img = document.createElement('img');


                switch (log_line.groups["Module"]) {
                    case "Administrative":
                        AdministativeHandle(log_line, state, admin_chat_log)
                        img.src = "icons/shield.png"
                        break;
                    case "Logger":
                    case "Game logic":
                        LoggerHandle(log_line, tr, timeline[index])
                        img.src = "icons/log.png"
                        break;
                    case "Class change":
                        ClassChangeHandle(log_line, tr, timeline[index], state, death_log, tbody3114)
                        img.src = "icons/swap.png"
                        break;
                    case "Warhead":
                        WarheadHandle(log_line, tr, timeline[index])
                        img.src = "icons/nuclear-explosion.png"
                        break;
                    case "Networking":
                        NetworkingHandle(log_line, timeline[index])
                        img.src = "icons/na.png"
                        break;
                    default:
                        console.info(`Module '${log_line.groups["Module"]}' requires implementation: ${log_line.groups["Message"]}`);
                        img.src = "icons/na.png"
                        break;
                }

                td.appendChild(img)
                tr.appendChild(td)
                for (let index = 1; index < 5; index++) { // Przepisz fragmenty z logów do odpowiednich komórek
                    const td = document.createElement('td');
                    td.textContent = log_line[index]
                    tr.appendChild(td)
                }
                if (SLRegExp.DeathReason.SCPIntentional.test(log_line.groups["Message"])) {
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

            });
            if (!(admin_chat_log.innerText == '')) {
                admin_chat_log.appendChild(window.document.createElement('hr'))
            }


            if (progressbar_current == this.files.length) {
                if (Settings.alert_mode) {
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
                            let DatabaseIP = SLRegExp.SplitIP.exec(element)
                            let PlayerIP = SLRegExp.SplitIP.exec(IPaddress)
                            if (DatabaseIP != null && PlayerIP != null) {
                                let db_IP = Number(DatabaseIP[1]).toString(2).padStart(8, '0') + Number(DatabaseIP[2]).toString(2).padStart(8, '0') + Number(DatabaseIP[3]).toString(2).padStart(8, '0') + Number(DatabaseIP[4]).toString(2).padStart(8, '0')
                                let player_IP = Number(PlayerIP[1]).toString(2).padStart(8, '0') + Number(PlayerIP[2]).toString(2).padStart(8, '0') + Number(PlayerIP[3]).toString(2).padStart(8, '0') + Number(PlayerIP[4]).toString(2).padStart(8, '0')
                                if (DatabaseIP.groups["CIDR"] != undefined) { // if no CIDR just compare
                                    player_IP = player_IP.slice(0, Number(DatabaseIP.groups["CIDR"])).padEnd(32, '0')
                                    db_IP = db_IP.slice(0, Number(DatabaseIP.groups["CIDR"])).padEnd(32, '0')

                                }
                                if (db_IP == player_IP) {
                                    for (let index = 0; index < userID.length; index++) {
                                        const element = userID[index];
                                        if (UserID_assoc[element] != undefined) {
                                            alert(`Monitored user ${UserID_assoc[element]} (${IPaddress_assoc[IPaddress]}) [${IPaddress}] [${element}] was found`) //TOFIX
                                            break
                                        }
                                    }
                                }
                            }
                            else {
                                throw new Error(`Unable to split network address ${element}`);
                            }
                        })
                        if (userID.length > 1) {
                            alert(`Multiple accounts detected from IP ${IPaddress}: ${userID}`)
                        }
                    }
                }
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

window.addEventListener('error', () => {
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
 * @param {HTMLSpanElement} death_log
 * @param {HTMLTableSectionElement} tbody3114
 * @param {{ respawn_in_progress: boolean; is_broadcasting?: boolean; is_3114_in_game?: boolean; }} state
 */
function ClassChangeHandle(new_lines, tr, timeline, state, death_log, tbody3114) {
    // tr.classList.add("notable_death")

    //HIGH PRIORITY


    /**
     * @type {RegExpExecArray}
     */
    //DETONACJA WARHEAD
    let regmatch
    if (SLRegExp.ClassChange.Ignore.test(new_lines[4])) {
        console.debug(`Ignored ${new_lines[4]}`)
        return
    }

    if (regmatch = SLRegExp.ClassChange.Warhead.exec(new_lines[4])) {
        let det_keyframe = timeline.FindNewestEventType('warhead_detonated')
        DeathLogAttacher(death_log, `${regmatch[1]} (${regmatch[2]}) died to Alpha Warhead`)
        timeline.BackPropagatePlayerRole(regmatch[1], regmatch[2])
        timeline.AddPlayer(det_keyframe, regmatch[1], 'Spectator')

        tr.classList.add("notable_death")
        return
    }

    //LOW PRIORITY

    //KTOŚ KOGOŚ ZABIŁ
    if (regmatch = SLRegExp.ClassChange.DirectKill.exec(new_lines[4])) {
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
    if (regmatch = SLRegExp.ClassChange.Suicide.exec(new_lines[4])) {
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
    if (regmatch = SLRegExp.ClassChange.SingleKill.exec(new_lines[4])) {
        console.debug(regmatch)
        let captured = false
        let current_keyframe = timeline.NewKeyFrame(new_lines[1])

        if (SLRegExp.DeathReason.Suicide.test(regmatch.groups["Reason"])) {
            captured = true
            timeline.EditKeyFrameEvent(current_keyframe, 'suicide')
            DeathLogAttacher(death_log, `${regmatch.groups["UserID"]} (${regmatch.groups["UserRole"]}) commited suicide [${regmatch[3]}]`)
        }
        else if (SLRegExp.DeathReason.Recontained.test(regmatch.groups["Reason"])) {
            captured = true
            timeline.EditKeyFrameEvent(current_keyframe, 'kill')
            DeathLogAttacher(death_log, `${regmatch.groups["UserID"]} (${regmatch.groups["UserRole"]}) has been recontained`)
        }
        else if (SLRegExp.DeathReason.Decayed.test(regmatch.groups["Reason"])) {
            captured = true
            timeline.EditKeyFrameEvent(current_keyframe, 'kill')
            DeathLogAttacher(death_log, `${regmatch.groups["UserID"]} (${regmatch.groups["UserRole"]}) ${regmatch.groups["Reason"]}`)
        }
        else {
            captured = true
            timeline.EditKeyFrameEvent(current_keyframe, 'unknown')
            console.error(`unknown kill reason "${regmatch.groups["Reason"]}"`)
            DeathLogAttacher(death_log, `${regmatch.groups["UserID"]} (${regmatch.groups["UserRole"]}) [${regmatch[3]}]`)
        }

        timeline.BackPropagatePlayerRole(regmatch[1], regmatch[2])
        timeline.AddPlayer(current_keyframe, regmatch[1], 'Spectator')
        if (Role.IsSCP(timeline.TranslateToInternal(regmatch[2]))) {
            tr.classList.add("notable_death")
        }
        if (!captured) {
            throw new Error(`Single kill death was not captured "${regmatch.groups["Reason"]}"`);
        }
        return;
    }

    //TEAMKILL
    if (regmatch = SLRegExp.ClassChange.TeamKill.exec(new_lines[4])) {
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
    if (regmatch = SLRegExp.ClassChange.RespawnAs.exec(new_lines[4])) {
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
    if (regmatch = SLRegExp.ClassChange.RespawnManager.exec(new_lines[4])) {
        timeline.keyframe[timeline.FindNewestEventType('spawn_wave')].timestamp = new_lines[1]
        state.respawn_in_progress = false
        tr.classList.add("notable_death")
        return;
    }
    //FORCE CLASS
    if (regmatch = SLRegExp.ClassChange.ForceClass.exec(new_lines[4])) {
        let current_keyframe = timeline.NewKeyFrame(new_lines[1], 'force_class')
        timeline.AddPlayer(current_keyframe, regmatch[2], regmatch[3])
        return;
    }
    if (regmatch = SLRegExp.ClassChange.Skeleton.DisguiseSet.exec(new_lines[4])) {
        if (!state.is_3114_in_game) {
            const Player3114 = timeline.FindPlayerWithRole("Scp3114")
            tbody3114.firstChild.textContent = `Szkieletem jest ${UserID_assoc[Player3114]} (${Player3114})`
            tbody3114.style.display = 'inherit'
            if (Player3114 != null) {
                state.is_3114_in_game = true
            }
        }
        console.log(tbody3114)
        const tr = window.document.createElement('tr')
        const td_time = window.document.createElement('td')
        td_time.textContent = new_lines[1];
        const td_text = window.document.createElement('td')
        td_text.textContent = new_lines[4];
        tr.appendChild(td_time)
        tr.appendChild(td_text);
        tbody3114.appendChild(tr)
        return;
    }
    if (regmatch = SLRegExp.ClassChange.Skeleton.DisguiseDrop.exec(new_lines[4])) {
        if (!state.is_3114_in_game) {
            const Player3114 = timeline.FindPlayerWithRole("Scp3114")
            tbody3114.firstChild.textContent = `Szkieletem jest ${UserID_assoc[Player3114]} (${Player3114})`
            tbody3114.style.display = 'inherit'
            if (Player3114 != null) {
                state.is_3114_in_game = true
            }
        }
        const tr = window.document.createElement('tr')
        const td_time = window.document.createElement('td')
        td_time.textContent = new_lines[1];
        const td_text = window.document.createElement('td')
        td_text.textContent = new_lines[4];
        tr.appendChild(td_time)
        tr.appendChild(td_text);
        tbody3114.appendChild(tr);
        return;
    }
    if (Settings.strict_mode) {
        throw new Error(`Could not parse Change class event.: ${new_lines[4]}`)
    }
    else {
        console.warn(`Could not parse Change class event.: ${new_lines[4]}`)
    }
}

/**
 * @param {string[]} new_lines
 * @param {HTMLTableRowElement} tr
 */
function LoggerHandle(new_lines, tr, timeline) {
    tr.classList.add("logger_event")
    if (new_lines[4].search(SLRegExp.Logger.Ignore) != -1) {
        console.debug(`Ignored ${new_lines[4]}`)
        return
    }

    if (SLRegExp.Logger.RoundStart.test(new_lines[4])) {
        timeline.keyframe[timeline.FindNewestEventType('round_start')].timestamp = new_lines[1];
        return
    }
    if (SLRegExp.Logger.RoundFinish.test(new_lines[4])) {
        timeline.NewKeyFrame(new_lines[1], 'round_finish')
        return
    }
    if (Settings.strict_mode) {
        throw new Error(`Could not parse Logger event.: ${new_lines[4]}`)
    }
    else {
        console.warn(`Could not parse Logger event.: ${new_lines[4]}`)
    }
}

/**
 * @param {string[]} new_lines
 * @param {HTMLSpanElement} admin_chat_log
 * @param {{ respawn_in_progress: boolean; broadcast: boolean; admin_chat:boolean }} state
 */
function AdministativeHandle(new_lines, state, admin_chat_log) {
    /**
     * @type {RegExpExecArray}
     */
    let regmatch
    if (SLRegExp.Administrative.LobbyLock.test(new_lines[4]) || SLRegExp.Administrative.RoundLock.test(new_lines[4])) {
        console.debug(`Ignored ${new_lines[4]}`)
        return
    }

    if (regmatch = SLRegExp.Administrative.AdminChat.exec(new_lines[4])) {
        const admin_name = window.document.createElement('span')
        const admin_message = window.document.createTextNode(`: ${regmatch[3]}`)

        admin_name.className = 'admin_chat'
        admin_name.innerText = regmatch[1]
        admin_chat_log.appendChild(admin_name)
        admin_chat_log.appendChild(admin_message)
        admin_chat_log.appendChild(document.createElement('br'))
        state.admin_chat = true
        return
    }
    if (regmatch = SLRegExp.Administrative.Broadcast.exec(new_lines[4])) {
        state.broadcast = true
        return
    }
    if (Settings.strict_mode) {
        throw new Error(`Could not parse Administrative event.: ${new_lines[4]}`)
    }
    else {
        console.warn(`Could not parse Administrative event.: ${new_lines[4]}`)
    }

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
    if (SLRegExp.Warhead.CountdownStart.test(new_lines[4])) {
        timeline.NewKeyFrame(new_lines[1], 'warhead_countdown_start')
        return
    }
    if (SLRegExp.Warhead.CountdownPaused.test(new_lines[4])) {
        timeline.NewKeyFrame(new_lines[1], 'warhead_countdown_paused')
        return
    }
    if (SLRegExp.Warhead.Detonated.test(new_lines[4])) {
        timeline.NewKeyFrame(new_lines[1], 'warhead_detonated')
        return
    }
    if (Settings.strict_mode) {
        throw new Error(`Could not parse Warhead event.: ${new_lines[4]}`)
    }
    else {
        console.warn(`Could not parse Warhead event.: ${new_lines[4]}`)
    }
}

/**
 * @param {string[]} new_lines
 * @param {Timeline} timeline 
 */
function NetworkingHandle(new_lines, timeline) {
    /**
     * @type {RegExpExecArray}
     */
    let regmatch

    if (regmatch = SLRegExp.Networking.Ignore.exec(new_lines[4])) {
        console.debug(`Ignored ${new_lines[4]}`)
        return
    }

    if (regmatch = SLRegExp.Networking.Nickname.exec(new_lines[4])) {
        UserID_assoc[regmatch[1]] = regmatch[2]
        return
    }

    if (regmatch = SLRegExp.Networking.Preauth.exec(new_lines[4])) {
        //TODO: ALT DETECTION
        if (IPaddress_assoc[regmatch.groups["IPaddress"]] === undefined) {
            IPaddress_assoc[regmatch.groups["IPaddress"]] = new Array()
        }
        for (let index = 0; index < IPaddress_assoc[regmatch.groups["IPaddress"]].length; index++) {
            const element = IPaddress_assoc[regmatch.groups["IPaddress"]][index];
            if (element == regmatch.groups["UserID"]) {
                return // If user already exists, do not append
            }
        }

        IPaddress_assoc[regmatch.groups["IPaddress"]].push(regmatch.groups["UserID"])
        return
    }
    if (regmatch = SLRegExp.Networking.Disconnect.exec(new_lines[4])) {
        if (regmatch.groups["Role"] == "Destroyed") {
            return;
        }
        timeline.BackPropagatePlayerRole(regmatch.groups["UserID"], regmatch.groups["Role"])
        return;
    }
    if (Settings.strict_mode) {
        throw new Error(`Could not parse Networking event.: ${new_lines[4]}`)
    }
    else {
        console.warn(`Could not parse Networking event.: ${new_lines[4]}`)
    }
}