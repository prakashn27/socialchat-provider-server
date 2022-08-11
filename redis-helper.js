const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL
});

client.on('error', (err) => console.log('Redis Client Error', err));

async function initClient() {
  await client.connect();
}

async function getKey(key) {
  const val = await client.get(key);
  console.log('getKey', key, val);
  return val
}

async function setKey(key, val) {
  console.log('setKey', key, val);
  return await client.set(key, val);
}

async function getSlackDetails(provider_key, id) {
  console.log('getSlackDetails', provider_key, id);
  return await client.get(`${provider_key}#${id}`);
}

async function setSlackDetails(provider_key, id, val) {
  await client.connect();
  return await client.set(`${provider_key}#${id}`, val);
}

module.exports = { initClient, getSlackDetails, setSlackDetails, getKey, setKey };