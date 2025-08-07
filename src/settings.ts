interface SettingsStorage {
	notable_death_color: string;
	unusual_death_color: string;
	warhead_color: string;
	logger_color: string;
	dev_mode: boolean;
	alert_mode: boolean;
	strict_mode: boolean;
}

class Settings {
	static notable_death_color: string;
	static unusual_death_color: string;
	static warhead_color: string;
	static logger_color: string;
	static dev_mode: boolean;
	static alert_mode: boolean;
	static strict_mode: boolean;

	static LoadSettings() { //Loads settings from localstorage
		let parsed = <SettingsStorage>new Object();
		try {
			let settingStorageString = localStorage.getItem('settings')
			if (settingStorageString == null || settingStorageString == 'not avaliable') { parsed = <SettingsStorage>new Object(); }
			else if (typeof settingStorageString == 'string') { parsed = <SettingsStorage>JSON.parse(settingStorageString); }
			else { throw new Error(`Error while loading settings, type is ${typeof settingStorageString}, ${settingStorageString}`); }
		} catch (error) {
			console.error(error)
			parsed = <SettingsStorage>new Object();
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
		window.document.getElementsByTagName('body')[0]!.style.setProperty("--notable_death", Settings.notable_death_color);
		window.document.getElementsByTagName('body')[0]!.style.setProperty("--unusual_death", Settings.unusual_death_color);
		window.document.getElementsByTagName('body')[0]!.style.setProperty("--warhead_event", Settings.warhead_color);
		window.document.getElementsByTagName('body')[0]!.style.setProperty("--logger_event", Settings.logger_color);
		(<HTMLInputElement>window.document.getElementById('settings')?.children.namedItem('alert_mode')).checked = Settings.alert_mode;
		if (Settings.dev_mode) {
			window.document.getElementById('dev_view')!.style.display = "block";
			window.document.getElementById('dev_bar')!.style.display = "block";
		}
		else {
			window.document.getElementById('dev_view')!.style.display = "none";
			window.document.getElementById('dev_bar')!.style.display = "none";
		}

	}
	static RefreshSettings() {
		Settings.alert_mode = (<HTMLInputElement>window.document.getElementById('settings')?.children.namedItem('alert_mode')).checked ? true : false
		Settings.strict_mode = (<HTMLInputElement>window.document.getElementById('settings')?.children.namedItem('strict_mode')).checked ? true : false
		Settings.ApplySettings()
		Settings.SaveSettings()
	}
}

export { Settings }