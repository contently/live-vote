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
    const fullKey = this.fullPath(key);
    console.log('load', fullKey);
    const strData = await this.loadExact(fullKey);
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

  async loadAll() {
    const allItems = await new Promise(async (resolve) => {
      const keys = await this.loadAllKeys();
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
    const target = this.fullPath(key);
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
    return [this.basePath, key].join(':');
  }
}

module.exports = Persistence;
