const {SHA256} = require('crypto-js');

var message = 'I am a user number 3';
var hash = SHA256(message).toString();

console.log(`message: ${message}`);
console.log(`HASH: ${hash}`);