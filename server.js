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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'jade');
// for PCI DDS, not sure why they care..
app.disable('x-powered-by');
/// this must come first.
if(process.env.NODE_ENV === 'production') {
  app.all('*',function(req,res,next){
    if(req.headers['x-forwarded-proto'] !== 'https') {
      res.header('Strict-Transport-Security','max-age=500');
      res.header('X-Frame-Options','DENY');
      res.header('Server','');
      res.redirect(301, 'https://www.trueinteractions.com'+req.url);
    } else {
      next();
    }
  });
  app.all('*',function(req,res,next) {
    res.header('Strict-Transport-Security','max-age=500');
    res.header('X-Frame-Options','DENY');
    res.header('Server','');
    next();
  });
}

function deny405(req, res, next) {
  res.status(405).send('Method Not Allowed');
  res.end();
}

// more pci dss req.
app.options('*', deny405);
app.checkout('*', deny405);
app.connect('*', deny405);
app.copy('*', deny405);
app.delete('*', deny405);
app.lock('*', deny405);
app.merge('*', deny405);
app.mkactivity('*', deny405);
app.mkcol('*', deny405);
app.move('*', deny405);
app['m-search']('*', deny405);
app.notify('*', deny405);
app.patch('*', deny405);
app.propfind('*', deny405);
app.proppatch('*', deny405);
app.purge('*', deny405);
app.report('*', deny405);
app.search('*', deny405);
app.subscribe('*', deny405);
app.trace('*', deny405);
app.unlock('*', deny405);
app.unsubscribe('*', deny405);
// end more pci req.

app.use(express.static('.build'));
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

  var licenses = {
    Educational: 99.00,
    Professional: 299.00,
    Commercial: 499.00
  };

  var order = {
    amount: licenses[details.version]
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
      amount: order.amount,
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

app.get('/docs', function(req, res) {
  res.redirect('/docs/tutorial-gettingstarted.html');
});

app.get('/tint2/docs', function(req, res) {
  res.redirect('/docs/tutorial-gettingstarted.html');
});

// MUST BE LAST.
app.use(function(req, res, next) {
  res.status(404).send('Sorry cant find that!');
});

app.listen(port, function() {
  console.log('Listening on port: ', port);
});
