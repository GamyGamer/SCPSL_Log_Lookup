//@ts-check
class Settings {
    notable_death_color = new String().toString();
    unusual_death_color = new String().toString();
    warhead_color = new String().toString();
    logger_color = new String().toString();

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
        this.ApplySettings()
    }
    SaveSettings() {
        localStorage.setItem('settings', JSON.stringify(this))
        this.ApplySettings()
    }
    ApplySettings() {
        window.document.getElementsByTagName('body')[0].style.setProperty("--notable_death", this.notable_death_color)
        window.document.getElementsByTagName('body')[0].style.setProperty("--unusual_death", this.unusual_death_color)
        window.document.getElementsByTagName('body')[0].style.setProperty("--warhead_event", this.warhead_color)
        window.document.getElementsByTagName('body')[0].style.setProperty("--logger_event", this.logger_color)
    }
}

let settings = new Settings()