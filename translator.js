/*
  This file contains all the logic of interaction with the engine of the translator, you can use absolutely any API or write your own.
  Yandex API Translator https://tech.yandex.com/translate/doc/dg/concepts/About-docpage/ 
*/

var request = require('request-promise');

//URL and Key
var config = {
  url: "https://translate.yandex.net/api/v1.5/tr.json/",
  key: "trnsl.1.1.20160706T224459Z.8bd4ccff283a1e4d.2530860c792d839a3b9d68a48cfcfe51155bac1b"
};

module.exports = function() {
  this.translate = function(params) {
    /*
      Method Translate
      
      Docs: https://tech.yandex.com/translate/doc/dg/reference/translate-docpage/

    */
    
    var options = {
      uri: config.url + "translate",
      qs: {
        key: config.key,
        text: params.text,
        lang: params.lang
      },
      json: true // Automatically parses the JSON string in the response
    };

    return request(options); //Promise
  }
  this.getLangs = function(params) {
    /*
      Method getLangs
      
      Docs: https://tech.yandex.com/translate/doc/dg/reference/getLangs-docpage/

    */
    
    var options = {
      uri: config.url + "getLangs",
      qs: {
        key: config.key,
        ui: params.ui
      },
      json: true // Automatically parses the JSON string in the response
    };

    return request(options); //Promise
  }
}