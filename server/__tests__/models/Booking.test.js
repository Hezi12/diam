const mongoose = require('mongoose');

// Mock mongoose before requiring the model
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');

  // We need to capture the schema definition so we can inspect it
  const schemaInstances = [];
  const originalSchema = actualMongoose.Schema;

  class MockSchema extends originalSchema {
    constructor(definition, options) {
      super(definition, options);
      schemaInstances.push({ definition, options, instance: this });
    }
  }

  // Copy static properties (like Types)
  MockSchema.Types = originalSchema.Types;

  return {
    ...actualMongoose,
    Schema: MockSchema,
    model: jest.fn((name, schema) => {
      return { modelName: name, schema };
    }),
    __schemaInstances: schemaInstances
  };
});

// Now require the model (which will use the mocked mongoose)
const BookingModel = require('../../models/Booking');

describe('Booking Model', () => {
  let schemaDefinition;
  let schemaInstance;

  beforeAll(() => {
    // Get the schema definition that was passed to the Schema constructor
    const bookingSchemaData = mongoose.__schemaInstances[0];
    schemaDefinition = bookingSchemaData.definition;
    schemaInstance = bookingSchemaData.instance;
  });

  describe('Schema Required Fields', () => {
    it('should require firstName', () => {
      expect(schemaDefinition.firstName).toBeDefined();
      expect(schemaDefinition.firstName.required).toBe(true);
    });

    it('should require checkIn', () => {
      expect(schemaDefinition.checkIn).toBeDefined();
      expect(schemaDefinition.checkIn.required).toBe(true);
    });

    it('should require checkOut', () => {
      expect(schemaDefinition.checkOut).toBeDefined();
      expect(schemaDefinition.checkOut.required).toBe(true);
    });

    it('should require room', () => {
      expect(schemaDefinition.room).toBeDefined();
      expect(schemaDefinition.room.required).toBe(true);
    });

    it('should require location', () => {
      expect(schemaDefinition.location).toBeDefined();
      expect(schemaDefinition.location.required).toBe(true);
    });

    it('should require price', () => {
      expect(schemaDefinition.price).toBeDefined();
      expect(schemaDefinition.price.required).toBe(true);
    });

    it('should not require lastName', () => {
      expect(schemaDefinition.lastName).toBeDefined();
      expect(schemaDefinition.lastName.required).toBe(false);
    });
  });

  describe('guestName Virtual Field', () => {
    it('should define a guestName virtual', () => {
      const virtuals = schemaInstance.virtuals;
      expect(virtuals).toHaveProperty('guestName');
    });

    it('should return "firstName lastName" when both are present', () => {
      const getter = schemaInstance.virtuals.guestName.getters[0];
      const context = { firstName: 'John', lastName: 'Doe' };
      const result = getter.call(context);
      expect(result).toBe('John Doe');
    });

    it('should return empty string when firstName is missing', () => {
      const getter = schemaInstance.virtuals.guestName.getters[0];
      const context = { firstName: '', lastName: 'Doe' };
      const result = getter.call(context);
      expect(result).toBe('');
    });

    it('should return empty string when lastName is missing', () => {
      const getter = schemaInstance.virtuals.guestName.getters[0];
      const context = { firstName: 'John', lastName: '' };
      const result = getter.call(context);
      expect(result).toBe('');
    });

    it('should return empty string when both names are missing', () => {
      const getter = schemaInstance.virtuals.guestName.getters[0];
      const context = { firstName: undefined, lastName: undefined };
      const result = getter.call(context);
      expect(result).toBe('');
    });
  });

  describe('Nights Calculation', () => {
    it('should define nights field with a default function', () => {
      expect(schemaDefinition.nights).toBeDefined();
      expect(typeof schemaDefinition.nights.default).toBe('function');
    });

    it('should calculate nights correctly for a 3-night stay', () => {
      const defaultFn = schemaDefinition.nights.default;
      const context = {
        checkIn: new Date(Date.UTC(2025, 0, 1)),  // Jan 1, 2025
        checkOut: new Date(Date.UTC(2025, 0, 4))   // Jan 4, 2025
      };
      const result = defaultFn.call(context);
      expect(result).toBe(3);
    });

    it('should calculate nights correctly for a 1-night stay', () => {
      const defaultFn = schemaDefinition.nights.default;
      const context = {
        checkIn: new Date(Date.UTC(2025, 5, 10)),  // June 10, 2025
        checkOut: new Date(Date.UTC(2025, 5, 11))   // June 11, 2025
      };
      const result = defaultFn.call(context);
      expect(result).toBe(1);
    });

    it('should return 1 when checkIn or checkOut is missing', () => {
      const defaultFn = schemaDefinition.nights.default;
      const contextNoCheckIn = { checkIn: null, checkOut: new Date() };
      expect(defaultFn.call(contextNoCheckIn)).toBe(1);

      const contextNoCheckOut = { checkIn: new Date(), checkOut: null };
      expect(defaultFn.call(contextNoCheckOut)).toBe(1);
    });

    it('should handle month boundary correctly', () => {
      const defaultFn = schemaDefinition.nights.default;
      const context = {
        checkIn: new Date(Date.UTC(2025, 0, 30)),  // Jan 30
        checkOut: new Date(Date.UTC(2025, 1, 2))    // Feb 2
      };
      const result = defaultFn.call(context);
      expect(result).toBe(3);
    });
  });

  describe('paymentStatus Enum Values', () => {
    it('should define paymentStatus with enum values', () => {
      expect(schemaDefinition.paymentStatus).toBeDefined();
      expect(schemaDefinition.paymentStatus.enum).toBeDefined();
      expect(Array.isArray(schemaDefinition.paymentStatus.enum)).toBe(true);
    });

    it('should include unpaid as the default payment status', () => {
      expect(schemaDefinition.paymentStatus.default).toBe('unpaid');
    });

    it('should include all expected payment status values', () => {
      const expectedValues = [
        'unpaid',
        'cash',
        'cash2',
        'credit_or_yehuda',
        'credit_rothschild',
        'transfer_mizrahi',
        'bit_mizrahi',
        'paybox_mizrahi',
        'transfer_poalim',
        'bit_poalim',
        'paybox_poalim',
        'delayed_transfer',
        'other'
      ];
      expect(schemaDefinition.paymentStatus.enum).toEqual(expectedValues);
    });

    it('should have exactly 13 payment status options', () => {
      expect(schemaDefinition.paymentStatus.enum).toHaveLength(13);
    });
  });

  describe('Location Enum Values', () => {
    it('should only allow airport and rothschild as locations', () => {
      expect(schemaDefinition.location.enum).toEqual(['airport', 'rothschild']);
    });
  });

  describe('Status Enum Values', () => {
    it('should have correct booking status options', () => {
      expect(schemaDefinition.status.enum).toEqual([
        'pending', 'confirmed', 'cancelled', 'completed'
      ]);
    });

    it('should default to pending', () => {
      expect(schemaDefinition.status.default).toBe('pending');
    });
  });
});
