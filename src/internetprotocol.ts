type InternetProtocol = IPv4 //| IPv6

export class IPv4 {
    readonly type = 'IPv4';
    private value: Uint8ClampedArray
    constructor(input: IPv4 | string) {
        this.value = new Uint8ClampedArray(4)
        if (typeof input == 'string') {
            let parsed = input.split('.')
            if (parsed.length != 4) {
                throw new Error(`${input} is not a valid IPv4`);
            }
            for (let index = 0; index < this.value.length; index++) {
                this.value[index] = Number.parseInt(parsed[index])
                if (this.value[index] != Number.parseInt(parsed[index])) {
                    throw new Error(`${input} is not a valid IPv4`);
                }
            }
        }
        else {
            this.value = input.value
        }
    }
    IsSameNetwork(IP: IPv4, CIDR?: number | string): boolean {
        let localIP = this.bits
        let remoteIP = IP.bits
        if (typeof CIDR != 'undefined') {
            if (typeof CIDR == 'string') {
                CIDR = Number.parseInt(CIDR);
                if (Number.isNaN(CIDR)) {
                    throw new Error(`CIDR is not a number and could not be parsed`);
                }
            }
            if (CIDR > 32) {
                throw new Error(`CIDR size of ${CIDR} is too big for IPv4 (max: 32)`);
            }
            if (CIDR < 0) {
                throw new Error(`CIDR size of ${CIDR} is too small for IPv4 (min: 0)`);
            }

            localIP = localIP.slice(0, CIDR).padEnd(32, '0')
            remoteIP = remoteIP.slice(0, CIDR).padEnd(32, '0')
        }
        if (localIP === remoteIP) {
            return true
        }
        else {
            return false
        }
    }
    public get bits(): string {
        let output: string = ''
        this.value.forEach(element => {
            output += Number(element).toString(2).padStart(8, '0')
        });
        return output
    }
    getValue(): Uint8ClampedArray {
        return this.value
    }
}

export { InternetProtocol }