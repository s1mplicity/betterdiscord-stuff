//META{"name":"silentTyping"}*//
var silentTyping=function(){};silentTyping.prototype.start=function(){$("body").on("input.silentTyping",".channel-textarea textarea",false);};silentTyping.prototype.stop=function(){$("body").off("input.silentTyping",".channel-textarea textarea");};silentTyping.prototype.load=function(){};silentTyping.prototype.unload=function(){};silentTyping.prototype.getName=function(){return"Silent Typing";};silentTyping.prototype.getDescription=function(){return"Don't send typing notifications";};silentTyping.prototype.getVersion=function(){return"1.0.0";};silentTyping.prototype.getAuthor=function(){return"noodlebox";};