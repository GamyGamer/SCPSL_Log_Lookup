//@ts-check
class Settings {
    notable_death_color = new String();
    unusual_death_color = new String();
    warhead_color = new String();
    logger_color = new String();

    constructor(parameters) {

        this.LoadSettings()

    }
    LoadSettings() {
        let parsed = JSON.parse(localStorage.getItem('settings'))
        if (parsed == null) {
            parsed = new Object();
        }
        this.notable_death_color = parsed.notable_death_color ? parsed.notable_death_color : '#ff0000'
        this.unusual_death_color = parsed.unusual_death_color ? parsed.unusual_death_color : '#6495ed'
        this.warhead_color = parsed.warhead_color ? parsed.warhead_color : '#008080'
        this.logger_color = parsed.warhead_color ? parsed.logger_color : '#ffa500'
        this.SaveSettings()
    }
    SaveSettings() {
        localStorage.setItem('settings', JSON.stringify(this))
    }
}

let settings = new Settings()