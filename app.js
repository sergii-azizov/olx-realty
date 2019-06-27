const http = require('http');
const needle = require('needle');
const TelegramBot = require('node-telegram-bot-api');

const helpers = require('./helpers');
const tBot = require('./telegram-bot');

const URL = 'https://www.olx.ua/nedvizhimost/kvartiry-komnaty/prodazha-kvartir-komnat/dnepr/q-%D0%BD%D0%B8%D0%B7-%D0%BA%D0%B8%D1%80%D0%BE%D0%B2%D0%B0/?search%5Bfilter_float_number_of_rooms%3Afrom%5D=3&search%5Bfilter_float_number_of_rooms%3Ato%5D=4&search%5Bphotos%5D=1&currency=USD';
let offers = null;

// Telegram Bot
const connectToTelegramBot = () => {
    const token = '822779987:AAGhq4fA5KoeLNG5_XL2OjojEYbturn0dPY';
    const bot = new TelegramBot(token, {polling: true});

    bot.onText(/\/sar/, msg => {
        setInterval(() => tBot.initTelegramBot({ url: URL, bot, msg}), 5000)
    });
};


// Web-server
const requestHandler = (request, response) => {
    response.setHeader('Content-Type', 'text/html');

    if (!offers) {
        needle('get', URL).then(data => {
            offers = helpers.getHTMLOffers(data.body);
            response.end(offers);
        });
    }
};

const server = http.createServer(requestHandler);
server.listen(3000, () => {
    connectToTelegramBot();
    console.log(`server is listening on 3000`)
});
