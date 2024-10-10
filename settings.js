//@ts-check
class Settings {
    static notable_death_color = new String().toString();
    static unusual_death_color = new String().toString();
    static warhead_color = new String().toString();
    static logger_color = new String().toString();
    static dev_mode = new Boolean();

    static LoadSettings() {
        let parsed;
        try {
            parsed = JSON.parse(localStorage.getItem('settings'))
            if (parsed == null) {
                parsed = new Object();
            }

        } catch (error) {
            console.error(error)
            parsed = new Object();
        } finally {
            Settings.notable_death_color = parsed.notable_death_color ? parsed.notable_death_color : '#ff0000'
            Settings.unusual_death_color = parsed.unusual_death_color ? parsed.unusual_death_color : '#6495ed'
            Settings.warhead_color = parsed.warhead_color ? parsed.warhead_color : '#008080'
            Settings.logger_color = parsed.warhead_color ? parsed.logger_color : '#ffa500'
            Settings.dev_mode = parsed.dev_mode ? parsed.dev_mode : false
            Settings.SaveSettings()
            Settings.ApplySettings()
        }
    }

    static SaveSettings() {
        localStorage.setItem('settings', JSON.stringify({
            notable_death_color: Settings.notable_death_color,
            unusual_death_color: Settings.unusual_death_color,
            warhead_color: Settings.warhead_color,
            logger_color: Settings.logger_color,
            dev_mode: Settings.dev_mode,
        }))
        Settings.ApplySettings()
    }
    static ApplySettings() {
        window.document.getElementsByTagName('body')[0].style.setProperty("--notable_death", Settings.notable_death_color)
        window.document.getElementsByTagName('body')[0].style.setProperty("--unusual_death", Settings.unusual_death_color)
        window.document.getElementsByTagName('body')[0].style.setProperty("--warhead_event", Settings.warhead_color)
        window.document.getElementsByTagName('body')[0].style.setProperty("--logger_event", Settings.logger_color)
        if (Settings.dev_mode) {
            window.document.getElementById('dev_view').style.display = "block"
            window.document.getElementById('dev_bar').style.display = "block"
        }
        else {
            window.document.getElementById('dev_view').style.display = "none"
            window.document.getElementById('dev_bar').style.display = "none"
        }
    }
}
Settings.LoadSettings()