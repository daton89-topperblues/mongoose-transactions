"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var main_1 = require("../src/main");
var mongoose = require("mongoose");
var options = {
    useMongoClient: true
};
// mongoose.Promise = global.Promise
mongoose.connection
    .on('error', function (err) { return console.warn('Warning', err); });
var personSchema = new mongoose.Schema({
    age: Number,
    name: String
});
var carSchema = new mongoose.Schema({
    age: Number,
    name: String
});
var Person = mongoose.model('Person', personSchema);
var Car = mongoose.model('Car', carSchema);
var transaction = new main_1.default();
function dropCollections() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.remove({})];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, Car.remove({})];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
describe('Transaction run ', function () {
    // Read more about fake timers: http://facebook.github.io/jest/docs/en/timer-mocks.html#content
    // jest.useFakeTimers();
    beforeAll(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mongoose.connect("mongodb://localhost/mongoose-transactions", options)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, dropCollections()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, dropCollections()];
                case 1:
                    _a.sent();
                    transaction.clean();
                    return [2 /*return*/];
            }
        });
    }); });
    test('insert', function () { return __awaiter(_this, void 0, void 0, function () {
        var person, jonathanObject, final, jonathan;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    person = "Person";
                    jonathanObject = {
                        age: 18,
                        name: 'Jonathan'
                    };
                    transaction.insert(person, jonathanObject);
                    return [4 /*yield*/, transaction.run().catch(console.error)];
                case 1:
                    final = _a.sent();
                    return [4 /*yield*/, Person.findOne(jonathanObject).exec()];
                case 2:
                    jonathan = _a.sent();
                    expect(jonathan.name).toBe(jonathanObject.name);
                    expect(jonathan.age).toBe(jonathanObject.age);
                    expect(final).toBeInstanceOf(Array);
                    expect(final.length).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('update', function () { return __awaiter(_this, void 0, void 0, function () {
        var person, tonyObject, nicolaObject, personId, final, nicola;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    person = "Person";
                    tonyObject = {
                        age: 28,
                        name: 'Tony'
                    };
                    nicolaObject = {
                        age: 32,
                        name: 'Nicola',
                    };
                    personId = transaction.insert(person, tonyObject);
                    transaction.update(person, personId, nicolaObject);
                    return [4 /*yield*/, transaction.run()];
                case 1:
                    final = _a.sent();
                    return [4 /*yield*/, Person.findOne(nicolaObject).exec()];
                case 2:
                    nicola = _a.sent();
                    expect(nicola.name).toBe(nicolaObject.name);
                    expect(nicola.age).toBe(nicolaObject.age);
                    expect(final).toBeInstanceOf(Array);
                    expect(final.length).toBe(2);
                    return [2 /*return*/];
            }
        });
    }); });
    test('remove', function () { return __awaiter(_this, void 0, void 0, function () {
        var person, bobObject, aliceObject, personId, final, bob, alice;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    person = "Person";
                    bobObject = {
                        age: 45,
                        name: 'Bob',
                    };
                    aliceObject = {
                        age: 23,
                        name: 'Alice',
                    };
                    personId = transaction.insert(person, bobObject);
                    transaction.update(person, personId, aliceObject);
                    transaction.remove(person, personId);
                    return [4 /*yield*/, transaction.run()];
                case 1:
                    final = _a.sent();
                    return [4 /*yield*/, Person.findOne(bobObject).exec()];
                case 2:
                    bob = _a.sent();
                    return [4 /*yield*/, Person.findOne(aliceObject).exec()];
                case 3:
                    alice = _a.sent();
                    expect(final).toBeInstanceOf(Array);
                    expect(final.length).toBe(3);
                    expect(alice).toBeNull();
                    expect(bob).toBeNull();
                    return [2 /*return*/];
            }
        });
    }); });
    test('Fail remove', function () { return __awaiter(_this, void 0, void 0, function () {
        var person, bobObject, aliceObject, personId, failObjectId, final, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    person = "Person";
                    bobObject = {
                        age: 45,
                        name: 'Bob',
                    };
                    aliceObject = {
                        age: 23,
                        name: 'Alice',
                    };
                    personId = transaction.insert(person, bobObject);
                    transaction.update(person, personId, aliceObject);
                    failObjectId = new mongoose.Types.ObjectId();
                    transaction.remove(person, failObjectId);
                    expect(personId).not.toEqual(failObjectId);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, transaction.run()];
                case 2:
                    final = _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    expect(error_1.executedTransactions).toEqual(2);
                    expect(error_1.remainingTransactions).toEqual(1);
                    expect(error_1.error.message).toBe('Entity not found');
                    expect(error_1.data).toEqual(failObjectId);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=main.spec.js.map