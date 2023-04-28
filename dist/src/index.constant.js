"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BACKOFF_MULTIPLIER = exports.INITIAL_BACKOFF_DELAY = exports.MAX_BACKOFF_DELAY = void 0;
exports.MAX_BACKOFF_DELAY = 5000; // maximum delay between retries in milliseconds
exports.INITIAL_BACKOFF_DELAY = 50; // initial delay between retries in milliseconds
exports.BACKOFF_MULTIPLIER = 1.5; // multiplier for increasing delay between retries
