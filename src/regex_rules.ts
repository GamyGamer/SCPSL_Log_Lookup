interface SLRegExp extends RegExpExecArray {
	groups: {
		'Timestamp': string;
		'Type': string;
		'Module': string;
		'Message': string;
		'CIDR': string;
		'UserName': string;
		'UserID': string;
		'State': 'enabled' | 'disabled';
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
		'RouteIP':string;
	}
}

class SLRegExp {
	static SplitLogs = /^(?<Timestamp>.+?)\|(?<Type>.+?)\|(?<Module>.+?)\|(?<Message>.+)$/
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
		Skeleton: {
			DisguiseSet: /^is now impersonating (?<UserName>.+?), playing as (?<Role>.+)\.$/,
			DisguiseDrop: /^is no longer disguised\.$/
		} as const
	} as const
	static Networking = {
		Ignore: /(?:^.*? authenticated from endpoint .*?\. Player ID assigned: .*?\. Auth token serial number: .*?\.$)|(?:^Banned player .*? tried to connect from endpoint .*$)|(?:^.*? \(.*?\) connected from IP address .*? sent Do Not Track signal\.$)/,
		Preauth: /^(?<UserID>.*?) preauthenticated from endpoint (?<IPaddress>\d{0,3}\.\d{0,3}\.\d{0,3}\.\d{0,3})(?::\d{0,5})?(?: \[routed via (?<RouteIP>.+)\])?\.$/,
		Auth: /^(?<UserID>.+?) authenticated from endpoint (?<IPaddress>\d{0,3}\.\d{0,3}\.\d{0,3}\.\d{0,3})(?::\d{1,5})?\. Player ID assigned: (?<PlayerID>\d+?)\. Auth token serial number: (?<AuthSerial>.+)\.$/,
		Nickname: /^Nickname of (?<UserID>.+?) is now (?<UserName>.+)\.$/,
		Disconnect: /^(?<UserName>.+?) \((?<UserID>[\w@]+?)\) disconnected from IP address (?<IPaddress>.+?)\. Last class: (?<Role>.+)\.$/
	} as const
	static Warhead = {
		Status: /^(?<UserName>.+?) \((?<UserID>[\w@]+?)\) set the Alpha Warhead status to (?<State>.+)\.$/,
		CountdownStart: /^Countdown started\.$/,
		CountdownPaused: /^Detonation cancelled\.$/,
		Detonated: /^Warhead detonated\.$/
	} as const
	static Logger = {
		Ignore: /(?:Started logging\.)|(?:Game version:.+\.)|(?:Build type:.+\.)|(?:Build timestamp:.+\.)|(?:Headless:.+\.)/,
		RoundStart: /^Round has been started\./,
		RoundFinish: /^Round finished! Anomalies: (\d+)/,
	} as const
	static Door = {
	} as const
	static DeathReason = {
		SCPIntentional: /playing as SCP.* (Unknown cause of death|Crushed|Tesla)\./,
		Decayed: /Decayed in the Pocket Dimension/,
		Recontained: /Recontained/,
		Suicide: /Unknown cause of death|Fall damage|Crushed|Severed Hands from SCP-330|Tesla|Melted by a highly corrosive substance|SCP-207/
	} as const
}

export { SLRegExp }