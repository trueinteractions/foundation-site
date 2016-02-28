require('dotenv').config();
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var port = process.env.PORT || 5000;

var AuthorizeNet = require('authorize-net');
var payments = new AuthorizeNet({
	API_LOGIN_ID: process.env.AUTHORIZE_NET_API_LOGIN,
	TRANSACTION_KEY: process.env.AUTHORIZE_NET_TRANSACTION_KEY
});

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/api/order', function(req, res) {
	var details = req.body;
	console.log(details);
	var order = {
		amount: details.amount
	};
	var creditCard = {
		creditCardNumber: details.creditCardNumber,
		expirationMonth: details.expirationMonth,
		expirationYear: details.expirationYear,
		cvv: details.cvv
	};
	var prospect = {
		customerFirstName: details.customerFirstName,
		customerLastName: details.customerLastName,
		customerEmail: details.customerEmail,
		billingAddress: details.billingAddress,
		billingCity: details.billingCity,
		billingState: details.billingState,
		billingZip: details.billingZip,
		billingCountry: details.billingCountry
	};

	payments.submitTransaction(order, creditCard, prospect).then(function(response) {
		console.log(response);
		// res.send({
		// 	transactionId: res.transactionId,
		// 	message: 'Thank you for you purchase. You will receive an email for you records.'
		// });
	});
});

app.listen(port, function() {
	console.log('Listening on port: ', port);
});
