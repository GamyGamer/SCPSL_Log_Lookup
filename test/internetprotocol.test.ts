import { describe, it, beforeEach, expect } from '@jest/globals'
import { IPv4 } from '../src/internetprotocol'

let ArrayOfIPs: Array<IPv4> = []
let TestData = [
	'192.168.1.1',
	'192.168.1.2',
	'10.100.100.0',
	'10.200.10.0'
]

describe('IPv4', () => {
	beforeEach(() => {
		ArrayOfIPs = new Array()
		for (let index = 0; index < TestData.length; index++) {
			ArrayOfIPs.push(new IPv4(TestData[index]))
		}
	})
	it('Should return original value', () => {
		for (let index = 0; index < TestData.length; index++) {
			const OriginalValue = TestData[index];
			const SavedValue = ArrayOfIPs[index].getValue();
			let ar = new Array()
			OriginalValue.split('.').forEach(element => ar.push(Number.parseInt(element)))
			expect(ar[0]).toStrictEqual(SavedValue[0])
			expect(ar[1]).toStrictEqual(SavedValue[1])
			expect(ar[2]).toStrictEqual(SavedValue[2])
			expect(ar[3]).toStrictEqual(SavedValue[3])
		}
	})
	it('Should allow IPv4 class directly', () => {
		let IPV4 = new IPv4('192.168.100.100')
		let new_ip = ArrayOfIPs.push(new IPv4(IPV4)) - 1
		expect(ArrayOfIPs[new_ip].getValue()).toStrictEqual(new IPv4('192.168.100.100').getValue())
	})
	it('Should verify if valid IP string has been passed', () => {
		expect(() => { new IPv4('invalid') }).toThrow('invalid is not a valid IPv4')
		expect(() => { new IPv4('192.168.1.5.2') }).toThrow('192.168.1.5.2 is not a valid IPv4')
		expect(() => { new IPv4('10.1000.1.5') }).toThrow('10.1000.1.5 is not a valid IPv4')
	})
	describe('Decide if IP is the same/belongs to same network', () => {
		it('Should return true when comparing to itself', () => {
			for (let index = 0; index < ArrayOfIPs.length; index++) {
				const element = ArrayOfIPs[index];
				expect(element.IsSameNetwork(element)).toBeTruthy()
			}
		})
		it('Should return false when comparing to others', () => {
			for (let innerIndex = 0; innerIndex < ArrayOfIPs.length; innerIndex++) {
				for (let outerIndex = 0; outerIndex < ArrayOfIPs.length; outerIndex++) {
					if (innerIndex == outerIndex) {
						continue
					}
					const innerElement = ArrayOfIPs[innerIndex];
					const outerElement = ArrayOfIPs[outerIndex];
					expect(innerElement.IsSameNetwork(outerElement)).toBeFalsy()
				}
			}
		})
		it('Should throw because CIDR is invalid', () => {
			expect(() => { ArrayOfIPs[0].IsSameNetwork(ArrayOfIPs[1], '33') }).toThrow('CIDR size of 33 is too big for IPv4 (max: 32)')
			expect(() => { ArrayOfIPs[0].IsSameNetwork(ArrayOfIPs[1], '-1') }).toThrow('CIDR size of -1 is too small for IPv4 (min: 0)')
			expect(() => { ArrayOfIPs[0].IsSameNetwork(ArrayOfIPs[1], 'IamDefinitelyANumber') }).toThrow('CIDR is not a number and could not be parsed')
		})
		it('Should assert if provided IPs are in the same network based on CIDR', () => {
			expect(ArrayOfIPs[0].IsSameNetwork(ArrayOfIPs[1], 24)).toBeTruthy()
			expect(ArrayOfIPs[0].IsSameNetwork(ArrayOfIPs[2], 24)).toBeFalsy()
			expect(ArrayOfIPs[0].IsSameNetwork(ArrayOfIPs[1], 30)).toBeTruthy()
			expect(ArrayOfIPs[0].IsSameNetwork(ArrayOfIPs[1], 31)).toBeFalsy()
			expect(ArrayOfIPs[2].IsSameNetwork(ArrayOfIPs[3], 24)).toBeFalsy()
			expect(ArrayOfIPs[2].IsSameNetwork(ArrayOfIPs[3], 16)).toBeFalsy()
			expect(ArrayOfIPs[2].IsSameNetwork(ArrayOfIPs[3], 8)).toBeTruthy()
			expect(ArrayOfIPs[1].IsSameNetwork(ArrayOfIPs[3], 0)).toBeTruthy()
		})
	})
})
