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
    /* other options */
};
mongoose.Promise = global.Promise; //tslintexclude
mongoose.connection
    .once('open', function () { })
    .on('error', function (err) { return console.warn('Warning', err); });
var personSchema = new mongoose.Schema({
    name: String,
    age: Number
});
var carSchema = new mongoose.Schema({
    name: String,
    age: Number
});
var Person = mongoose.model('Person', personSchema);
var Car = mongoose.model('Car', carSchema);
var transaction = new main_1.default();
describe('Transaction run function', function () {
    // Read more about fake timers: http://facebook.github.io/jest/docs/en/timer-mocks.html#content
    jest.useFakeTimers();
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
    test('Insert Person', function () { return __awaiter(_this, void 0, void 0, function () {
        var toni;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.create({ name: 'Toni', age: 22 })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, Person.findOne({ name: 'Toni' })];
                case 2:
                    toni = _a.sent();
                    expect(toni.name).toBe('Toni');
                    return [2 /*return*/];
            }
        });
    }); });
    test('Remove Person', function () { return __awaiter(_this, void 0, void 0, function () {
        var toni;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Person.remove({ name: 'Toni' })];
                case 1:
                    toni = _a.sent();
                    expect(toni.result.ok).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('Insert Car', function () { return __awaiter(_this, void 0, void 0, function () {
        var opel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Car.create({ name: 'Opel', age: 22 })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, Car.findOne({ name: 'Opel' })];
                case 2:
                    opel = _a.sent();
                    expect(opel.name).toBe('Opel');
                    return [2 /*return*/];
            }
        });
    }); });
    test('Remove Car', function () { return __awaiter(_this, void 0, void 0, function () {
        var opel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Car.remove({ name: 'Opel' })];
                case 1:
                    opel = _a.sent();
                    expect(opel.result.ok).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
    // transaction.insert('Person', {
    //     name: 'Nick',
    //     age: 33
    // })
    // transaction.insert('Person', {
    //     name: 'Toni',
    //     age: 28
    // })
    // transaction.insert('Car', {
    //     name: 'Opel',
    //     age: 1
    // })
    // transaction.run()
});
//# sourceMappingURL=main.spec.js.map