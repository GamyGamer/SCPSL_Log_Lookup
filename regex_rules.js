//Class changes
const REGEX_scp_intentional_deaths = /playing as SCP.* (Unknown cause of death|Crushed|Tesla)\./;
const REGEX_direct_kill = /.+ \((.+)\), playing as (.+), has been killed by .+ \((.+)\) playing as: (.+)\. Specific death reason: (.+)\./;
const REGEX_ID_to_username = /Nickname of (.+) is now (.+)\./;
const REGEX_Respawned_as = /Player .+ \((.+)\) respawned as (.+)./;
const REGEX_unknown_kill = /.+ \((.+)\), playing as (.+), has died. Specific death reason: (.+)\./;
const REGEX_suicide = /.+ \((.+)\), playing as (.+), has commited suicide. Specific death reason: (.+)\./;
const REGEX_respawn_manager = /RespawnManager has successfully spawned (\d+) players as (.+)!/;
const REGEX_teamkill = /.+ \((.+)\), playing as (.+), has been teamkilled by .+ \((.+)\) playing as: (.+)\. Specific death reason: (.+)\./;
const REGEX_warhead_death = /.+ \((.+)\), playing as (.+), has died. Specific death reason: Died to alpha warhead\./;
const REGEX_class_change = /.+ \((.+)\) changed role of player .+ \((.+)\) to (.+)\./;

const REGEX_admin_chat = /\[(.+) \((.+)\)\] (.+)/;

//Round events
const REGEX_round_start = /Round has been started\./;
const REGEX_round_finish = /Round finished! Anomalies: (\d+)/;
const REGEX_warhead_status = /.+ \((.+)\) set the Alpha Warhead status to (.+)\./;
const REGEX_warhead_countdown_start = /Countdown started\./;
const REGEX_warhead_countdown_paused = /Detonation cancelled\./;
const REGEX_warhead_detonated = /Warhead detonated\./;

const REGEX_log_split = /(.+?)\|(.+?)\|(.+?)\|(.+)/;