"use strict";

const RedisClient = require("./redis_client");

module.exports = class Singleflight {
  constructor(options) {
    this.client = new RedisClient(options);
  }

  /**
   * @description 执行
   * @param {string} key
   * @param {Function} func
   * @param {number} timeout
   * @return
   */
  async do(key, func, timeout = 10) {
    const lock = await this.client.lock(key, timeout);
    if (!lock) {
      const result = await this.client.sub(key);
      this.client.disconnect();
      return result;
    }
    const result = await func();
    await this.client.pub(key, result);
    await this.client.unlock(key);
    this.client.disconnect();
    return result;
  }
};
