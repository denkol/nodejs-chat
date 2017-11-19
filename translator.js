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
  this.detect = function() {}
  this.getLangs = function() {
    /*
      Method GetLangs
      
      Docs: https://tech.yandex.com/translate/doc/dg/reference/getLangs-docpage/

    */
    return request(config.url); //Promise
  }
}