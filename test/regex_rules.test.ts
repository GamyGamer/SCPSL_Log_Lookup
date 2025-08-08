import { describe, expect, it } from '@jest/globals';
import { SLRegExp } from '../src/regex_rules';
import { Role } from '../src/role';

const TestData = {
	UserID: ['306161751077158933@discord', '76561198163699391@steam', 'hubertmoszka@northwood'],
	UserName: ['GamyGamer', 'Diagram [ERD]', 'Super gra (SL)', 'Gracz ze znakiem | bo tak '],
	Message: ['Hejka', 'Test wiadomosci', ' <-- [(On wie)]', 'Uwaga ludzie (Wszyscy), Robimy | EVENT |!!! [Najlepsza osoba wygrywa (WSZYSTKO!)]'],
}

//Simulates a ServerLogsText used by HandleDeath (Specific death reason)
function* ServerLogsTextBuilder(AttackerNickname: string, CustomMessage?: string): Generator<string> {
	const dict049 = ['Killed directly by SCP-049', 'Died to a heart-attack forced by SCP-049', 'Terminated by an instance of SCP-049-2'] as const
	const dict096 = ["Got slapped by SCP-096's left hand", "Got slapped by SCP-096's right hand", "Stood in a line of SCP-096's charge", "Tried to pass through a gate being breached by SCP-096"] as const
	const dict3114 = ['Strangulation', 'Slap', 'SkinSteal'] as const
	const dict939 = ['None', 'Claw', 'LungeTarget', 'LungeSecondary'] as const
	const weapontype = ['GunCOM15', 'MicroHID', 'GunE11SR', 'GunCrossvec', 'GunFSP9', 'GunLogicer', 'GunCOM18', 'GunRevolver', 'GunAK', 'GunShotgun', 'GunCom45', 'GunFRMG0', 'GunA7', 'GunSCP127'] as const
	const hitboxtype = ['Body', 'Limb', 'Headshot'] as const
	const MicroHIDFiringMode = ['PrimaryFire', 'ChargeFire', 'BrokenFire'] as const
	const DeathTranslation = ['Recontained.', 'Vaporized by the Alpha Warhead.', 'Died to SCP-049.', 'Unknown cause of death.', 'Asphyxiated.', 'Bleeding.', 'Fall damage.', 'Decayed in the Pocket Dimension.', 'Melted by a highly corrosive substance.', 'Poison.', 'SCP-207.', 'Severed Hands from SCP-330.', 'Micro H.I.D.', 'Tesla.', 'Explosion.', 'Died to SCP-096.', 'Died to SCP-173.', 'Lunged by SCP-939.', 'Blunt trauma and minor scratches are present on the body.', 'Crushed.', 'Used as bait for SCP-106.', 'Automatically killed for friendly fire.', 'Died to hypothermia.', 'Died to a heart attack.', 'Died to SCP-939.', 'Blunt trauma and minor scratches are present on the body.', 'Killed by Marshmallow Man.', 'Died to SCP-1344.', 'Pecked by SCP-1507', 'Bullet wounds with organic residue.'] as const

	// PlayerRoles.PlayableScps.Scp1507.Scp1507DamageHandler.get_ServerLogsText() : string @06001D3A
	yield `Pecked by ${AttackerNickname}`
	// PlayerRoles.PlayableScps.Scp3114.Scp3114DamageHandler.get_ServerLogsText() : string @06001B25
	for (let index = 0; index < dict3114.length; index++) {
		const element = dict3114[index];
		yield `${element}`
	}
	// PlayerRoles.PlayableScps.Scp939.Scp939DamageHandler.get_ServerLogsText() : string @06001938
	for (let index = 0; index < dict939.length; index++) {
		const element = dict939[index];
		yield `Killed by SCP-939 (${AttackerNickname}) with ${element}.`
	}
	// PlayerStatsSystem.CustomReasonDamageHandler.get_ServerLogsText() : string @060013D5
	if (typeof CustomMessage == 'string') {
		yield `Killed with a custom reason - ${CustomMessage}`
	}
	// PlayerStatsSystem.DisruptorDamageHandler.get_ServerLogsText() : string @06001410
	yield `Molecularly disrupted by ${AttackerNickname}`
	// PlayerStatsSystem.ExplosionDamageHandler.get_ServerLogsText() : string @06001420
	yield `Explosion. caused by ${AttackerNickname}`
	// PlayerStatsSystem.FirearmDamageHandler.get_ServerLogsText() : string @0600142F
	for (let index1 = 0; index1 < weapontype.length; index1++) {
		for (let index2 = 0; index2 < hitboxtype.length; index2++) {
			const Hitbox = hitboxtype[index2];
			const WeaponType = weapontype[index1]
			yield `Shot by ${AttackerNickname} with ${WeaponType} to the '${Hitbox}' hitbox.`
		}
	}
	// PlayerStatsSystem.JailbirdDamageHandler.get_ServerLogsText() : string @0600145B
	yield `Jailbirded by ${AttackerNickname}`
	// PlayerStatsSystem.MicroHidDamageHandler.get_ServerLogsText() : string @06001466
	yield `MicroHID overcharge`
	for (let index = 0; index < MicroHIDFiringMode.length; index++) {
		const firingMode = MicroHIDFiringMode[index];
		yield `Deep fried by ${AttackerNickname} with Micro H.I.D. using ${firingMode}`
	}
	// PlayerStatsSystem.RecontainmentDamageHandler.get_ServerLogsText() : string @06001496
	yield `Recontained by ${AttackerNickname}`
	// PlayerStatsSystem.Scp018DamageHandler.get_ServerLogsText() : string @0600149C
	yield `SCP-018 thrown by: ${AttackerNickname}`
	// PlayerStatsSystem.Scp049DamageHandler.get_ServerLogsText() : string @060014AA
	for (let index = 0; index < dict049.length; index++) {
		const element = dict049[index];
		yield `${element} (${AttackerNickname}).`
	}
	// PlayerStatsSystem.Scp096DamageHandler.get_ServerLogsText() : string @060014BD
	for (let index = 0; index < dict096.length; index++) {
		const element = dict096[index];
		yield `${element} (${AttackerNickname}).`
	}
	// PlayerStatsSystem.ScpDamageHandler.get_ServerLogsText() : string @060014CA
	for (let index = 0; index < Role.Aligments.SCP.length; index++) {
		const element = Role.Aligments.SCP[index];
		yield `Died to SCP (${AttackerNickname}, ${element})`
	}
	// PlayerStatsSystem.UniversalDamageHandler.get_ServerLogsText() : string @06001545
	for (let index = 0; index < DeathTranslation.length; index++) {
		const element = DeathTranslation[index];
		yield element;
	}
	// PlayerStatsSystem.WarheadDamageHandler.get_ServerLogsText() : string @06001552
	yield `Died to alpha warhead`
	// Scp956DamageHandler.get_ServerLogsText() : string @060000C1
	yield `Died to SCP-956`
	// SnowballDamageHandler.get_ServerLogsText() : string @06000108
	yield `Snowballed by ${AttackerNickname}`
}

function* DeathStringBuilder(DeathType: 'Suicide' | 'FriendlyFire' | 'Unknown' | 'Default', PlayerID: string, PlayerName: string, PlayerRole: string, KillerID: string, KillerName: string, KillerRole?: string, CustomMessage?: string): Generator<string> {
	let stringBuilder = `${PlayerName} (${PlayerID}), playing as ${PlayerRole}, `
	if (DeathType != 'Unknown') {
		if (DeathType == 'Suicide') {
			stringBuilder += `has commited suicide.`
		}
		else {
			if (DeathType == 'FriendlyFire') {
				stringBuilder += `has been teamkilled by `
			}
			else {
				stringBuilder += `has been killed by `
			}
			stringBuilder += `${KillerName} (${KillerID}) playing as: ${KillerRole ? KillerRole : 'Unknown class'}.`
		}
	}
	else {
		stringBuilder += 'has died.'
	}
	stringBuilder += ` Specific death reason: `
	let ServerLogsText = ServerLogsTextBuilder(KillerName, CustomMessage)
	let result = ServerLogsText.next()
	while (!result.done) {
		yield result.value.endsWith('.') ? `${stringBuilder}${result.value}` : `${stringBuilder}${result.value}.`
		result = ServerLogsText.next()
	}
	return
}

describe('SplitLogs', () => {
	let capture: SLRegExp | null
	it('Should split logs correctly', () => {
		capture = <SLRegExp>SLRegExp.SplitLogs.exec('2025-07-08 17:10:11.162 +02:00 | Internal            | Game logic     | Started logging.');
		expect(capture).not.toBeNull()
		expect(capture.groups['Timestamp'].trim()).toStrictEqual('2025-07-08 17:10:11.162 +02:00')
		expect(capture.groups['Type'].trim()).toStrictEqual('Internal')
		expect(capture.groups['Module'].trim()).toStrictEqual('Game logic')
		expect(capture.groups['Message'].trim()).toStrictEqual('Started logging.')

		capture = <SLRegExp>SLRegExp.SplitLogs.exec('2025-07-08 17:10:31.100 +02:00 | Connection update   | Networking     | Nickname of ARandomPerson@steam is now | Wspaniały |.');
		expect(capture).not.toBeNull()
		expect(capture.groups['Timestamp'].trim()).toStrictEqual('2025-07-08 17:10:31.100 +02:00')
		expect(capture.groups['Type'].trim()).toStrictEqual('Connection update')
		expect(capture.groups['Module'].trim()).toStrictEqual('Networking')
		expect(capture.groups['Message'].trim()).toStrictEqual('Nickname of ARandomPerson@steam is now | Wspaniały |.')
	})
})

describe('SplitIP', () => {
	let capture: SLRegExp | null
	it('Should capture IP correctly', () => {
		capture = <SLRegExp>SLRegExp.SplitIP.exec('192.168.0.1')
		expect(capture).not.toBeNull()
		expect(capture[1]).toStrictEqual('192')
		expect(capture[2]).toStrictEqual('168')
		expect(capture[3]).toStrictEqual('0')
		expect(capture[4]).toStrictEqual('1')
		expect(capture.groups.CIDR).toBeUndefined()

		capture = <SLRegExp>SLRegExp.SplitIP.exec('10.100.0.1/24')
		expect(capture).not.toBeNull()
		expect(capture[1]).toStrictEqual('10')
		expect(capture[2]).toStrictEqual('100')
		expect(capture[3]).toStrictEqual('0')
		expect(capture[4]).toStrictEqual('1')
		expect(capture.groups.CIDR).toStrictEqual('24')
	})
})

describe('Administrative', () => {
	let capture: SLRegExp | null
	describe('Check Adminchat', () => {
		it('Should capture SERVER CONSOLE', () => {
			capture = <SLRegExp>SLRegExp.Administrative.AdminChat.exec('[SERVER CONSOLE] Hejka');
			expect(capture).not.toBeNull()
			expect(capture.groups['UserID']).toBeUndefined()
			expect(capture.groups['UserName']).toStrictEqual('SERVER CONSOLE');
			expect(capture.groups['Message']).toStrictEqual('Hejka')
		});
		describe.each(TestData.UserID)(`Should capture UserID: %s`, (userid) => {
			describe.each(TestData.UserName)(`UserName: %s,`, (username) => {
				it.each(TestData.Message)(`Message: %s`, (message) => {
					capture = <SLRegExp>SLRegExp.Administrative.AdminChat.exec(`[${username} (${userid})] ${message}`)
					expect(capture).not.toBeNull()
					expect(capture.groups.UserName).toStrictEqual(username);
					expect(capture.groups.UserID).toStrictEqual(userid)
					expect(capture.groups.Message).toStrictEqual(message)
				})
			})
		})
	})
	describe('LockManager', () => {
		it('Should detect correct state', () => {
			capture = <SLRegExp>SLRegExp.Administrative.LockManager.exec('User (Random@me) enabled lobby lock.')
			expect(capture).not.toBeNull()
			expect(capture.groups.UserName).toStrictEqual('User')
			expect(capture.groups.UserID).toStrictEqual('Random@me')
			expect(capture.groups.State).toStrictEqual('enabled')
			expect(capture.groups.Type).toStrictEqual('lobby')

			capture = <SLRegExp>SLRegExp.Administrative.LockManager.exec('User (Random@me) disabled lobby lock.')
			expect(capture).not.toBeNull()
			expect(capture.groups.UserName).toStrictEqual('User')
			expect(capture.groups.UserID).toStrictEqual('Random@me')
			expect(capture.groups.State).toStrictEqual('disabled')
			expect(capture.groups.Type).toStrictEqual('lobby')

			capture = <SLRegExp>SLRegExp.Administrative.LockManager.exec('User (Random@me) enabled round lock.')
			expect(capture).not.toBeNull()
			expect(capture.groups.UserName).toStrictEqual('User')
			expect(capture.groups.UserID).toStrictEqual('Random@me')
			expect(capture.groups.State).toStrictEqual('enabled')
			expect(capture.groups.Type).toStrictEqual('round')

			capture = <SLRegExp>SLRegExp.Administrative.LockManager.exec('User (Random@me) disabled round lock.')
			expect(capture).not.toBeNull()
			expect(capture.groups.UserName).toStrictEqual('User')
			expect(capture.groups.UserID).toStrictEqual('Random@me')
			expect(capture.groups.State).toStrictEqual('disabled')
			expect(capture.groups.Type).toStrictEqual('round')

			capture = <SLRegExp>SLRegExp.Administrative.LockManager.exec('User (Random@me) destroyed lobby lock.')
			expect(capture).toBeNull()
		})
	})
	describe('Broadcast', () => {
		describe.each(TestData.Message)('Message: %s', (message) => {
			describe.each(TestData.UserID)('UserID: %s', (userid) => {
				it.each(TestData.UserName)('Should capture broadcast correctly', (username) => {
					capture = <SLRegExp>SLRegExp.Administrative.Broadcast.exec(`${username} (${userid}) broadcast text "${message} ". Duration: 10 seconds. Broadcast Flag: Normal.`)
					expect(capture).not.toBeNull()
					expect(capture.groups.UserName).toStrictEqual(username)
					expect(capture.groups.UserID).toStrictEqual(userid)
					expect(capture.groups.Message.trimEnd()).toStrictEqual(message)
					expect(capture.groups.TimeValue).toStrictEqual('10')
					expect(capture.groups.Scale).toStrictEqual('seconds')
					expect(capture.groups.Flag).toStrictEqual('Normal')
				})
			})
		})
	})
})

describe('Permissions', () => {
	let capture: SLRegExp | null

	describe.each(TestData.Message)('Group: %s', (group) => {
		describe.each(TestData.UserID)('UserID: %s', (userid) => {
			describe.each(TestData.UserName)('Username: %s', (username) => {
				it('Should assign to group', () => {
					capture = <SLRegExp>SLRegExp.Permissions.AssignedGroup.exec(`${username} (${userid}) has been assigned to group ${group}.`)
					expect(capture).not.toBeNull()
					expect(capture.groups.UserName).toStrictEqual(username)
					expect(capture.groups.UserID).toStrictEqual(userid)
					expect(capture.groups.PermissionGroup).toStrictEqual(group)

				})
			})
		})
	})
})

describe('ClassChange', () => {
	let capture: SLRegExp | null
	describe('Death capture', () => {
		const Player_role = 'Nine-Tailed Fox Captain'
		TestData.UserID.forEach(Player_userID => {
			TestData.UserID.forEach(Player_username => {
				TestData.UserID.forEach(Killer_username => {
					it('has commited suicide', () => {
						let LogMessage = DeathStringBuilder('Suicide', Player_userID, Player_username, Player_role, Player_userID, Killer_username, Player_role, 'Nie ruszałeś się (Move or die)')
						let result = LogMessage.next()
						while (!result.done) {
							capture = <SLRegExp>SLRegExp.ClassChange.Death.exec(result.value)
							expect(capture.groups.UserName).toStrictEqual(Player_username)
							expect(capture.groups.UserID).toStrictEqual(Player_userID)
							expect(capture.groups.UserRole).toStrictEqual(Player_role)
							expect(capture.groups.Classifier).toStrictEqual('suicide')
							expect(capture.groups.IssuerName).toBeUndefined()
							expect(capture.groups.IssuerID).toBeUndefined()
							expect(capture.groups.IssuerRole).toBeUndefined()
							result = LogMessage.next()
						}
					})
					it('has been teamkilled', () => {
						let LogMessage = DeathStringBuilder('FriendlyFire', Player_userID, Player_username, Player_role, Player_userID, Killer_username, Player_role, 'Nie ruszałeś się (Move or die)')
						let result = LogMessage.next()
						while (!result.done) {
							capture = <SLRegExp>SLRegExp.ClassChange.Death.exec(result.value)
							expect(capture.groups.UserName).toStrictEqual(Player_username)
							expect(capture.groups.UserID).toStrictEqual(Player_userID)
							expect(capture.groups.UserRole).toStrictEqual(Player_role)
							expect(capture.groups.Classifier).toStrictEqual('teamkilled')
							expect(capture.groups.IssuerName).toStrictEqual(Killer_username)
							expect(capture.groups.IssuerID).toStrictEqual(Player_userID)
							expect(capture.groups.IssuerRole).toStrictEqual(Player_role)
							result = LogMessage.next()
						}
					})
					it('has been killed', () => {
						let LogMessage = DeathStringBuilder('Default', Player_userID, Player_username, Player_role, Player_userID, Killer_username, Player_role, 'Nie ruszałeś się (Move or die)')
						let result = LogMessage.next()
						while (!result.done) {
							capture = <SLRegExp>SLRegExp.ClassChange.Death.exec(result.value)
							expect(capture.groups.UserName).toStrictEqual(Player_username)
							expect(capture.groups.UserID).toStrictEqual(Player_userID)
							expect(capture.groups.UserRole).toStrictEqual(Player_role)
							expect(capture.groups.Classifier).toStrictEqual('killed')
							expect(capture.groups.IssuerName).toStrictEqual(Killer_username)
							expect(capture.groups.IssuerID).toStrictEqual(Player_userID)
							expect(capture.groups.IssuerRole).toStrictEqual(Player_role)
							result = LogMessage.next()
						}
					})
					it('has died', () => {
						let LogMessage = DeathStringBuilder('Unknown', Player_userID, Player_username, Player_role, Player_userID, Killer_username, Player_role, 'Nie ruszałeś się')
						let result = LogMessage.next()
						while (!result.done) {
							capture = <SLRegExp>SLRegExp.ClassChange.Death.exec(result.value)
							expect(capture.groups.UserName).toStrictEqual(Player_username)
							expect(capture.groups.UserID).toStrictEqual(Player_userID)
							expect(capture.groups.UserRole).toStrictEqual(Player_role)
							expect(capture.groups.Classifier).toStrictEqual('died')
							expect(capture.groups.IssuerName).toBeUndefined()
							expect(capture.groups.IssuerID).toBeUndefined()
							expect(capture.groups.IssuerRole).toBeUndefined()
							result = LogMessage.next()
						}
					});
					it('killer unknown role', () => {
						let LogMessage = DeathStringBuilder('Default', Player_userID, Player_username, Player_role, Player_userID, Killer_username)
						let result = LogMessage.next()
						while (!result.done) {
							capture = <SLRegExp>SLRegExp.ClassChange.Death.exec(result.value)
							expect(capture.groups.UserName).toStrictEqual(Player_username)
							expect(capture.groups.UserID).toStrictEqual(Player_userID)
							expect(capture.groups.UserRole).toStrictEqual(Player_role)
							expect(capture.groups.Classifier).toStrictEqual('killed')
							expect(capture.groups.IssuerName).toStrictEqual(Killer_username)
							expect(capture.groups.IssuerID).toStrictEqual(Player_userID)
							expect(capture.groups.IssuerRole).toStrictEqual('Unknown class')
							result = LogMessage.next()
						}
					})

				});
			});
		});
		// describe.each(TestData.UserID)('Player UserID: %s', (Player_userID) => {
		// 	describe.each(TestData.UserName)('Player Username: %s', (Player_username) => {
		// 		describe.each(TestData.UserName)('Killer Username: %s', (Killer_username) => {
		// 			describe.each(Object.values(Role.role_dictonary))('Player Role: %s', (Player_role) => {

		// 			})
		// 		})
		// 	})
		// })
	})
	describe('ForceClass', () => {
		TestData.UserName.forEach(UserName => {
			TestData.UserName.forEach(IssuerName => {
				TestData.UserID.forEach(UserID => {
					Object.keys(Role.role_dictonary).forEach(Role => {
						it('Should resolve to original data', () => {
							capture = <SLRegExp>SLRegExp.ClassChange.ForceClass.exec(`${IssuerName} (${UserID}) changed role of player ${UserName} (${UserID}) to ${Role}.`)
							expect(capture.groups.UserName).toStrictEqual(UserName)
							expect(capture.groups.UserID).toStrictEqual(UserID)
							expect(capture.groups.IssuerName).toStrictEqual(IssuerName)
							expect(capture.groups.IssuerID).toStrictEqual(UserID)
							expect(capture.groups.Role).toStrictEqual(Role)
						})
					});
				});
			});
		});
	})

	describe('Respawning', () => {
		TestData.UserName.forEach(UserName => {
			it('Tests for RespawnAs', () => {
				capture = <SLRegExp>SLRegExp.ClassChange.RespawnAs.exec(`Player ${UserName} (${TestData.UserID[0]}) respawned as NtfCaptain.`)
				expect(capture.groups.UserName).toStrictEqual(UserName)
				expect(capture.groups.UserID).toStrictEqual(TestData.UserID[0])
				expect(capture.groups.Role).toStrictEqual('NtfCaptain')
			})
		})
		it('Tests for Wavespawner', () => {
			capture = <SLRegExp>SLRegExp.ClassChange.RespawnManager.exec(`WaveSpawner has successfully spawned 5 players as FoundationForces!`)
			expect(capture.groups.UserCount).toStrictEqual('5')
			capture = <SLRegExp>SLRegExp.ClassChange.RespawnManager.exec(`RespawnManager has successfully spawned 100 players as FoundationForces!`)
			expect(capture.groups.UserCount).toStrictEqual('100')
		})

	})
	describe('Skeleton', () => {
		TestData.UserName.forEach(UserName => {
			it('Tests for DisguiseSet', () => {
				capture = <SLRegExp>SLRegExp.ClassChange.Skeleton.DisguiseSet.exec(`is now impersonating ${UserName}, playing as Nine-Tailed Fox Private.`)
				expect(capture.groups.UserName).toStrictEqual(UserName)
				expect(capture.groups.Role).toStrictEqual('Nine-Tailed Fox Private')

			})

		});
		it('Tests for DisguiseDrop', () => {
			capture = <SLRegExp>SLRegExp.ClassChange.Skeleton.DisguiseSet.exec(`is no longer disguised.`);
		})

	})
	it.todo('Tests for Ignore')
})

describe('Networking', () => {
	let capture: SLRegExp | null
	it.todo('Tests for Ignore')
	it.todo('Tests for Preauth')
	it.todo('Tests for Nickname')
	it.todo('Tests for Disconnect')
})

describe('Warhead', () => {
	let capture: SLRegExp | null
	it.todo('Tests for Status')
	it.todo('Tests for CountdownStart')
	it.todo('Tests for CountdownPaused')
	it.todo('Tests for Detonated')
})

describe('Logger', () => {
	let capture: SLRegExp | null
	it.todo('Tests for Ignore')
	it.todo('Tests for RoundStart')
	it.todo('Tests for RoundFinish')
})

describe('Door', () => {
	let capture: SLRegExp | null
	it.todo('TBD')
})

describe('DeathReason', () => {
	let capture: SLRegExp | null
	it.todo('Tests for SCPIntentional')
	it.todo('Tests for Decayed')
	it.todo('Tests for Recontained')
	it.todo('Tests for Suicide')
})