"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
const ioredis_1 = __importDefault(require("ioredis"));
const redisClient = new ioredis_1.default.Cluster([
    {
        host: "127.0.0.1",
        port: 7000,
    },
]);
const rateLimiter = new src_1.DistRate({
    duration: 60,
    tokens: 10,
    redisClient: redisClient,
});
rateLimiter
    .execute(`hdfuegf478-7584675-bnfuirgf`)
    .then((result) => console.log(result));
// setInterval(() => {
//     rateLimiter.execute(`hdfuegf478-7584675-bnfuirgf`).then(result => console.log(result));
// }, 100);
