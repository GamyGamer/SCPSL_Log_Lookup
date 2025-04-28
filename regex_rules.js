// @ts-check
class SLRegExp {
    static SplitLogs = /^(?<Time>.+?)\|(?<Type>.+?)\|(?<Module>.+?)\|(?<Message>.+)$/
    static SplitIP = /^(\d*?)\.(\d*?)\.(\d*?)\.(\d+)(?:\/(?<CIDR>\d+))?$/

    static Administrative = {
        AdminChat: /^\[(?<UserName>.+?)(?: \((?<UserID>.+?)\))?\] (?<Text>.+)$/, // TOFIX: Chat as SERVER CONSOLE
        RoundLock: /^(?<UserName>.+) \((?<UserID>.+)\) (?<State>enabled|disabled) round lock\.$/,
        LobbyLock: /^(?<UserName>.+) \((?<UserID>.+)\) (?<State>enabled|disabled) lobby lock\.$/,
        Broadcast: /^.+ \((?<UserID>.+)\) broadcast text ".+$/
    }
    static Permissions = {
        AssignedGroup: /^(?<UserName>.+) \((?<UserID>.+)\) has been assigned to group (?<Group>.+)\.$/
    }

    static ClassChange = {
        Ignore:         /^Player .+ \((?<UserID>.+)\) couldn't be added to spawn wave\. Err msg: (?<Reason>.+)\.$/,
        ForceClass:     /^.+ \((?<IssuerID>.+)\) changed role of player .+ \((?<AffectedID>.+)\) to (?<Role>.+)\.$/,
        RespawnAs:      /^Player .+ \((?<UserID>.+)\) respawned as (?<Role>.+).$/,
        RespawnManager: /^(?:RespawnManager|WaveSpawner) has successfully spawned (?<UserCount>\d+) players as (?<Team>.+)!$/,
        Suicide:        /^.+ \((?<UserID>.+)\), playing as (?<UserRole>.+), has commited suicide. Specific death reason: (?<Reason>.+)\.$/, //Needs to be standardized to one group as it creates unnecessary duplicates
        Warhead:        /^.+ \((?<UserID>.+)\), playing as (?<UserRole>.+), has died\. Specific death reason: Died to alpha warhead\.$/,
        SingleKill:     /^.+ \((?<UserID>.+)\), playing as (?<UserRole>.+), has died\. Specific death reason: (?<Reason>.+)\.$/,
        DirectKill:     /^.+ \((?<UserID>.+)\), playing as (?<UserRole>.+), has been killed by .+ \((?<IssuerID>.+)\) playing as: (?<IssuerRole>.+)\. Specific death reason: (?<Reason>.+)\.$/,
        TeamKill:       /^.+ \((?<UserID>.+)\), playing as (?<UserRole>.+), has been teamkilled by .+ \((?<IssuerID>.+)\) playing as: (?<IssuerRole>.+)\. Specific death reason: (?<Reason>.+)\.$/,
        Skeleton: {
            DisguiseSet: /is now impersonating (?<UserName>.+), playing as (?<Role>.+)\./,
            DisguiseDrop: /is no longer disguised\./
        }
    }
    static Networking = {
        Ignore: /(?:^.*? authenticated from endpoint .*?\. Player ID assigned: .*?\. Auth token serial number: .*?\.$)|(?:^Banned player .*? tried to connect from endpoint .*$)|(?:^.*? \(.*?\) connected from IP address .*? sent Do Not Track signal\.$)/,
        Preauth: /^(?<UserID>.*?) preauthenticated from endpoint (?<IPaddress>\d{0,3}\.\d{0,3}\.\d{0,3}\.\d{0,3})(?::\d{0,5})?(?: \[routed via .*?\])?\.$/,
        Nickname: /^Nickname of (?<UserID>.+) is now (?<UserName>.+)\.$/,
        Disconnect: /.* \((?<UserID>.*?)\) disconnected from IP address .*?\. Last class: (?<Role>.*?)\.$/
    }
    static Warhead = {
        Status: /^.+ \((?<UserID>.+)\) set the Alpha Warhead status to (?<State>.+)\.$/,
        CountdownStart: /^Countdown started\.$/,
        CountdownPaused: /^Detonation cancelled\.$/,
        Detonated: /^Warhead detonated\.$/
    }
    static Logger = {
        Ignore: /(?:Started logging\.)|(?:Game version:.+\.)|(?:Build type:.+\.)|(?:Build timestamp:.+\.)|(?:Headless:.+\.)/,
        RoundStart: /^Round has been started\./,
        RoundFinish: /^Round finished! Anomalies: (\d+)/,
    }
    static Door = {

    }
    static DeathReason = {
        SCPIntentional: /playing as SCP.* (Unknown cause of death|Crushed|Tesla)\./,
        Decayed: /Decayed in the Pocket Dimension/,
        Recontained: /Recontained/,
        Suicide: /Unknown cause of death|Fall damage|Crushed|Severed Hands from SCP-330|Tesla|Melted by a highly corrosive substance|SCP-207/
    }
}