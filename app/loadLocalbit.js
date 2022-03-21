const { default: axios } = require("axios");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function load(type) {

    var nextPage = `https://localbitcoins.com/${type}-bitcoins-online/.json?page=1`
    var result = []
    while (nextPage) {
        try {
            let res = (await axios.get(nextPage)).data
            nextPage = res.pagination.next

            result = result.concat(res.data.ad_list)

            process.stdout.write(`.`);
        } catch (error) {
            process.stdout.write(`e`)
            await sleep(5000)
        }

    }

    return result
}

async function loadAll() {
    let sell = await load('sell')
    let buy = await load('buy')

    let result = sell.map(t => ({ type: 'sell', ...t }))
        .concat(buy.map(t => ({ type: 'buy', ...t })))
        .map(t => ({ public_view: t.actions.public_view, type: t.type, ...t.data }))
        .map(t => ({
            username: t.profile.username,
            countrycode: t.countrycode,
            currency: t.currency,
            payment: t.online_provider,
            min_amount: t.min_amount_available,
            max_amount: t.max_amount_available,
            price: t.temp_price,
            url: t.public_view,
            type: t.type
        }))

    return result
}

exports.load = loadAll
