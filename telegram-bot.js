const needle = require('needle');
const helpers = require('./helpers');

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

const initTelegramBot = ({ url, bot, msg }) => {
    needle('get', url).then(async ({ body }) => {
        const offers = helpers.getParsedOffers(body).reverse();

        const sentMessage = async offer => {
            return needle('get', offer.link).then(async ({ body }) => {
                const offerTitle = `<b>${offer.price}</b> | <a href="${offer.link}">${offer.title} | ${offer.date}</a>`;
                const offerImages = helpers.getParsedOfferImages(body).slice(0, 10).map(img => ({
                    type: 'photo',
                    media: img,
                    caption: offerTitle,
                    parse_mode: 'HTML'
                }));

                await bot.sendMediaGroup(msg.chat.id, offerImages);

                await bot.sendMessage(msg.chat.id, offerTitle, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                });
            })
        };

        await asyncForEach(offers, sentMessage);
    });
};

module.exports = {
    initTelegramBot
};
