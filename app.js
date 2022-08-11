/*
  All the server code for providers to be configured here
*/

"use strict";

// Imports dependencies and set up http server
const express = require("express"),
  body_parser = require("body-parser"),
  app = express().use(body_parser.json()); // creates express http server
  app.use(body_parser.urlencoded({extended: false}));
const { warun } = require("./wa.js");
const { smsrun } = require("./sms.js");
const { initClient } = require("./redis-helper");

initClient().then(console.log("redis client connected successfully"));

app.get('/status', (req, res) => {res.sendStatus(200)});

warun(app);
smsrun(app);

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log("server is running"));
