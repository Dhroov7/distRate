import { DistRate } from "../src";
import IORedis from "ioredis";

const redisClient = new IORedis.Cluster([
  {
    host: "127.0.0.1",
    port: 7000,
  },
]);

const rateLimiter = new DistRate({
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
