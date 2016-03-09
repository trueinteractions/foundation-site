$(document).ready(function() {
	var ccformEdu = $('.cc-form-edu');
	var ccformCom = $('.cc-form-com');
	var ccformPro = $('.cc-form-pro');

	function submitOrder(form) {
		$.post('/api/order', form.serialize()).then(function(res) {
			$('.success-modal-content').html(res);
			$('#orderSuccessModal').foundation('reveal', 'open');
			form[0].reset();
		});
	}

	ccformEdu.on('submit', function(e) {
		e.preventDefault();
		submitOrder(ccformEdu);
	});

	ccformCom.on('submit', function(e) {
		e.preventDefault();
		submitOrder(ccformCom);
	});

	ccformPro.on('submit', function(e) {
		e.preventDefault();
		submitOrder(ccformPro);
	});
});
