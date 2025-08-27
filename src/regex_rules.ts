interface SLRegExp extends RegExpExecArray {
	groups: {
		'Timestamp': string;
		'Type': string;
		'Module': string;
		'Message': string;
		'CIDR': string;
		'UserName': string;
		'UserID': string;
		'State': 'enabled' | 'disabled' | 'opened' | 'closed';
		'PermissionGroup': string;
		'Reason': string;
		'UserCount': string;
		'IPaddress': string;
		'UserRole': string;
		'Role': string;
		'TimeValue': string;
		'Scale': string;
		'Flag': string;
		'IssuerID': string;
		'IssuerRole': string;
		'IssuerName': string;
		'Classifier': string;
		'PlayerID': string;
		'AuthSerial': string;
		'RouteIP': string;
		'DoorName': string;
		'Action': string;
		'Item': string;
		'StatusEffect': string;
		'PlayerName': string;
		'Team':string
	}
}

class SLRegExp {
	static SplitLogs = /^(?:\s*?)(?<Timestamp>\S.+?)(?:\s*?)\|(?:\s*?)(?<Type>\S.+?)(?:\s*?)\|(?:\s*?)(?<Module>\S.+?)(?:\s*?)\|(?:\s*?)(?<Message>\S.+)(?:\s*?)$/
	static SplitIP = /^(\d*?)\.(\d*?)\.(\d*?)\.(\d+)(?:\/(?<CIDR>\d+))?$/

	static Administrative = {
		AdminChat: /^\[(?<UserName>.+)(?:(?<=\[SERVER CONSOLE)\]|(?: \((?<UserID>.+?)\))\]) (?<Message>.+)$/,
		LockManager: /^(?<UserName>.+) \((?<UserID>.+)\) (?<State>enabled|disabled) (?<Type>round|lobby) lock\.$/,
		Broadcast: /^(?<UserName>.+) \((?<UserID>.+)\) broadcast text "(?<Message>.+)"\. Duration: (?<TimeValue>.+?) (?<Scale>.+?)\. Broadcast Flag: (?<Flag>.+)\./
	} as const
	static Permissions = {
		AssignedGroup: /^(?<UserName>.+) \((?<UserID>.+)\) has been assigned to group (?<PermissionGroup>.+)\.$/
	} as const

	static ClassChange = {
		Ignore: /^Player .+ \((?<UserID>.+)\) couldn't be added to spawn wave\. Err msg: (?<Reason>.+)\.$/,
		ForceClass: /^(?<IssuerName>.+?) \((?<IssuerID>[\w@]+?)\) changed role of player (?<UserName>.+?) \((?<UserID>[\w@]+?)\) to (?<Role>.+)\.$/,
		RespawnAs: /^Player (?<UserName>.+?) \((?<UserID>[\w@]+?)\) respawned as (?<Role>.+)\.$/,
		RespawnManager: /^(?:RespawnManager|WaveSpawner) has successfully spawned (?<UserCount>\d+?) players as (?<Team>.+)!$/,
		Death: /^(?<UserName>.+?) \((?<UserID>[\w@]+?)\), playing as (?<UserRole>.+?), has (?:been |commited )?(?<Classifier>.+?)(?:(?<=died|suicide)\.| by (?<IssuerName>.+?) \((?<IssuerID>[\w@]+?)\) playing as: (?<IssuerRole>.+?)\.) Specific death reason: (?<Reason>.+)\.$/,
		Skeleton: /^is ?(?:(?<State>now?)) (?:(?<=is no )longer disguised|impersonating (?<UserName>.+?), playing as (?<Role>.+))\.$/
	} as const
	static Networking = {
		Ignore: /(?:^.*? authenticated from endpoint .*?\. Player ID assigned: .*?\. Auth token serial number: .*?\.$)|(?:^Banned player .*? tried to connect from endpoint .*$)|(?:^.*? \(.*?\) connected from IP address .*? sent Do Not Track signal\.$)/,
		Preauth: /^(?<UserID>.*?) preauthenticated from endpoint (?<IPaddress>\d{0,3}\.\d{0,3}\.\d{0,3}\.\d{0,3})(?::\d{0,5})?(?: \[routed via (?<RouteIP>.+)\])?\.$/,
		Auth: /^(?<UserID>.+?) authenticated from endpoint (?<IPaddress>\d{0,3}\.\d{0,3}\.\d{0,3}\.\d{0,3})(?::\d{1,5})?\. Player ID assigned: (?<PlayerID>\d+?)\. Auth token serial number: (?<AuthSerial>.+)\.$/,
		Nickname: /^Nickname of (?<UserID>.+?) is now (?<UserName>.+)\.$/,
		Disconnect: /^(?<UserName>.+?) \((?<UserID>[\w@]+?)\) disconnected from IP address (?<IPaddress>.+?)\. Last class: (?<Role>.+)\.$/
	} as const
	static Warhead = /^(?:(?<UserName>.+?) \((?<UserID>[\w@]+?)\)|Detonation|Warhead|Countdown) (?<Action>\w+)(?: the Alpha Warhead (?:detonation|status to (?<State>.+)))?\.$/
	static Logger = {
		Ignore: /(?:Started logging\.)|(?:Game version:.+\.)|(?:Build type:.+\.)|(?:Build timestamp:.+\.)|(?:Headless:.+\.)/,
		RoundStart: /^Round has been started\.$/,
		RoundFinish: /^Round finished!.+\.$/,
		DecontaminationStarted: /^Decontamination started\.$/
	} as const
	static Door = {
		Change: /^(?<UserName>.+?) \((?<UserID>[\w@]+?)\) (?<State>\w+?) (?<DoorName>.+?)(?: using (?<Type>.+))?\.$/
	} as const
	static Throwable = /^(?:(?<PlayerName>.+?) \((?<PlayerID>[\w@]+?)\) has been (?<StatusEffect>.+?) by )?(?<IssuerName>.+?) \((?<IssuerID>[\w@]+?)\) (?<Action>threw|using) (?:a )?(?<Item>.+)\.$/
}

export { SLRegExp }