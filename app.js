const http = require('http');
const needle = require('needle');
const TelegramBot = require('node-telegram-bot-api');

process.env.TZ = "Europe/Kiev";

let db = require('./db');
const helpers = require('./helpers');
const tBot = require('./telegram-bot');

let offers = null;
const example = "https://www.olx.ua/nedvizhimost/kvartiry-komnaty/prodazha-kvartir-komnat/dnepr/";
//

// Telegram Bot
const connectToTelegramBot = () => {
    const token = '822779987:AAGhq4fA5KoeLNG5_XL2OjojEYbturn0dPY';
    const bot = new TelegramBot(token, {polling: true});
    let destroy = {};
    let started = false;

    const handleDestroy = () => {
        destroy.destroy && destroy.destroy();
        db.data = {};
    };

    bot.onText(/^\/start$/, (msg, match) => {
        bot.sendMessage(msg.chat.id, `Hello, to start getting data from OLX, try run the command <code>/start ${example}</code>. Don't forget for stopping APP run <code>/stop</code>.`, {
            disable_web_page_preview: true,
            parse_mode: 'HTML'
        });
    });

    bot.onText(/^\/start (.+)$/, (msg, match) => {
        const URL = match[1];
        const isCorrectUrl = /^https:\/\/www.olx.ua/.test(URL);

        if (!isCorrectUrl) {
            return bot.sendMessage(msg.chat.id, `The URL incorrect. Try run the command <code>/start ${example}</code>`, {
                disable_web_page_preview: true,
                parse_mode: 'HTML'
            });
        }

        const triggerMSG = () => {
            tBot.triggerMsg({ url: URL, bot, msg})
        };

        const condition = () => {
            const { from, to } = helpers.getDateExecution();
            const currentDate = new Date();

            return currentDate > from && currentDate < to;
        };

        handleDestroy();

        triggerMSG();

        if (!started) {
            started = true;
            bot.sendMessage(msg.chat.id, 'APP STARTED');
            helpers.startTimer(triggerMSG, { from: 1, to: 3 }, condition, destroy);
        }
    });

    bot.onText(/\/stop/, msg => {
        handleDestroy();
        started = false;
        bot.sendMessage(msg.chat.id, 'APP STOPPED');
    });
};


// Web-server
const requestHandler = (request, response) => {
    response.setHeader('Content-Type', 'text/html');

    if (!offers) {
        /*needle('get', URL).then(data => {
            offers = helpers.getHTMLOffers(data.body);
            response.end(offers);
        });*/
    }

    response.end('Server is started');
};

const server = http.createServer(requestHandler);
server.listen(3000, () => {
    connectToTelegramBot();
    console.log(`server is listening on 3000`, new Date().toLocaleTimeString(), new Date())
});
