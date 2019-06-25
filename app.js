const http = require('http');
const needle = require('needle');
const cheerio = require('cheerio');

const URL = 'https://www.olx.ua/nedvizhimost/kvartiry-komnaty/dnepr/q-%D0%BD%D0%B8%D0%B7-%D0%BA%D0%B8%D1%80%D0%BE%D0%B2%D0%B0/?search%5Bphotos%5D=1&currency=USD';

const getHTMLFile = body => `
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

const fetchOffers = (response) => {
    return needle.get(URL, function (err, res, body) {
        if (err) throw err;

        res.setEncoding('utf8');

        const $ = cheerio.load(body);
        let result = '';

        $('.offers .wrap').each((idx, el) => {
            const $el = $(el);
            const date = $el.find('[data-icon="clock"]').parent().text().trim();

            if (date.includes('Сегодня') || date.includes('Вчера')) {
                const msg = `
                    <article>
                        <h3><a href="${$el.find('h3 a').attr('href')}" target="_blank">${$el.find('h3').text().trim()}<a/></h3>
                        <div><img src="${$el.find('img').attr('src')}" /></div>
                        <time>${date}</time>
                    </article>
                `;

                result += msg;
            }
        });

        response.end(getHTMLFile(result));
    });
};


const requestHandler = (request, response) => {
    response.setHeader('Content-Type', 'text/html');
    fetchOffers(response);
};

const server = http.createServer(requestHandler);
server.listen(3000, () => {
    console.log(`server is listening on 3000`)
});
