function init() {
    window.addEventListener('scroll', function(e){
        var distanceY = window.pageYOffset || document.documentElement.scrollTop,
            shrinkOn = 380,
            header = document.querySelector("header");
        if (distanceY > shrinkOn) {
            classie.add(header,"smaller");
        } else {
            if (classie.has(header,"smaller")) {
                classie.remove(header,"smaller");
            }
        }
    });

	var $latestRelease = $('.latest-release');
	$.getJSON('https://api.github.com/repos/trueinteractions/tint2/releases/latest', function(res) {
		$latestRelease.text(res.tag_name);
	});

	var $githubStars = $('.github-stars');
	$.getJSON('https://api.github.com/repos/trueinteractions/tint2', function(res) {
		$githubStars.text(res.stargazers_count.toLocaleString());
	});

}
window.onload = init();
