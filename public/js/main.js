// This file is executed in the browser, when people visit /chat/<random id>

$(function () {

  // API Yandex.Translate 
  var url = "https://translate.yandex.net/api/v1.5/tr.json/";
  var key = "trnsl.1.1.20160706T224459Z.8bd4ccff283a1e4d.2530860c792d839a3b9d68a48cfcfe51155bac1b";

  // API's methods
  var action = {
    translate: "translate",
    detect: "detect",
    getLangs: "getLangs"
  };

  // send data to API Yandex
  var sendData = {
    "key": key,
  };

  // browser languge
  var browserLang = navigator.language.split('-')[0];

  // language when text be translated
  var translateLang;

  // getting the id of the room from the url
  var id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);

  // connect to the socket
  var socket = io();

  // variables which hold the data for each person
  var name = "",
    friend = "";

  // cache some jQuery objects
  var section = $(".section"),
    messagesWindow = $(".chat__messages"),
    footer = $("footer");

  // states
  var onConnect = $("#connected"),
    inviteSomebody = $("#invite-textfield"),
    personInside = $("#personinside"),
    chatScreen = $("#chatscreen"),
    left = $("#left"),
    noMessages = $("#nomessages"),
    tooManyPeople = $("#toomanypeople");

  // some more jquery objects
  var chatNickname = $(".nickname-chat"),
    profileNickname = $(".profileName"),
    profileCountry = $(".profileCountry"),
    noMessages = $(".noMessages"),
    leftNickname = $(".nickname-left"),
    loginForm = $(".loginForm"),
    yourName = $("#yourName"),
    yourLang = $("#yourSelect"),
    hisName = $("#hisName"),
    hisLang = $("#hisSelect"),
    chatForm = $("#chatform"),
    textarea = $("#message"),
    messageTimeSent = $(".timesent"),
    chats = $(".messageFlow");

  // these variables hold images
  var ownerImage = $("#ownerImage"),
    leftImage = $("#leftImage"),
    noMessagesImage = $("#noMessagesImage");


  // on connection to server get the id of person's room
  socket.on('connect', function () {
    socket.emit('load', id);
  });

  // receive the names and avatars of all people in the chat room
  socket.on('peopleinchat', function (data) {
    if (data.number === 0) {

      getLangs(yourLang); //Get language list from Yandex API
      showMessage("connected");

      loginForm.on('submit', function (e) {

        e.preventDefault();

        name = $.trim(yourName.val());

        if (name.length < 1) {
          alert("Please enter a nick name longer than 1 character!");
          return;
        }

        lang = yourLang.val();

        showMessage("inviteSomebody");

        // call the server-side function 'login' and send user's parameters
        socket.emit('login', {
          user: name,
          lang: lang,
          id: id
        });
      });
    } else if (data.number === 1) {

      getLangs(hisLang); //Get language list from Yandex API

      showMessage("personinchat", data);

      loginForm.on('submit', function (e) {

        e.preventDefault();

        name = $.trim(hisName.val());

        if (name.length < 1) {
          alert("Please enter a nick name longer than 1 character!");
          return;
        }

        if (name == data.user) {
          alert("There already is a \"" + name + "\" in this room!");
          return;
        }

        lang = hisLang.val();
        socket.emit('login', {
          user: name,
          lang: lang,
          id: id
        });

      });
    } else {
      showMessage("tooManyPeople");
    }

  });

  // Other useful 

  socket.on('startChat', function (data) {
    console.log(data);
    if (data.boolean && data.id == id) {

      chats.empty();

      if (name === data.users[0]) {
        showMessage("youStartedChatWithNoMessages", data);
      } else {
        showMessage("heStartedChatWithNoMessages", data);
      }

      //Changing langs
      if (data.langs.length >= 2) {
        if (name === data.users[0]) {
          translateLang = data.langs[0] + "-" + data.langs[1]; //1st
        } else {
          translateLang = data.langs[1] + "-" + data.langs[0]; //2st
        }
      }

      chatNickname.text(friend);
    }
  });

  socket.on('leave', function (data) {

    if (data.boolean && id == data.room) {

      showMessage("somebodyLeft", data);
      chats.empty();
    }

  });

  socket.on('tooMany', function (data) {

    if (data.boolean && name.length === 0) {

      showMessage('tooManyPeople');
    }
  });

  socket.on('receive', function (data) {

    showMessage('chatStarted');

    if (data.msg.trim().length) {
      createChatMessage(data.msg, data.user, moment());
      scrollToBottom();
    }
  });

  textarea.keypress(function (e) {

    // Submit the form on enter

    if (e.which == 13) {
      e.preventDefault();
      chatForm.trigger('submit');
    }

  });

  chatForm.on('submit', function (e) {
    //Submitting form
    e.preventDefault();

    // create a new chat message and display it directly
    sendData.text = textarea.val(); // message
    sendData.lang = translateLang; // language

    // send request to Yandex.API
    $.getJSON(url + action.translate, sendData, function (responseData) {

      // save result
      var message = responseData.text.toString();

      showMessage("chatStarted");

      if (textarea.val().trim().length) {
        createChatMessage(textarea.val(), name, moment());
        scrollToBottom();

        // Send the message to the other person in the chat
        socket.emit('msg', {
          msg: message,
          user: name
        });
      }
      clearTextarea();
      
    });
  });

  updateMessageTimeAgo();

  
  function createChatMessage(msg, user, now) {
    // function that creates a new chat message
    
    var messageWrap = '',
      messageWho = '';

    if (user === name) {
      messageWrap = 'messageToWrap';
      messageWho = 'messageTo';
    } else {
      messageWrap = 'messageFromWrap';
      messageWho = 'messageFrom';
    }

    var li = $(
      '<div class=' + messageWrap + '>' +
      '<h1 class="messageSender">' + user + '</h1>' +
      '<li class=' + messageWho + '>' +
      '<p class="messageText">' + msg + '</p>' +
      '<span class="messageMeta">' + now + '</span>' +
      '</li>' +
      '</div>');

    chats.append(li);

    messageTimeSent = $(".messageMeta");
    messageTimeSent.last().text(now.fromNow());
  }

  function scrollToBottom() {
    messagesWindow.animate({
      scrollTop: messagesWindow[0].scrollHeight
    }, 1);
  }

  function showMessage(status, data) {
    switch(status) {
      case "connected": {
        titleChange('Create room - Translator');
        section.children().addClass('hide');
        onConnect.removeClass('hide');
        break;
      }
      case "inviteSomebody": {
        titleChange('Invite somebody - Translator');
        section.children().addClass('hide');
        inviteSomebody.removeClass('hide');
        // set the invite link content
        $("#link").text(window.location.href);
        break;
      }
      case "personinchat": {
        titleChange('Join to ' + data.user + ' - Translator');
        section.children().addClass('hide');
        personInside.removeClass('hide');        
        chatNickname.text(data.user);
        break;
      }
      case "youStartedChatWithNoMessages": {
        titleChange('Chat with ' + data.users[1] + ' - Translator');
        section.children().addClass('hide');
        chatScreen.removeClass('hide');
        profileNickname.text(data.users[1]);
        break;
      }
      case "heStartedChatWithNoMessages": {
        titleChange('Chat with ' + data.users[0] + ' - Translator');
        section.children().addClass('hide');
        chatScreen.removeClass('hide');
        profileNickname.text(data.users[0]);
        break;
      }
      case "chatStarted": {
        section.children().addClass('hide');
        noMessages.addClass('hide');
        chatScreen.removeClass('hide');
        break;
      }
      case "somebodyLeft": {
        titleChange('Somebody left - Translator');
        section.children().addClass('hide');
        left.removeClass('hide');
        leftNickname.text(data.user);
        break;
      }
      case "tooManyPeople": {
        titleChange('To many people - Translator');
        section.children().addClass('hide');
        tooManyPeople.removeClass('hide');
        break;
      }
      default: {
        break;
      }
    }
  }


  function getLangs(select) {

    // Add lang to send params
    sendData.ui = browserLang;

    // Request to API 
    $.getJSON(url + action.getLangs, sendData, function (response) {
      var langs = response.langs;

      if (langs) {
        $.each(langs, function (key, value) {
          select.append('<option value=' + key + '>' + value + '</option>');
        });
        select.val(browserLang); // set default lang
        select.prop('disabled', false); // enable <select>
      } else {
        select.prop('disabled', true); // disable <select>	
        console.warn('Lang <select> inactive, because network unavaible. ');
      }

    });

    // Remove lang from send params when function end
    delete sendData.ui;
  }

  function titleChange(title) {
    // This function change page title
    document.title = title;
  }

  function clearTextarea() {
    // Empty the textarea
    textarea.val("");
    return true;
  }

  function updateMessageTimeAgo() {
    // Update the relative time stamps on the chat messages every minute
    setInterval(function () {
      messageTimeSent.each(function () {
        var each = moment($(this).data('time'));
        $(this).text(each.fromNow());
      });

    }, 60000);
  }

   function isValid(thatemail) {
     // Validate email
     var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
     return re.test(thatemail);
   }

});
