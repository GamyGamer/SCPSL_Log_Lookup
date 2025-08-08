namespace EventType {
	export enum ServerLogType {
		ConnectionUpdate = "Connection update",
		RemoteAdminActivity_GameChanging = "Remote Admin",
		RemoteAdminActivity_Misc = "Remote Admin - Misc",
		KillLog = "Kill",
		GameEvent = "Game Event",
		InternalMessage = "Internal",
		AuthRateLimit = "Auth Rate Limit",
		Teamkill = "Teamkill",
		Suicide = "Suicide",
		AdminChat = "AdminChat",
		Query = "Query",
	}
	export enum Modules {
		Warhead = "Warhead",
		Networking = "Networking",
		ClassChange = "Class change",
		Permissions = "Permissions",
		Administrative = "Administrative",
		GameLogic = "Game logic",
		DataAccess = "Data access",
		Detector = "FF Detector",
		Throwable = "Throwable",
		Door = "Door",
		Elevator = "Elevator",
	}
	export enum Specific {
		StartedLogging = "started_logging",
		GameVersion = "game_version",
		BuildType = "build_type",
		BuildTimestamp = "build_timestamp",
		ServerType = "server_type",
		Preauth = "preauth",
		Auth = "auth",
		Permission = "permission",
		Kill = "kill",
		Death = "death",
		Door = 'door',
		Ignored = "ignored",
		RoundStart = 'round_start',
		Suicide = 'suicide',
		Respawn = 'respawn'
	}
}

export { EventType }