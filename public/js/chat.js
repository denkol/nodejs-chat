 // This file is executed in the browser, when people visit /chat/<random id>

$(function(){
	
	//API Yandex.Translate 
	var url = "https://translate.yandex.net/api/v1.5/tr.json/";
	var key = "trnsl.1.1.20160706T224459Z.8bd4ccff283a1e4d.2530860c792d839a3b9d68a48cfcfe51155bac1b";
	
	//API's methods
	var action = {
  	translate : "translate",
  	detect : "detect",
  	getLangs : "getLangs" 
	};
	
	//Параметры отправляемые в API Яндекс.Переводчик
	var sendData = {
  	"key" : key,
	};
	
	//Язык системы или браузера (должна определяться автоматически)
	var browserLang = navigator.language.split('-')[0];
	
	//Language when text be translated
	var translateLang; 

	// getting the id of the room from the url
	var id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);

	// connect to the socket
	var socket = io();
	
	// variables which hold the data for each person
	var name = "",
		email = "",
		img = "",
		friend = "";

	// cache some jQuery objects
	var section = $(".section"),
		footer = $("footer"),
		onConnect = $(".connected"),
		inviteSomebody = $(".invite-textfield"),
		personInside = $(".personinside"),
		chatScreen = $(".chatscreen"),
		left = $(".left"),
		noMessages = $(".nomessages"),
		tooManyPeople = $(".toomanypeople");

	// some more jquery objects
	var chatNickname = $(".nickname-chat"),
		leftNickname = $(".nickname-left"),
		loginForm = $(".loginForm"),
		yourName = $("#yourName"),
		yourEmail = $("#yourEmail"),
		yourLang = $("#yourSelect"),
		hisName = $("#hisName"),
		hisEmail = $("#hisEmail"),
		hisLang = $("#hisSelect"),
		chatForm = $("#chatform"),
		textarea = $("#message"),
		messageTimeSent = $(".timesent"),
		chats = $(".chats");

	// these variables hold images
	var ownerImage = $("#ownerImage"),
		leftImage = $("#leftImage"),
		noMessagesImage = $("#noMessagesImage");


	// on connection to server get the id of person's room
	socket.on('connect', function(){
		socket.emit('load', id);
	});

	// save the gravatar url
	socket.on('img', function(data){
		img = data;
	});

	// receive the names and avatars of all people in the chat room
	socket.on('peopleinchat', function(data){

		if(data.number === 0){
			
			showSelect(yourLang);
			
			showMessage("connected");

			loginForm.on('submit', function(e){

				e.preventDefault();

				name = $.trim(yourName.val());
				
				if(name.length < 1){
					alert("Please enter a nick name longer than 1 character!");
					return;
				}
				
				lang = yourLang.val();
				
				email = yourEmail.val();

				if(!isValid(email)) {
					alert("Please enter a valid email!");
				}
				
				else {

					showMessage("inviteSomebody");

					// call the server-side function 'login' and send user's parameters
					socket.emit('login', {user: name, avatar: email, lang: lang, id: id});
				}
			
			});
		}

		else if(data.number === 1) {

			showSelect(hisLang);
			
			showMessage("personinchat",data);

			loginForm.on('submit', function(e){

				e.preventDefault();

				name = $.trim(hisName.val());

				if(name.length < 1){
					alert("Please enter a nick name longer than 1 character!");
					return;
				}

				if(name == data.user){
					alert("There already is a \"" + name + "\" in this room!");
					return;
				}
				
				lang = hisLang.val();

				email = hisEmail.val();

				if(!isValid(email)){
					alert("Wrong e-mail format!");
				}

				else {
					socket.emit('login', {user: name, avatar: email, lang: lang, id: id});
				}

			});
		}

		else {
			showMessage("tooManyPeople");
		}

	});

	// Other useful 

	socket.on('startChat', function(data){
		console.log(data);
		if(data.boolean && data.id == id) {

			chats.empty();

			if(name === data.users[0]) {
				showMessage("youStartedChatWithNoMessages",data);
			}
			else {
				showMessage("heStartedChatWithNoMessages",data);
			}

			//Changing langs
			if(data.langs.length >= 2) {
				if(name === data.users[0]) {
					translateLang = data.langs[0]+"-"+data.langs[1]; //1st
				}else{
					translateLang = data.langs[1]+"-"+data.langs[0]; //2st
				}
			}

			chatNickname.text(friend);
		}
	});

	socket.on('leave',function(data){

		if(data.boolean && id==data.room){

			showMessage("somebodyLeft", data);
			chats.empty();
		}

	});

	socket.on('tooMany', function(data){

		if(data.boolean && name.length === 0) {

			showMessage('tooManyPeople');
		}
	});

	socket.on('receive', function(data){

		showMessage('chatStarted');

		if(data.msg.trim().length) {
			createChatMessage(data.msg, data.user, data.img, moment());
			scrollToBottom();
		}
	});

	textarea.keypress(function(e){

		// Submit the form on enter

		if(e.which == 13) {
			e.preventDefault();
			chatForm.trigger('submit');
		}

	});

	chatForm.on('submit', function(e){

		e.preventDefault();

		// Create a new chat message and display it directly
		sendData.text = textarea.val(); //Сообщение 
  	sendData.lang = translateLang; //Язык перевода
		console.log("Translate: " + translateLang)

		//Send request to Yandex.API
		$.getJSON(url + action.translate, sendData, function(responseData){
    		
    	//Save result
    	var message = responseData.text + ''; 

    	showMessage("chatStarted");

			if(textarea.val().trim().length) {
				createChatMessage(textarea.val(), name, img, moment());
				scrollToBottom();

				// Send the message to the other person in the chat
				socket.emit('msg', {msg: message, user: name, img: img});

			}
			// Empty the textarea
			textarea.val("");
  	});
		
	});

	// Update the relative time stamps on the chat messages every minute

	setInterval(function(){

		messageTimeSent.each(function(){
			var each = moment($(this).data('time'));
			$(this).text(each.fromNow());
		});

	},60000);

	// Function that creates a new chat message

	function createChatMessage(msg,user,imgg,now){

		var who = '';

		if(user===name) {
			who = 'me';
		}
		else {
			who = 'you';
		}

		var li = $(
			'<li class=' + who + '>'+
				'<div class="image">' +
					'<img src=' + imgg + ' />' +
					'<b></b>' +
					'<i class="timesent" data-time=' + now + '></i> ' +
				'</div>' +
				'<p></p>' +
			'</li>');

		// use the 'text' method to escape malicious user input
		li.find('p').text(msg);
		li.find('b').text(user);

		chats.append(li);

		messageTimeSent = $(".timesent");
		messageTimeSent.last().text(now.fromNow());
	}

	function scrollToBottom(){
		$("html, body").animate({ scrollTop: $(document).height()-$(window).height() },1000);
	}

	function isValid(thatemail) {

		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(thatemail);
	}

	function showMessage(status,data){

		if(status === "connected"){

			section.children().css('display', 'none');
			onConnect.fadeIn(1200);
		}

		else if(status === "inviteSomebody"){

			// Set the invite link content
			$("#link").text(window.location.href);

			onConnect.fadeOut(1200, function(){
				inviteSomebody.fadeIn(1200);
			});
		}

		else if(status === "personinchat"){

			onConnect.css("display", "none");
			personInside.fadeIn(1200);

			chatNickname.text(data.user);
			ownerImage.attr("src",data.avatar);
		}

		else if(status === "youStartedChatWithNoMessages") {

			left.fadeOut(1200, function() {
				inviteSomebody.fadeOut(1200,function(){
					noMessages.fadeIn(1200);
					footer.fadeIn(1200);
				});
			});

			friend = data.users[1];
			noMessagesImage.attr("src",data.avatars[1]);
		}

		else if(status === "heStartedChatWithNoMessages") {

			personInside.fadeOut(1200,function(){
				noMessages.fadeIn(1200);
				footer.fadeIn(1200);
			});

			friend = data.users[0];
			noMessagesImage.attr("src",data.avatars[0]);
		}

		else if(status === "chatStarted"){

			section.children().css('display','none');
			chatScreen.css('display','block');
		}

		else if(status === "somebodyLeft"){

			leftImage.attr("src",data.avatar);
			leftNickname.text(data.user);

			section.children().css('display','none');
			footer.css('display', 'none');
			left.fadeIn(1200);
		}

		else if(status === "tooManyPeople") {

			section.children().css('display', 'none');
			tooManyPeople.fadeIn(1200);
		}
	}
	
	function showSelect(select) {
		sendData.ui = browserLang; //Option language
		$.getJSON(url + action.getLangs, sendData, function(response){
			var langs = response.langs;
			$.each(langs, function(key, value) {
    		select.append('<option value=' + key + '>' + value + '</option>');
			});
			select.val(browserLang); //Set default lang
			select.prop('disabled', false); //Enable <select>
		});
		delete sendData.ui;
	}

});
