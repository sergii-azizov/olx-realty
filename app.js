const http = require('http');
const needle = require('needle');
const TelegramBot = require('node-telegram-bot-api');

let db = require('./db');
const helpers = require('./helpers');
const tBot = require('./telegram-bot');

let offers = null;
const example = "https://www.olx.ua/nedvizhimost/kvartiry-komnaty/prodazha-kvartir-komnat/dnepr/";
// /start https://www.olx.ua/nedvizhimost/kvartiry-komnaty/prodazha-kvartir-komnat/dnepr/q-%D0%BD%D0%B8%D0%B7-%D0%BA%D0%B8%D1%80%D0%BE%D0%B2%D0%B0/?search%5Bfilter_float_number_of_rooms%3Afrom%5D=3&search%5Bfilter_float_number_of_rooms%3Ato%5D=4&search%5Bphotos%5D=1&currency=USD

// Telegram Bot
const connectToTelegramBot = () => {
    const token = '';
    const bot = new TelegramBot(token, {polling: true});
    let destroy = {};
    let started = false;

    const handleDestroy = () => {
        destroy.destroy && destroy.destroy();
        started = false;
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
    console.log(`server is listening on 3000`, new Date())
});
