"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("../src");
var ioredis_1 = require("ioredis");
var redisClient = new ioredis_1.default.Cluster([{
        host: '127.0.0.1',
        port: 7000
    }]);
var rateLimiter = new src_1.RateLimiter({ duration: 60, tokens: 10, redisClient: redisClient });
