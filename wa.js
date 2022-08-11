const axios = require("axios").default;

const { getSlackDetails, getKey, setKey } = require('./redis-helper');
const slack = require('./slack.js');

const provider_key = 'wa';

function warun(app) {  
  // Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
  app.get("/wa/webhook", (req, res) => {
    /** UPDATE YOUR VERIFY TOKEN
    This will be the Verify Token value when you set up webhook**/
    const VERIFY_TOKEN = "1sack";

    // Parse params from the webhook verification request
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];

    // Check if a token and mode were sent
    if (mode && token) {
      // Check the mode and token sent are correct
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        // Respond with 200 OK and challenge token from the request
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);
      }
    }
  });
  
  app.post("/wa/webhook", async (req, res) => {
    // Parse the request body from the POST
    let body = req.body;

    // Check the Incoming webhook message
    console.log("Incoming webhook: " + JSON.stringify(req.body));

    // Validate the webhook
    if (req.body.object) {
      if (
        req.body.entry && req.body.entry[0].changes && req.body.entry[0].changes[0] && req.body.entry[0].changes[0].value.messages && req.body.entry[0].changes[0].value.messages[0]
      ) {
        let customer = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
        let client = req.body.entry[0].changes[0].value.metadata.phone_number_id;
        const key = client+'#'+customer
        let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload
        
        console.log('key', key);
        
        /*
        1. check if `conv_wa_{client}_{customer}` key is present
          2a. if so get a message and send reply
          2b. if not check if `main_wa_{client}` is present
            3. if so we get channel_id from this. and send a new message /wa/send
            4. save the return info to `conv_wa_{client}_{customer}` -> `slack_{channelid}_{ts}`
            5. reverse save `slack_{channelid}_{ts}`
        
        */
        try {
          const conv_key = `conv_wa_${client}_${customer}`;
          let conv_key_val = await getKey(conv_key);
          console.log('conv_key_val', conv_key_val);
          if (conv_key_val) {
            const spl = conv_key_val.split('_');
            const channel = spl[1], ts = spl[2];
            const team = 'T03G0TN96M8'; // TODO: get this, why?
            await slack.sendMessage(team, channel, msg_body, ts);
          } else {
            const main_key = `main_wa_${client}`; // TODO: add this mapping for wa_{client} to selected channel.
            const channel_id = await getKey(main_key);
            
            console.log(message);
            conv_key_val = `slack_${message.channel}_${message.ts}`;
            await setKey(conv_key, conv_key_val);
            await setKey(conv_key_val, conv_key);
          }
          res.sendStatus(200);
        } catch (err) {
          console.error(err);
          res.sendStatus(400);
        }
      }
    } else {
      // Return a '404 Not Found' if event is not from a whatsApp API
      res.sendStatus(404);
    }
  });

  

  // send message to wa client
  app.post("/wa/send", async (req, res) => {
    const body = req.body;
    console.log('wa/send/', body);
    const {client_id, customer_id, text} = body;

    sendMessage(client_id, customer_id, text)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      res.sendStatus(200);
    })
    .catch(function (error) {
      console.log(error);
      res.sendStatus(400);
    });
  })
}

async function sendMessage(client_id, consumer_id, text) {
  console.log('sendMessage', client_id, consumer_id, text);
  // const token = ''; // TODO: get from DB for client_id
  const wa_token = 'EAAGmI7l0eWoBACdY3kPdCZBEbnINW1myqvB1AAZAlV2aCBv8zCKZCFEiqaXKDqJOesAkz7m0IuIAOuhJYOX57tD7kjdhRhjXwUam3NsfcjU1jxyOKZA4KjSWduSaXK4MiFU4AjKtoNE16kgDDBmMYSOqdPuviXyTDseHSbdLakzDztQoLkTp';
  const url = `https://graph.facebook.com/v14.0/${client_id}/messages?access_token=${wa_token}`;
  
  const data = JSON.stringify({
    messaging_product: "whatsapp",
    to: consumer_id,
    text: { body: text },
  });

  const config = {
    method: 'post',
    url: url,
    headers: {
      'Content-Type': 'application/json'
    },
    data : data
  };

  return axios(config)
}

//publishMessage("C12345", "Hello world :tada:");
module.exports = {
  warun
}