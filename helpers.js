const cheerio = require('cheerio');
const db = require('./db');

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

const getOffsetDateByDays = days => {
    const date = new Date();

    date.setDate(date.getDate() + days);

    return date;
};

const getParsedOffers = offers => {
    const $ = cheerio.load(offers);
    let result = [];

    $('.offers .wrap').each((idx, el) => {
        const $el = $(el);
        const date = $el.find('[data-icon="clock"]').parent().text().trim();

        const offer = {
            title: $el.find('h3').text().trim(),
            link: $el.find('h3 a').attr('href'),
            imgUrl: $el.find('img').attr('src'),
            price: $el.find('.price').text().trim(),
            date,
            expire: getOffsetDateByDays(1)
        };

        const hasInDB = Boolean(db.data[offer.title]);
        const offerDateInDBIsExpired = hasInDB && db.data[offer.title].expire <= new Date();

        if (!hasInDB || offerDateInDBIsExpired) {
            db.data[offer.title] = offer;

            result.push(offer);
        }
    });

    return result;
};

const getOfferDetails = offer => {
    const $ = cheerio.load(offer);
    const $details = $('.details table');
    const $floor = $details.find('tr:contains("Этаж")');
    const $area =  $details.find('tr:contains("Общая площадь")');
    const $border =  $details.find('tr:contains("Тип стен")');

    const hasBorder = $border.first().find('th').text().trim();
    const hasArea = $area.first().find('th').text().trim();
    const hasFloor = $floor.first().find('th').text().trim();

    let result = {
        floor: hasFloor ? `${$floor.first().find('th').text().trim()}: ${$floor.first().find('td').text().trim()}/${$floor.last().find('td').text().trim()}` :'',
        area: hasArea ? `${$area.first().find('th').text().trim()}: ${$area.first().find('td').text().trim()}` : '',
        border: hasBorder ? `${$border.first().find('th').text().trim()}: ${$border.first().find('td').text().trim()}` : '',
        photos: []
    };

    $('.photo-glow img').each((idx, el) => {
        const $el = $(el);

        result.photos.push($el.attr('src'));
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

const getRandomInteger = (min, max) => {
    let rand = min - 0.5 + Math.random() * (max - min + 1);

    rand = Math.ceil(rand);

    return rand;
};

const getRandomHoursDelayInMS = (from, to) => getRandomInteger(from, to) * 60 * 1000;

const getDateExecution = () => {
    const from = new Date();
    const to = new Date();

    from.setHours(8);
    from.setMinutes(0);
    from.setMilliseconds(0);

    to.setHours(21);
    to.setMinutes(0);
    to.setMilliseconds(0);

    return {
        from,
        to
    }
};

const startTimer = (cb, { from, to }, condition, destroy) => {
    const timeToExecution = getRandomHoursDelayInMS(from, to);
    const d = new Date();

    d.setMinutes(d.getMinutes() + timeToExecution / 60 / 1000);

    console.log('==> Timer started:', new Date().toTimeString());
    console.log('==> Time to next execution:', d.toTimeString());

    const timer = setTimeout(() => {
        if (condition()) { cb(); }

        console.log('==> Executed at:', new Date().toTimeString());

        startTimer(cb, { from, to }, condition, destroy);
    }, timeToExecution);

    destroy.destroy = () => { clearTimeout(timer) };
};

module.exports = {
    getDateExecution,
    startTimer,
    getOfferDetails,
    getParsedOffers,
    getHTMLOffers
};
