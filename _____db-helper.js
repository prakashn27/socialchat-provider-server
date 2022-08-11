
// let map = new Map();
const axios = require("axios").default;

const URL = 'https://omnisack-slack.omnisack.workers.dev/';
const SLACK_TO_WA = 'slackToWa';
const WA_TO_SLACK = 'waToSlack';


async function postMessage(endpoint, key, val) {
  const url = `${URL}${endpoint}/${key}/${val}`;
  console.log(url);
  await axios({
        method: "POST", // Required, HTTP method, a string, e.g. POST, GET
        url: url
      });
}

async function getMessage(endpoint, key) {
  const url = `${URL}${endpoint}/${key}`;
  const val = await axios({
        method: "GET", // Required, HTTP method, a string, e.g. POST, GET
        url: url
      });
  return val;
}

async function dbGet(key) {
  return await getMessage(WA_TO_SLACK, key);
}

// set both waToSlack and slackToWa namespaces
async function dbSet(agentIdWithCustomerPhone, channelIdWithTs) {
  // map.set(key, val);
  await postMessage(WA_TO_SLACK, agentIdWithCustomerPhone, channelIdWithTs);
  await postMessage(SLACK_TO_WA, channelIdWithTs, agentIdWithCustomerPhone);
}

module.exports = {
  dbGet,
  dbSet
}