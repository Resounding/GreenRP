import {OrderCalculator} from '../../../../src/resources/models/order-calculator';
import {Zone} from '../../../../src/resources/models/zone';

describe('the order calculator', () => {
    let calculator,
        zones:Zone[] = [
            { name: 'A', tables: 100, autoSpace: false },
            { name: 'B', tables: 100, autoSpace: false },
            { name: 'C', tables: 100, autoSpace: false }
        ];


    beforeEach(() => {
        calculator = new OrderCalculator(zones);
    });

    it('contains the zones as a property', () => {
        expect(calculator.zones.length).toBe(zones.length);
    });

    it('sorts the zones by name', () => {
        zones.unshift({
            name: 'Z', tables: 100, autoSpace: false
        });
        calculator = new OrderCalculator(zones);
        expect(zones[0].name).toBe('Z');
        expect(calculator.zones[0].name).toBe('A');
        expect(calculator.zones[3].name).toBe('Z');
    });
});
