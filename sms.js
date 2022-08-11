const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const { getKey, setKey } = require('./redis-helper');
const slack = require('./slack');
const MessagingResponse = require('twilio').twiml.MessagingResponse;


function smsrun(app) { 
  app.get('/sms/status', (req, res) => {
    res.sendStatus(200);
  });
  app.post("/sms/incoming", async (req, res) => {
    /* TODO:
    1. check if we already have a thread for {clientNo}_{userNo}
    2a. if so use the thread slack_{channel}_{ts} to send message
    2b. if not, create a message in slack, then send a message to that thread.
    */
    /*
    sms/incoming [Object: null prototype] {

  ToCountry: 'CA',

  ToState: 'QC',

  SmsMessageSid: 'SMad6b5d16797c54bcf67212bce186cc45',

  NumMedia: '0',

  ToCity: 'Drummondville',

  FromZip: '',

  SmsSid: 'SMad6b5d16797c54bcf67212bce186cc45',

  FromState: 'Ontario',

  SmsStatus: 'received',

  FromCity: 'Toronto',

  Body: 'Jin',

  FromCountry: 'CA',

  To: '+18737001230',

  ToZip: '',

  NumSegments: '1',

  ReferralNumMedia: '0',

  MessageSid: 'SMad6b5d16797c54bcf67212bce186cc45',

  AccountSid: 'AC288a631baae45083a3b05ef5d6369c65',

  From: '+14372493566',

  ApiVersion: '2010-04-01'

}*/
    
    console.log('sms/incoming', req.body);
    const body = req.body;
    let client = body.To, customer = body.From, msg_body = body.Body;
    if (client.charAt(0) === '+') client = client.substring(1)
    if (customer.charAt(0) === '+') customer = customer.substring(1)
    const team = 'T03G0TN96M8'; // TODO: get this, why?
    
    try {
      const conv_key = `conv_sms_${client}_${customer}`;
      let conv_key_val = await getKey(conv_key);
      console.log('conv_key_val', conv_key_val);
      if (conv_key_val) {
        const spl = conv_key_val.split('_');
        const channel = spl[1], ts = spl[2];

        await slack.sendMessage(team, channel, msg_body, ts);
      } else {
        const main_key = `provider_sms_${client}`; // TODO: add this mapping for wa_{client} to selected channel.
        const team_channel = await getKey(main_key);
        if (!team_channel) {
          console.log('team_channel is null for ', main_key);
          res.sendStatus(400);
          return;
        }
        
        const spl = team_channel.split('_');
        const team_id = spl[0], channel_id = spl[1];
        // create a conversation.
        const first_message = await slack.sendFirstTextMessage(team_id, channel_id, client, customer);
        const thread_ts = first_message.message.ts;
        console.log('first_message', first_message);
        const message = await slack.sendMessage(team_id, channel_id, msg_body, thread_ts || null);
        console.log(message);
        conv_key_val = `slack_${message.channel}_${thread_ts}`;
        await setKey(conv_key, conv_key_val);
        await setKey(conv_key_val, conv_key);
      }
      const twiml = new MessagingResponse();
      res.writeHead(200, {'Content-Type': 'text/xml'});
      res.end(twiml.toString());
    } catch (err) {
      console.error(err);
      res.sendStatus(400);
    }
    
  });
  
  app.post("/sms/outgoing", async (req, res) => {
    // console.log('sms/outgoing', req);
    const {text, from, to} = req.body;
    try {
      const message = await client.messages
          .create({
             body: text,
             from: from,
             to: to
           })
      console.log('success', message);
    } catch(err) {
      console.error(err);
      res.sendStatus(400);
    }
    
  });
  app.post("/slack/interactive", async (req, res) => {
    console.log('int body', req.body);
    res.sendStatus(200);
  });
}

module.exports = { smsrun }