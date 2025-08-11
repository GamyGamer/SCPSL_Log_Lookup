import { EventType } from "./gameevent";
import { KeyframeData } from "./keyframedata";

/**
 * Stores information about events that occured at specific time
 */
class Keyframe {
	private timestamp: Date;
	private serverlogtype: EventType.ServerLogType
	private module: EventType.Modules
	private data: KeyframeData
	constructor(date: Date | string, serverlogtype: EventType.ServerLogType, modules: EventType.Modules, data: KeyframeData) {
		if (typeof date == 'string') {
			this.timestamp = new Date(date);
		}

		else {
			this.timestamp = date;
		}

		if (Number.isNaN(this.timestamp.valueOf())) {
			throw new Error(`Provided date is invalid: ${date}`);
		}

		this.serverlogtype = serverlogtype;
		this.module = modules;
		this.data = data
	}
	GetTimestamp(): Date {
		return this.timestamp;
	}
	SetTimestamp(date: Date | string): void {
		if (typeof date == 'string') {
			this.timestamp = new Date(date);
		}
		else {
			this.timestamp = date;
		}
		if (Number.isNaN(this.timestamp.valueOf())) {
			throw new Error(`Provided date is invalid: ${date}`);
		}
	}
	GetServerLogType(): EventType.ServerLogType {
		return this.serverlogtype
	}
	SetServerLogType(serverLogTypeName: EventType.ServerLogType): void {
		this.serverlogtype = serverLogTypeName
	}
	GetModule(): EventType.Modules {
		return this.module
	}
	SetModule(moduleName: EventType.Modules): void {
		this.module = moduleName;
	}
	GetData(): KeyframeData {
		return this.data
	}
	SetData(data: KeyframeData) {
		this.data = data
	}
}

export { Keyframe }