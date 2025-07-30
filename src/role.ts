class Role {
    static Aligments = {
        SCP: ["Scp173", "Scp106", "Scp049", "Scp079", "Scp096", "Scp0492", "Scp939", "Scp3114"],
        Foundation: ["NtfSpecialist", "NtfSergeant", "NtfCaptain", "NtfPrivate", "FacilityGuard", "Scientist"],
        Chaos: ["ChaosConscript", "ChaosRifleman", "ChaosMarauder", "ChaosRepressor", "ClassD"],
        Misc: ["Spectator", "Overwatch", "Filmmaker", "Tutorial"]
    } as const
    static Military = ["NtfSpecialist", "NtfSergeant", "NtfCaptain", "NtfPrivate", "FacilityGuard", "ChaosConscript", "ChaosRifleman", "ChaosMarauder", "ChaosRepressor"] as const;
    static Civilian = ["Scientist", "ClassD"] as const;
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
    } as const;
    static Order = ["Scp173", "Scp106", "Scp049", "Scp079", "Scp096", "Scp0492", "Scp939", "Scp3114", "NtfSpecialist", "NtfSergeant", "NtfCaptain", "NtfPrivate", "FacilityGuard", "ChaosConscript", "ChaosRifleman", "ChaosMarauder", "ChaosRepressor", "Scientist", "ClassD", "Spectator", "None", "Overwatch", "Filmmaker", "Tutorial"] as const
    static IsCivilian(Role: string): boolean {
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
    static IsSCP(Role: string): boolean {
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

export { Role }