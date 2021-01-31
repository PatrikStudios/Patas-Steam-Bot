const SteamUser = require('steam-user');
const SteamTotp = require('steam-totp');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
const TeamFortress2 = require('tf2');
const community = new SteamCommunity();
const prices = require('./prices.json');
const config = require('./config.json');

const client = new SteamUser();
const tf2 =new TeamFortress2(client);
const manager = new TradeOfferManager ({
	steam: client,
	community: community,
	language: 'en'
});

const logOnOptions = {
	accountName: config.username,
	password: config.password,
	twoFactorCode: SteamTotp.generateAuthCode(config.sharedSecret)
};

client.logOn(logOnOptions);

client.on('loggedOn', () => {
	console.log("Úspěšně Přihlášen!");
	client.setPersona(SteamUser.EPersonaState.Online);
	client.gamesPlayed(["Bot Game XD",440]);
});

client.on("friendMessage", function(steamID, message) {
	if(message == "hi"){
		client.chatMessage(steamID, "hello!");
	}
});

client.on('webSession', (sessionid, cookies) => {
	manager.setCookies(cookies);
	
	community.SetCookies(cookies);
	community.startConfirmationChecker(20000, config.identitySecret);
});

function acceptOffer(offer){
	offer.accept((err) => {
		community.checkConfirmations();
		console.log("We Accepted an offer");
		if (err) console.log("There was an error accepting the offer.");
	});
}

function declineOffer(offer){
	offer.decline((err) => {
		console.log("We Declined an offer");
		if (err) console.log("There was an error declining the offer.");
	});
}

function processOffer(offer) {
	if (offer.isGlitched() || offer.state === 11) {
		console.log("Offer was glitched, declining.");
		declineOffer(offer);
	} else if (offer.partner.getSteamID64() === config.ownerID) {
		acceptOffer(offer);
	} else {
		var ourItems = offer.itemsToGive;
		var theirItems = offer.itemsToReceive;
		var ourValue = 0;
		var theirValue = 0;
		for (var i in ourItems){
			var item = ourItems[i].market_name;
			if (Prices[items]) {
				ourValue += Prices[item].sell;
			} else {
				console.log("Invalid Value.")
				ourValue += 99999;
			}
		}
		for (var  i in theirItems) {
			var item = theirItems[i].market_name;
			if(Prices[item]) {
				theirValue += Prices[item].buy;
			} else {
			console.log("Their value was different.");
			}
		} 
	}
	console.log("Our value: " + ourValue);
	console.log("Their value: " + theirValue);
	
	if (ourValue  <= theirValue) {
		acceptOffer(offer);
	} else {
		declineOffer(offer);
	}
}

client.setOption("promptSteamGuardCode", false);

manager.on('newOffer', (offer => {
	if (offer.partner.getSteamID64() === config.ownerID) {
		acceptOffer(offer);
	} else {
		declineOffer(offer);
	}
	processOffer(offer);
}));

var scrapAmt = 25;
var pollCraft = 30;

tf2.on('connectedToGC', function () {
	console.log("Connected to tf2 game server.");
});

tf2.on('backpackLoaded', function () {
	console.log("Loaded our backpack.");
});

function craftS(amtNeedScrap) {
	if (tf2.backpack == undefined) {
		console.log("unable to load backpack, can't craft.");
		return
	} else {
		console.log("attempting to craft...");
		var amtOfScrap = 0;
		for (var i = 0; i < tf2.backpack.length; i++) {
			if (tf2.backpack[i].defIndex === 5000) {
				amtOfScrap++;
			}
		}
		for (var i = 0; i < tf2.backpack.length; i++) {
			if (tf2.backpack[i].defIndex === 5002) {
				amtOfScrap += 9;
				var beep = new Array;
				beep.push(parseInt(tf2.backpack[i].id));
				tf2.craft(beep);
		} else if (tf2.backpack[i].defIndex === 5001) {
				amtOfScrap += 3;
				var beep = new Array;
				beep.push(parseInt(tf2.backpack[i].id));
				tf2.craft(beep);
			
			}
			if (amtOfScrap >= amtNeedScrap) {
				break;
			}
		}
	}
}

tf2.on('craftingComplete', function(e) {
	console.log("Finished crafting.");
});

client.on('friendMessage#' + config.ownerID, function(steamID, message) {
	if (message == "craft") {
		craftS(scrapAmt);
		console.log("Received order to craft  from admin.");
	} else {
		console.log("craft error.");
	}
});

setInterval(function() {
	craftS(scrapAmt);
}, 1000 * 60 * pollCraft);