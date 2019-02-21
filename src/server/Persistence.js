// const redis = require("redis");
// const client = redis.createClient();
const path = require('path');

class Persistence {
  constructor(redisClient, basePath = '') {
    this.redis = redisClient;
    this.basePath = basePath;
  }

  async persist(key, data) {
    const serializedData = typeof data === 'string' ? data : JSON.stringify(data);
    await this.redis.set(this.fullPath(key), serializedData);
  }

  async load(key) {
    const strData = await this.loadExact(path.join(this.basePath, key));
    return JSON.parse(strData);
  }

  async loadExact(key) {
    console.log('load-exact', key);
    return new Promise((resolve, reject) => {
      this.redis.get(key, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
  }

  async loadAll(key) {
    const allItems = await new Promise(async (resolve) => {
      const keys = await this.loadAllKeys(key);
      resolve(
        await Promise.all(keys.map(async (k) => {
          const strData = await this.loadExact(k);
          return JSON.parse(strData);
        }))
      );
    });
    return allItems;
  }

  async loadAllKeys(key = '*') {
    const target = path.join(this.basePath, key);
    console.log('load-all-keys', target);
    return new Promise((resolve, reject) => {
      this.redis.keys(target, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
  }

  fullPath(key) {
    return path.join(this.basePath, key);
  }
}

module.exports = Persistence;
