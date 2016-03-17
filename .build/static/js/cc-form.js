$(document).ready(function() {
	var ccformEdu = $('.cc-form-edu');
	var ccformCom = $('.cc-form-com');
	var ccformPro = $('.cc-form-pro');

	function submitOrder(form) {
    form.find('button[type=submit]').prop('disabled', true);
		$.post('/api/order', form.serialize())
      .success(function(res) {
        $('.success-modal-content').html(res);
        $('#orderSuccessModal').foundation('reveal', 'open');
        form[0].reset();
      }).error(function(err) {
        $('.cc-form-error').html(err.responseText);
        console.log(err);
    });
	}

	ccformEdu.on('submit', function(e) {
		e.preventDefault();
    $('.cc-form-error').html('');
    if (ccformEdu[0].checkValidity()) {
      return submitOrder(ccformEdu);
    } else {
      return null;
    }
	});

	ccformCom.on('submit', function(e) {
		e.preventDefault();
    $('.cc-form-error').html('');
    if (ccformCom[0].checkValidity()) {
      return submitOrder(ccformCom);
    } else {
      return null;
    }
	});

	ccformPro.on('submit', function(e) {
		e.preventDefault();
    $('.cc-form-error').html('');
    if (ccformPro[0].checkValidity()) {
      return submitOrder(ccformPro);
    } else {
      return null;
    }
	});
});
