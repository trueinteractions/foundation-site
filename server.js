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

app.use(express.static('.build'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'jade');

app.post('/api/order', function(req, res) {
	var details = req.body;
	var order = {
		amount: details.amount
	};
	var creditCard = {
		creditCardNumber: details.creditCardNumber,
		expirationMonth: details.expirationMonth,
		expirationYear: details.expirationYear,
		cvv2: details.cvv
	};
	var prospect = {
		customerFirstName: details.customerFirstName,
		customerLastName: details.customerLastName,
		customerEmail: details.customerEmail,
		billingAddress: details.billingAddress,
		billingCity: details.billingCity,
		billingState: details.billingState,
		billingZip: details.billingZip,
		billingCountry: details.billingCountry,

		shippingFirstName: details.customerFirstName,
		shippingLastName: details.customerLastName,
		shippingAddress: details.billingAddress,
		shippingCity: details.billingCity,
		shippingState: details.billingState,
		shippingZip: details.billingZip,
		shippingCountry: details.billingCountry
	};

	payments.submitTransaction(order, creditCard, prospect).then(function(response) {
		console.log(response);

		var tempVars = {
			name: details.customerFirstName + ' ' + details.customerLastName,
			transactionId: response.transactionId
		};

		app.render('order-success', tempVars, function(err, html) {
			if (err) {
				res.send(err);
			} else {
				res.send(html);
			}
		});

	}).catch(res.send);
});

app.listen(port, function() {
	console.log('Listening on port: ', port);
});
