const cheerio = require('cheerio');

const getHTMLTemplate = body => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8"> 
        <title>olx-realty</title>
    </head>
    <body>
        ${body}
    </body></html>
`;

const getParsedOffers = offers => {
    const $ = cheerio.load(offers);
    let result = [];

    $('.offers .wrap').each((idx, el) => {
        const $el = $(el);
        const date = $el.find('[data-icon="clock"]').parent().text().trim();

        if (date.includes('Сегодня')) {
            result.push({
                title: $el.find('h3').text().trim(),
                link: $el.find('h3 a').attr('href'),
                imgUrl: $el.find('img').attr('src'),
                price: $el.find('.price').text().trim(),
                date
            })
        }
    });

    return result;
};

const getParsedOfferImages = offer => {
    const $ = cheerio.load(offer);
    let result = [];

    $('.photo-glow img').each((idx, el) => {
        const $el = $(el);

        result.push($el.attr('src'));
    });

    return result;
};

const getHTMLOffers = offers => {
    return getHTMLTemplate(getParsedOffers(offers).reduce((accum, offer) => {
        if (offer.date.includes('Сегодня') || offer.date.includes('Вчера')) {
            return accum += `
                <article>
                    <h3><a href="${offer.link}" target="_blank">${offer.title}<a/></h3>
                    <div><img src="${offer.imgUrl}" /></div>
                    <h4>${offer.price}</h4>
                    <time>${offer.date}</time>
                </article>
            `;
        }

        return accum;
    }, ''));
};

module.exports = {
    getParsedOfferImages,
    getParsedOffers,
    getHTMLOffers
};
