const { WebClient, LogLevel } = require("@slack/web-api");
const { getKey } = require('./redis-helper.js');

// WebClient instantiates a client that can call API methods
// When using Bolt, you can use either `app.client` or the `client` passed to listeners.
// const TOKEN='xoxb-3544940312722-3766614187415-rwNkDfWhojos7Zt4ovLpBc2Q';

// // Post a message to a channel your app is in using ID and message text
// async function publishMessage(agentIdWithCustomer, id, text) {
//   try {
//     // check if the conversation already exists
//     const val = (await dbGet(agentIdWithCustomer)).data.data;
//     console.log('key',agentIdWithCustomer,'->', val);
//     if (val === undefined || val === null) {
//       // Call the chat.postMessage method using the built-in WebClient    
//       const result = await client.chat.postMessage({
//         // The token you used to initialize your app
//         token: TOKEN,
//         channel: id,
//         text: text
//         // You could also use a blocks[] array to send richer content
//       });
//       const channelIdWithTs = id+'-'+ result.message.ts
//       console.log('setting waToSlack', agentIdWithCustomer, '->', channelIdWithTs);
//       await dbSet(agentIdWithCustomer, channelIdWithTs);

//       // Print result, which includes information about the message (like TS)
//       console.log('slack publish', result);
//     } else {
//       const spls = val.split('-');
//       const channel = spls[0], ts = spls[1];
//       // Call the chat.postMessage method using the built-in WebClient    
//       const result = await client.chat.postMessage({
//         token: TOKEN,
//         channel: id,
//         text: text,
//         thread_ts: ts
//       });
//       console.log('slack publish', result);
//     }
    
//   }
//   catch (error) {
//     console.error(error);
//   }
// }

async function sendMessage(team_id, channel, text, ts = null) {
  console.log('sending msg', team_id, channel, text, ts);
  const TOKEN = await getKey(`bottoken_${team_id}`);
  console.log('TOKEN', TOKEN, channel);
  const client = new WebClient(TOKEN, {
    // LogLevel can be imported and used to make debugging simpler
    logLevel: LogLevel.DEBUG
  });
  
  // const token = await getKey(`bottoken_${team_id}`)
  if (!ts) {
    const result = await client.chat.postMessage({
        token: TOKEN,
        channel: channel,
        text: text
      });
    return result;
  } else {
    const result = await client.chat.postMessage({
        token: TOKEN,
        channel: channel,
        text: text,
        thread_ts: ts
      });
    return result;
  }
}
function formatPhoneNumber(phoneNumberString) {
  var cleaned = ('' + phoneNumberString).replace(/\D/g, '');
  var match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return ['(', match[2], ') ', match[3], '-', match[4]].join('');
  }
  return null;
}

async function sendFirstTextMessage(team_id, channel_id, client_id, customer) {
  
  const TOKEN = await getKey(`bottoken_${team_id}`);
  console.log('TOKEN', TOKEN, channel_id);
  const client = new WebClient(TOKEN, {
    // LogLevel can be imported and used to make debugging simpler
    logLevel: LogLevel.DEBUG
  });
  
  // const token = await getKey(`bottoken_${team_id}`)
  
  

  const result = await client.chat.postMessage({
      token: TOKEN,
      channel: channel_id,
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `:inbox_tray: New message from ${formatPhoneNumber(client_id)} - ${formatPhoneNumber(customer)}`
          }
        }
      ]
    });
  return result;
}

//publishMessage("C12345", "Hello world :tada:");
module.exports = {
  // publishMessage,
  sendMessage,
  sendFirstTextMessage
}
