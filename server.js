var express = require('express');
var app = express();
var port = process.env.PORT || 5000;
var AuthorizeNet = require('authorize-net');
var payments = new AuthorizeNet({
  API_LOGIN_ID: process.env.AUTHORIZE_NET_API_LOGIN,
  TRANSACTION_KEY: process.env.AUTHORIZE_NET_TRANSACTION_KEY
});

app.use(express.static('public'));

app.post('/api/order', function(req, res) {
	var order = req.data;
	var creditCard = {};
	var prospect = {};

	payments.authorizeTransaction(order, creditCard, prospect).then(function(res) {
		if ()
	}).catch(Error);
});

app.listen(port, function() {
	console.log('Listening on port: ', port);
});
