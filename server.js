var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var port = process.env.PORT || 5000;
var AuthorizeNet = require('authorize-net');
// var payments = new AuthorizeNet({
//   API_LOGIN_ID: process.env.AUTHORIZE_NET_API_LOGIN,
//   TRANSACTION_KEY: process.env.AUTHORIZE_NET_TRANSACTION_KEY
// });

var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(express.static('public'));

app.post('/api/order', urlencodedParser, function(req, res) {
	console.log(req.body);
	var order = {};
	var creditCard = {};
	var prospect = {};

	res.redirect('/');

	// payments.authorizeTransaction(order, creditCard, prospect).then(function(res) {
	// 	res.send({
	// 		transactionId: res.transactionId,
	// 		message: 'Thank you for you purchase. You will receive an email for you records.'
	// 	});
	// }).catch(res.send);
});

app.listen(port, function() {
	console.log('Listening on port: ', port);
});
