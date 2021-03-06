"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogflareHttpClient = void 0;
var axios_1 = __importDefault(require("axios"));
var stream_1 = __importDefault(require("stream"));
var defaultOptions = {
    apiBaseUrl: "https://api.logflare.app",
};
var LogflareHttpClient = /** @class */ (function () {
    function LogflareHttpClient(options) {
        var _this = this;
        var _a;
        this._initializeResponseInterceptor = function () {
            _this.axiosInstance.interceptors.response.use(_this._handleResponse, _this._handleError);
        };
        this._handleResponse = function (_a) {
            var data = _a.data;
            return data;
        };
        this._handleError = function (error) { return Promise.reject(error); };
        var sourceToken = options.sourceToken, apiKey = options.apiKey, transforms = options.transforms, endpoint = options.endpoint;
        if (!sourceToken || sourceToken == "") {
            throw "Logflare API logging transport source token is NOT configured!";
        }
        if (!apiKey || apiKey == "") {
            throw "Logflare API logging transport api key is NOT configured!";
        }
        this.transforms = transforms;
        this.sourceToken = sourceToken;
        this.endpoint = endpoint;
        this.fromBrowser = (_a = options.fromBrowser) !== null && _a !== void 0 ? _a : false;
        this.apiKey = apiKey;
        this.axiosInstance = axios_1.default.create({
            baseURL: options.apiBaseUrl || defaultOptions.apiBaseUrl,
            headers: {
                "Content-Type": "application/json",
            },
        });
        this._initializeResponseInterceptor();
    }
    LogflareHttpClient.prototype.addLogEvent = function (logEvent) {
        return __awaiter(this, void 0, void 0, function () {
            var logEvents;
            return __generator(this, function (_a) {
                logEvents = Array.isArray(logEvent) ? logEvent : [logEvent];
                return [2 /*return*/, this.postLogEvents(logEvents)];
            });
        });
    };
    LogflareHttpClient.prototype.insertStream = function () {
        var self = this;
        var writeStream = new stream_1.default.Writable({
            objectMode: true,
            highWaterMark: 1,
        });
        writeStream._write = function (chunk, encoding, callback) {
            self.addLogEvent(chunk)
                .then(function () {
                callback(null);
            })
                .catch(callback);
        };
        return writeStream;
    };
    LogflareHttpClient.prototype.postLogEvents = function (batch) {
        return __awaiter(this, void 0, void 0, function () {
            var url, payload, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.endpoint === "typecasting") {
                            url = "/logs/typecasts?api_key=" + this.apiKey + "&source=" + this.sourceToken;
                        }
                        else {
                            url = "/logs?api_key=" + this.apiKey + "&source=" + this.sourceToken;
                        }
                        payload = {
                            batch: batch,
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.axiosInstance.post(url, payload)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        e_1 = _a.sent();
                        if (e_1.response) {
                            console.error("Logflare API request failed with " + e_1.response.status + " status: " + JSON.stringify(e_1.response.data));
                        }
                        else if (e_1.request) {
                            console.error("Logflare API request failed: " + e_1.request);
                        }
                        else {
                            console.error(e_1.message);
                        }
                        return [2 /*return*/, e_1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LogflareHttpClient.prototype.addTypecasting = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.axiosInstance.post("/sources/");
                return [2 /*return*/];
            });
        });
    };
    return LogflareHttpClient;
}());
exports.LogflareHttpClient = LogflareHttpClient;
//# sourceMappingURL=http_client.js.map