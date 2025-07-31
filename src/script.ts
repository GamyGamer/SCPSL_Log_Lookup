import './style.css';
import './roles.css';
import { Icon } from './icons';
import { SLRegExp } from './regex_rules';
import { Settings } from './settings';
import { Role } from './role';
import { Timeline } from './timeline';
import './super_secret_settings';


let version = "0.3.4-ts002"
let indev = true
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

let timeline: Array<Timeline> = new Array();
let UserID_assoc: Map<string, string> = new Map();
let IPaddress_assoc: Map<string, Array<string>> = new Map();
const article_array: Array<HTMLElement> = new Array();


function FileSelector(this: HTMLLIElement) {
    (<HTMLElement>this.parentElement).childNodes.forEach(element => {
        if ((<HTMLLIElement>element).getAttribute('class') != null) {
            (<HTMLLIElement>element).removeAttribute('class')
        }
    });
    this.setAttribute('class', 'selected')
    let index = 0;
    let currentItem = this
    while (currentItem.previousSibling) {
        currentItem = (<HTMLLIElement>currentItem.previousSibling)
        index++
    }
    console.log(index)
    const main = window.document.getElementsByTagName('main')[0]!
    main.getElementsByClassName('selected')[0]!.removeAttribute('class')

    main.children[index]?.setAttribute('class', 'selected')
    //TODO: HIDE AND SELECT
}

function CreateBadges() {
    const spectator_viewer = window.document.getElementById('spectator_badges')!
    spectator_viewer.innerHTML = ''
    //DOM CREATION
    for (const [UserID, Current_Role] of Object.entries(timeline[0].keyframe[0].player)) {
        const badge = window.document.createElement('div');
        const image = window.document.createElement('img');
        const nickname = window.document.createElement('span');
        const role = window.document.createElement('span');
        const nicknameText = UserID_assoc.get(UserID)

        badge.classList.add('spectator_badge')
        badge.classList.add(<string>Current_Role)
        badge.setAttribute('userid', UserID);
        nickname.classList.add('nickname')
        role.classList.add('role')

        if (nicknameText == undefined) {
            throw new Error("A");

        }
        nickname.innerText = nicknameText
        badge.appendChild(image)
        badge.appendChild(nickname)
        badge.appendChild(role)
        badge.addEventListener('click', SelectPlayer)
        spectator_viewer.appendChild(badge)
    }

}

function SelectPlayer(this: HTMLDivElement) {
    let userID = this.getAttribute('userid');
    if (!userID) throw new Error("Selected Badge doesn't have userID assigned to it");
    let username = UserID_assoc.get(userID);
    if (!username) throw new Error(`There is no nickname associated with UserID ${userID}`);


    (<HTMLSpanElement>window.document.getElementById('userinfo')?.children.namedItem('nickname')).innerText = username;
    (<HTMLSpanElement>window.document.getElementById('userinfo')?.children.namedItem('playerid')).innerText = '2';
    (<HTMLSpanElement>window.document.getElementById('userinfo')?.children.namedItem('ipaddress')).innerText = '';
    (<HTMLSpanElement>window.document.getElementById('userinfo')?.children.namedItem('userid')).innerText = userID;
    (<HTMLSpanElement>window.document.getElementById('userinfo')?.children.namedItem('class')).innerText = this.classList[1]!
}

function MakeTimeLine(this: HTMLInputElement) {
    window.document.getElementById('progress_bar')!.style.display = 'block';
    window.document.getElementById('welcome')!.style.display = 'none';
    window.document.getElementById('log_select')!.innerHTML = '';
    window.document.getElementsByTagName('main')[0]!.innerHTML = ''

    if (this.files == null) {
        throw new Error("There was an error while loading files");
    }
    for (let index = 0; index < this.files.length; index++) { // Generate file selector
        const li = window.document.createElement('li')
        // li.id=`file_selector_${index}` // 
        li.addEventListener("click", FileSelector)
        li.innerText = `${this.files[index].name}`
        if (index == 0) {
            li.className = 'selected'
        }
        window.document.getElementById('log_select')?.appendChild(li);
    }
    timeline = new Array();
    console.clear()
    UserID_assoc.clear()
    IPaddress_assoc.clear()
    let progressbar_current = 0
    window.document.getElementById('progress_bar')?.setAttribute('max', (this.files.length - 1).toString())

    for (const [index, file] of (<Array<[number, File]>><Array<[unknown, File]>>Object.entries(this.files))) {
        console.log(`${index}: ${file}`)
        let filereader = new FileReader();
        filereader.addEventListener('load', () => { //WARNING: This is done in async way, note possible race conditions

            // DOM CREATION>
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
            let log_line: SLRegExp | null;
            window.document.getElementById('progress_bar')?.setAttribute('value', (progressbar_current++).toString())
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
                log_line = <SLRegExp>SLRegExp.SplitLogs.exec(element) // Dzięki śmieszkowi który wstawił do nicku '|' :DDDDDD (Pain) [Przynajmniej znalazłem błąd który nie przechwytywał końca rundy]
                if (log_line == null) {
                    console.log(index)
                    console.log(admin_chat_log)
                    if (element == "") {//If linesplit happened before message ended I have to edit last element
                        element = "\n"
                    }
                    if (state.broadcast) {

                        //article.table.tbody.[last tr].[last td].textContent
                        (<HTMLTableCellElement>(<HTMLTableRowElement>article.children[1].children[0].lastChild).lastChild).textContent += element;
                        return
                    }
                    if (state.admin_chat) {
                        (<HTMLTableCellElement>(<HTMLTableRowElement>article.children[1].children[0].lastChild).lastChild).textContent += element;
                        admin_chat_log.appendChild(window.document.createTextNode(`${element}`));
                        admin_chat_log.appendChild(document.createElement('br'));
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
                        img.src = Icon.Administrative
                        break;
                    case "Logger":
                    case "Game logic":
                        LoggerHandle(log_line, tr, timeline[index])
                        img.src = Icon.Log
                        break;
                    case "Class change":
                        ClassChangeHandle(log_line, tr, timeline[index], state, death_log, tbody3114)
                        img.src = Icon.Swap
                        break;
                    case "Warhead":
                        WarheadHandle(log_line, tr, timeline[index])
                        img.src = Icon.Warhead
                        break;
                    case "Networking":
                        NetworkingHandle(log_line, timeline[index])
                        img.src = Icon.NA
                        break;
                    default:
                        console.info(`Module '${log_line.groups["Module"]}' requires implementation: ${log_line.groups["Message"]}`);
                        img.src = Icon.NA
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


            if (progressbar_current == this.files?.length) {
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
                            let DatabaseIP = <SLRegExp | null>SLRegExp.SplitIP.exec(element)
                            let PlayerIP = <SLRegExp | null>SLRegExp.SplitIP.exec(IPaddress)
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
                                        if (UserID_assoc.get(element) != undefined) {
                                            alert(`Monitored user ${UserID_assoc.get(element)} (${IPaddress_assoc.get(IPaddress)}) [${IPaddress}] [${element}] was found`) //TOFIX
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
                window.document.getElementById('progress_bar')?.setAttribute('max', (this.files.length).toString())
                window.document.getElementById('progress_bar')?.setAttribute('value', (progressbar_current).toString())
            }
        }, { once: true })
        filereader.readAsText(file)
    }
}

function ClassChangeHandle(new_lines: string[], tr: HTMLTableRowElement, timeline: Timeline, state: { respawn_in_progress: boolean; is_broadcasting?: boolean; is_3114_in_game?: boolean; }, death_log: HTMLSpanElement, tbody3114: HTMLTableSectionElement) {
    // tr.classList.add("notable_death")

    //HIGH PRIORITY
    let regmatch: SLRegExp
    if (SLRegExp.ClassChange.Ignore.test(new_lines[4])) {
        console.debug(`Ignored ${new_lines[4]}`)
        return
    }

    if (regmatch = <SLRegExp>SLRegExp.ClassChange.Warhead.exec(new_lines[4])) {
        let det_keyframe = timeline.FindNewestEventType('warhead_detonated')
        DeathLogAttacher(death_log, `${regmatch[1]} (${regmatch[2]}) died to Alpha Warhead`)
        timeline.BackPropagatePlayerRole(regmatch[1], regmatch[2])
        timeline.AddPlayer(det_keyframe, regmatch[1], 'Spectator')

        tr.classList.add("notable_death")
        return
    }

    //LOW PRIORITY

    //KTOŚ KOGOŚ ZABIŁ
    if (regmatch = <SLRegExp>SLRegExp.ClassChange.DirectKill.exec(new_lines[4])) {
        let current_keyframe = timeline.NewKeyFrame(new_lines[1], 'kill')

        DeathLogAttacher(death_log, `${regmatch[3]} (${regmatch[4]}) killed ${regmatch[1]} (${regmatch[2]}) [${regmatch[5]}]`)

        timeline.BackPropagatePlayerRole(regmatch[1], regmatch[2])
        timeline.BackPropagatePlayerRole(regmatch[3], regmatch[4])
        timeline.AddPlayer(current_keyframe, regmatch[1], 'Spectator')
        timeline.AddKiller(current_keyframe, regmatch[3])

        if (Role.IsSCP(Role.TranslateToInternal(regmatch[2])) || (Role.IsCivilian(Role.TranslateToInternal(regmatch[2])) && !Role.IsSCP(Role.TranslateToInternal(regmatch[4])))) {
            tr.classList.add("notable_death")
        }
        return;
    }

    //SAMOBÓJ
    if (regmatch = <SLRegExp>SLRegExp.ClassChange.Suicide.exec(new_lines[4])) {
        let current_keyframe = timeline.NewKeyFrame(new_lines[1], 'suicide')

        DeathLogAttacher(death_log, `${regmatch[1]} (${regmatch[2]}) commited suicide [${regmatch[3]}]`)

        timeline.BackPropagatePlayerRole(regmatch.groups['UserID'], regmatch.groups['UserRole'])
        timeline.AddPlayer(current_keyframe, regmatch.groups['UserID'], 'Spectator')
        if (Role.IsSCP(Role.TranslateToInternal(regmatch.groups['UserRole']))) {
            tr.classList.add("notable_death")
        }
        return;
    }
    //ZABÓJSTWO BEZ OSOBY ZABIJAJĄCEJ // TODO / TOFIX
    if (regmatch = <SLRegExp>SLRegExp.ClassChange.SingleKill.exec(new_lines[4])) {
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
        if (Role.IsSCP(Role.TranslateToInternal(regmatch[2]))) {
            tr.classList.add("notable_death")
        }
        if (!captured) {
            throw new Error(`Single kill death was not captured "${regmatch.groups["Reason"]}"`);
        }
        return;
    }

    //TEAMKILL
    if (regmatch = <SLRegExp>SLRegExp.ClassChange.TeamKill.exec(new_lines[4])) {
        let current_keyframe = timeline.NewKeyFrame(new_lines[1], 'kill')

        DeathLogAttacher(death_log, `${regmatch[3]} (${regmatch[4]}) killed ${regmatch[1]} (${regmatch[2]}) [${regmatch[5]}]`)

        timeline.BackPropagatePlayerRole(regmatch[1], regmatch[2])
        timeline.BackPropagatePlayerRole(regmatch[3], regmatch[4])
        timeline.AddPlayer(current_keyframe, regmatch[1], 'Spectator')
        timeline.AddKiller(current_keyframe, regmatch[3])
        if (Role.IsSCP(Role.TranslateToInternal(regmatch[2])) || (Role.IsCivilian(Role.TranslateToInternal(regmatch[2])) && !Role.IsSCP(Role.TranslateToInternal(regmatch[4])))) {
            tr.classList.add("notable_death")
        }
        return;
    }

    //SPAWN WAVE 1/2
    if (regmatch = <SLRegExp>SLRegExp.ClassChange.RespawnAs.exec(new_lines[4])) {
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
    if (regmatch = <SLRegExp>SLRegExp.ClassChange.RespawnManager.exec(new_lines[4])) {
        timeline.keyframe[timeline.FindNewestEventType('spawn_wave')].timestamp = new Date(new_lines[1])
        state.respawn_in_progress = false
        tr.classList.add("notable_death")
        return;
    }
    //FORCE CLASS
    if (regmatch = <SLRegExp>SLRegExp.ClassChange.ForceClass.exec(new_lines[4])) {
        let current_keyframe = timeline.NewKeyFrame(new_lines[1], 'force_class')
        timeline.AddPlayer(current_keyframe, regmatch[2], regmatch[3])
        return;
    }
    if (regmatch = <SLRegExp>SLRegExp.ClassChange.Skeleton.DisguiseSet.exec(new_lines[4])) {
        if (!state.is_3114_in_game) {
            const Player3114 = <string>timeline.FindPlayerWithRole("Scp3114");
            (<HTMLTableColElement>tbody3114.firstChild).textContent = `Szkieletem jest ${UserID_assoc.get(Player3114)} (${Player3114})`;
            tbody3114.style.display = 'inherit';
            if (Player3114 != null) {
                state.is_3114_in_game = true;
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
    if (regmatch = <SLRegExp>SLRegExp.ClassChange.Skeleton.DisguiseDrop.exec(new_lines[4])) {
        if (!state.is_3114_in_game) {
            const Player3114 = <string>timeline.FindPlayerWithRole("Scp3114");
            (<HTMLTableCellElement>tbody3114.firstChild).textContent = `Szkieletem jest ${UserID_assoc.get(Player3114)} (${Player3114})`
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

function LoggerHandle(new_lines: string[], tr: HTMLTableRowElement, timeline: Timeline) {
    tr.classList.add("logger_event")
    if (new_lines[4].search(SLRegExp.Logger.Ignore) != -1) {
        console.debug(`Ignored ${new_lines[4]}`)
        return
    }

    if (SLRegExp.Logger.RoundStart.test(new_lines[4])) {
        timeline.keyframe[timeline.FindNewestEventType('round_start')].timestamp = new Date(new_lines[1]);
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

function AdministativeHandle(new_lines: string[], state: { respawn_in_progress: boolean; broadcast: boolean; admin_chat: boolean; }, admin_chat_log: HTMLSpanElement) {
    let regmatch: RegExpExecArray | null
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

function DeathLogAttacher(death_log: HTMLSpanElement, death_log_text: string) {
    death_log.appendChild(window.document.createTextNode(death_log_text))
    death_log.appendChild(window.document.createElement('br'))
    return
}

function WarheadHandle(new_lines: string[], tr: HTMLTableRowElement, timeline: Timeline) {
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

function NetworkingHandle(new_lines: string[], timeline: Timeline): void {
    let regmatch: SLRegExp | null

    if (regmatch = <SLRegExp>SLRegExp.Networking.Ignore.exec(new_lines[4])) {
        console.debug(`Ignored ${new_lines[4]}`)
        return
    }

    if (regmatch = <SLRegExp>SLRegExp.Networking.Nickname.exec(new_lines[4])) {
        UserID_assoc.set(regmatch[1], regmatch[2])
        return
    }

    if (regmatch = <SLRegExp>SLRegExp.Networking.Preauth.exec(new_lines[4])) {
        //TODO: ALT DETECTION
        if (IPaddress_assoc.get(regmatch.groups["IPaddress"]) === undefined) {
            IPaddress_assoc.set(regmatch.groups["IPaddress"], new Array())
        }
        for (let index = 0; index < (<string[]>IPaddress_assoc.get(regmatch.groups["IPaddress"])).length; index++) {
            const element = (<string[]>IPaddress_assoc.get(regmatch.groups["IPaddress"]))[index];
            if (element == regmatch.groups["UserID"]) {
                return // If user already exists, do not append
            }
        }

        IPaddress_assoc.get(regmatch.groups["IPaddress"])?.push(regmatch.groups["UserID"])
        return
    }
    if (regmatch = <SLRegExp>SLRegExp.Networking.Disconnect.exec(new_lines[4])) {
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

window.document.getElementById('test')?.addEventListener('click', SelectPlayer)
window.document.getElementById('settings')?.children.namedItem('renderbadges')?.addEventListener('click', CreateBadges);
window.document.getElementById('settings')?.children.namedItem('updatesettings')?.addEventListener('click', Settings.RefreshSettings);
window.addEventListener('error', () => {
    (<HTMLDivElement>document.getElementById('error_bar')).style.display = 'block';
})
if (indev) {
    (<HTMLDivElement>document.getElementById('warn_bar')).style.display = 'block';
}
(<HTMLSpanElement>window.document.getElementById('version')).innerText = `Version: ${version}`;
document.getElementById('fileInput')?.addEventListener('change', MakeTimeLine);

Settings.LoadSettings()
Settings.ApplySettings()
