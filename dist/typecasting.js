"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyNumberToStringTypecasting = exports.applyCustomTypecasting = void 0;
var lodash_1 = __importDefault(require("lodash"));
var big_integer_1 = __importDefault(require("big-integer"));
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var decimal_js_1 = require("decimal.js");
var preprocessNumbers = function (value, keys, typecasts) {
    var type = typeof value;
    if (type == "number" ||
        type == "bigint" ||
        big_integer_1.default.isInstance(value) ||
        bignumber_js_1.default.isBigNumber(value) ||
        decimal_js_1.Decimal.isDecimal(value)) {
        rememberTypecastings(typecasts, keys, "number_to_string");
        return value.toString();
    }
    else {
        return value;
    }
};
var rememberTypecastings = function (typecasts, keys, type) {
    if (type === "number_to_string") {
        typecasts.push({
            path: keys,
            from: "string",
            to: "float",
        });
    }
};
var applyCustomTypecasting = function (payload, typecastingRules) {
    var _a = applyNumberToStringTypecasting(payload), body = _a.body, typecasts = _a.typecasts;
    return { body: body, typecasts: typecasts };
};
exports.applyCustomTypecasting = applyCustomTypecasting;
var applyNumberToStringTypecasting = function (payload) {
    var typecasts = [];
    var body = __assign(__assign({}, payload), {
        metadata: mapValuesDeep(payload.metadata, preprocessNumbers, [], typecasts),
    });
    typecasts = lodash_1.default.map(typecasts, function (_a) {
        var path = _a.path, from = _a.from, to = _a.to;
        var filteredKeys = path.filter(function (k) { return lodash_1.default.isString(k); });
        return {
            path: __spreadArrays(["metadata"], filteredKeys),
            from: from,
            to: to,
        };
    });
    return {
        body: body,
        typecasts: typecasts,
    };
};
exports.applyNumberToStringTypecasting = applyNumberToStringTypecasting;
var mapValuesDeep = function (obj, fn, path, typecasts) {
    var mapFn = function (container, mapper) {
        if (lodash_1.default.isPlainObject(container)) {
            return lodash_1.default.mapValues(container, mapper);
        }
        else if (lodash_1.default.isArray(container)) {
            return lodash_1.default.map(container, mapper);
        }
    };
    return mapFn(obj, function (val, key) {
        var keyPathNext = path.concat(key);
        return lodash_1.default.isPlainObject(val) || lodash_1.default.isArray(val)
            ? mapValuesDeep(val, fn, keyPathNext, typecasts)
            : fn(val, keyPathNext, typecasts);
    });
};
//# sourceMappingURL=typecasting.js.map