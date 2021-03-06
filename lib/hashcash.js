var crypto = require('crypto');
var os = require('os');
var hostname = os.hostname();

var requests = 0;
var HashCash = function() {

	return function(req,res,next) {

		// check header for challenge answer
		var start = new Date().getTime();
		var answer = req.headers['hashcash-answer'];
		var challenge = req.headers['hashcash-challenge'];
		var still_pending;
		if(req.session[challenge]) {
			still_pending = (start - req.session[challenge]) <= 4000;
			if(!still_pending) {
				delete req.session[challenge];
			}
		}


		if(!answer || !challenge || !still_pending) {
			var shasum = crypto.createHash('sha1');
			var rand = Math.random();
			shasum.update(hostname);
			shasum.update(''+new Date().getTime())
			shasum.update(req.url);
			shasum.update(''+requests);
			
			var digest = shasum.digest('hex');
			shasum = crypto.createHash('sha1');
			shasum.update(digest);
			shasum.update(''+rand);
			challenge = shasum.digest('hex');
			req.session[challenge] = start;
		
			res.header('hashcash-challenge',challenge);
			res.send('Answer challenge to complete request.');

		} else {
			var shasum = crypto.createHash('sha1');
			shasum.update(challenge);
			shasum.update(answer);
			var digest = shasum.digest('hex');
			var solved = digest.slice(0,3) === "000";
			if(solved) {
				next();
			} else {
				res.header('hashcash-challenge',challenge);
				res.send('Wrong answer to challenge.');
			}
		}

		requests++;

	};
};

exports.middleware = HashCash;
