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
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
var lodash_1 = require("lodash");
var RedisLock = require("ioredis-lock");
var RateLimiter = /** @class */ (function () {
    function RateLimiter(options) {
        this.tokens = options.tokens;
        this.duration = options.duration;
        this._redisClient = options.redisClient;
        this._redisLock = RedisLock.createLock(this._redisClient, {
            timeout: 5000,
        });
        console.log(options, "-------options");
    }
    RateLimiter.prototype.execute = function (uniqueId) {
        return __awaiter(this, void 0, void 0, function () {
            var redisKey, currentTime, userBucket, allowRequest, localUserBucket, timeDiff, newTokens, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        redisKey = "RT:".concat(uniqueId), currentTime = Math.floor(Date.now() / 1000);
                        return [4 /*yield*/, this._redisLock.acquire("lock:".concat(redisKey))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this._redisClient.hgetall(redisKey)];
                    case 2:
                        userBucket = _a.sent(), allowRequest = false;
                        if (!(0, lodash_1.isEmpty)(userBucket)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this._redisClient.hmset(redisKey, {
                                tokens: this.tokens - 1,
                                lastCall: currentTime,
                            })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 4:
                        localUserBucket = {
                            tokens: parseInt(userBucket.tokens),
                            lastCall: parseInt(userBucket.lastCall),
                        };
                        timeDiff = currentTime - parseInt(userBucket.lastCall), newTokens = (timeDiff * this.tokens) / this.duration;
                        localUserBucket.tokens = localUserBucket.tokens + newTokens;
                        localUserBucket.lastCall = currentTime;
                        if (localUserBucket.tokens > this.tokens) {
                            localUserBucket.tokens = this.tokens;
                        }
                        if (localUserBucket.tokens >= 1) {
                            localUserBucket.tokens -= 1;
                            allowRequest = true;
                        }
                        return [4 /*yield*/, Promise.all([
                                this._redisClient.hmset(redisKey, localUserBucket),
                                this._redisLock.release(),
                            ])];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, allowRequest];
                    case 6:
                        err_1 = _a.sent();
                        return [2 /*return*/, false];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return RateLimiter;
}());
exports.RateLimiter = RateLimiter;
