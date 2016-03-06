$(document).ready(function() {
	var ccformEdu = $('.cc-form-edu');
	var ccformCom = $('.cc-form-com');
	var ccformPro = $('.cc-form-pro');

	ccformEdu.on('submit', function(e) {
		e.preventDefault();
		$.post('/api/order', ccformEdu.serialize()).then(function(res) {
			$('.success-modal-content').html(res);
			$('#orderSuccessModal').foundation('reveal', 'open');
			ccformEdu[0].reset();
		});
	});

	ccformCom.on('submit', function(e) {
		e.preventDefault();
		$.post('/api/order', ccformCom.serialize()).then(function(res) {
			console.log(res);
		});
	});

	ccformPro.on('submit', function(e) {
		e.preventDefault();
		$.post('/api/order', ccformPro.serialize()).then(function(res) {
			console.log(res);
		});
	});
});
