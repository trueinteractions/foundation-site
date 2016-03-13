require('dotenv').config();
require('./mail-in/mailin');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var compress = require('compression');
var port = process.env.PORT || 5000;

var AuthorizeNet = require('authorize-net');
var payments = new AuthorizeNet({
  API_LOGIN_ID: process.env.AUTHORIZE_NET_API_LOGIN,
  TRANSACTION_KEY: process.env.AUTHORIZE_NET_TRANSACTION_KEY
});

var mail = new Mailin('https://api.sendinblue.com/v2.0', process.env.MAIL_SERVER_API);

app.use(compress());
app.use(express.static('.build'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'jade');

app.post('/api/order', function(req, res) {
  var details = req.body;

  function splitName(name) {
    var n = name.split(' ');
    var last = n.pop();
    var first = n.join(' ');
    return {
      first: first,
      last: last
    };
  }

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
    customerFirstName: splitName(details.customerName).first,
    customerLastName: splitName(details.customerName).last,
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

    var transaction = {
      to: {},
      from: ['sales@trueinteractions.com'],
      html: '',
      subject: 'Your Recent Tint 2 Purchase',
      name: details.customerName,
      amount: details.amount,
      version: details.version,
      transactionId: response.transactionId,
      prod: !!process.env.PRODUCTION
    };

    transaction.to[details.customerEmail] = details.customerName;

    // Render success template for email and client
    app.render('order-success', transaction, function(err, html) {
      transaction.html = html;

      if (err) {
        res.send(err);
      } else {
        mail.send_email(transaction).on('complete', function(data) {
          console.log(data);
        });
        res.send(html);
      }
    });

  }).catch(function(err) {
    if (err) {
      res.status(422).send(err.message);
    }
    console.log(err);
  });

});

app.listen(port, function() {
  console.log('Listening on port: ', port);
});
