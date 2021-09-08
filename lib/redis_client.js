"use strict";

const Redis = require("ioredis");

const { v1: uuid } = require("uuid");

module.exports = class RedisClient {
  constructor(options = {}) {
    this.redis = new Redis({
      host: options.host || "127.0.0.1",
      port: options.port || 6379,
      password: options.password || "",
    });
    this.clientId = uuid();
  }

  /**
   * @description 获取锁
   * @param {string} key
   * @param {number} timeout
   * @returns {boolean}
   */
  async lock(key, timeout = 10) {
    const result = await this.redis.set(
      key,
      this.clientId,
      "EX",
      timeout,
      "NX"
    );
    return result === "OK";
  }

  /**
   * @description 释放锁
   * @param {string} key
   * @return {boolean}
   */
  async unlock(key) {
    const script = `
    if redis.call('get',KEYS[1]) == ARGV[1] then
      return redis.call('del',KEYS[1]) 
    else
      return 0`;
    const result = await this.redis.eval(script, 1, key, this.clientId);
    return Boolean(result);
  }

  /**
   * @description 订阅
   * @param {string} channel
   * @returns {string}
   * @returns
   */
  async sub(channel) {
    return new Promise((resolve, reject) => {
      this.redis.subscribe(channel);
      this.redis.on("message", (chan, message) => {
        if (channel !== chan) {
          return;
        }
        resolve(message);
      });
      this.redis.on("error", (error) => {
        reject(error);
      });
    });
  }

  /**
   *
   * @param {string} channel
   * @param {string} message
   * @returns
   */
  async pub(channel, message) {
    return this.redis.publish(channel, message);
  }
};
