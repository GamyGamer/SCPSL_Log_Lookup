//@ts-check
class Settings {
    static notable_death_color = new String().toString();
    static unusual_death_color = new String().toString();
    static warhead_color = new String().toString();
    static logger_color = new String().toString();
    static dev_mode = new Boolean().valueOf();
    static alert_mode = new Boolean().valueOf();
    static strict_mode = new Boolean().valueOf();

    static LoadSettings() { //Loads settings from localstorage
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
            Settings.alert_mode = parsed.alert_mode ? parsed.alert_mode : false
            Settings.strict_mode = parsed.strict_mode ? parsed.strict_mode : false
            // Settings.SaveSettings()
            // Settings.ApplySettings()
        }
    }

    static SaveSettings() { // Saves current settings to localstorage
        localStorage.setItem('settings', JSON.stringify({
            notable_death_color: Settings.notable_death_color,
            unusual_death_color: Settings.unusual_death_color,
            warhead_color: Settings.warhead_color,
            logger_color: Settings.logger_color,
            dev_mode: Settings.dev_mode,
            alert_mode: Settings.alert_mode,
            strict_mode: Settings.strict_mode
        }))
    }
    static ApplySettings() { // Sets main page to correct configuration from loaded settings
        window.document.getElementsByTagName('body')[0].style.setProperty("--notable_death", Settings.notable_death_color);
        window.document.getElementsByTagName('body')[0].style.setProperty("--unusual_death", Settings.unusual_death_color);
        window.document.getElementsByTagName('body')[0].style.setProperty("--warhead_event", Settings.warhead_color);
        window.document.getElementsByTagName('body')[0].style.setProperty("--logger_event", Settings.logger_color);
        /**@type {HTMLInputElement} */ (window.document.getElementById('settings').children.namedItem('alert_mode')).checked = Settings.alert_mode;
        
        if (Settings.dev_mode) {
            window.document.getElementById('dev_view').style.display = "block"
            window.document.getElementById('dev_bar').style.display = "block"
        }
        else {
            window.document.getElementById('dev_view').style.display = "none"
            window.document.getElementById('dev_bar').style.display = "none"
        }

    }
    static RefreshSettings(){
        Settings.alert_mode = /**@type {HTMLInputElement} */ (window.document.getElementById('settings').children.namedItem('alert_mode')).checked ? true : false
        Settings.strict_mode = /**@type {HTMLInputElement} */ (window.document.getElementById('settings').children.namedItem('strict_mode')).checked ? true : false
        Settings.ApplySettings()
        Settings.SaveSettings()
    }
}

Settings.LoadSettings()
Settings.ApplySettings()