const fs = require('fs')
const config = require('config')
const { default: usePaxful } = require("@paxful/sdk-js");

const paxfulApi = usePaxful({
    clientId: config.get("clientId"),
    clientSecret: config.get("clientSecret")
});

async function load(type, currency) {

    let offerAll = async (count, min, max) => {
        var currentCount = 0
        var result = []

        while (currentCount < count) {
            let res = await loadOfferAll(300, min, max, currentCount)
            result = result.concat(res.data.offers)
            currentCount += 300
        }

        return result
    }

    let loadOfferAll = async (limit, min, max, offset = undefined) => {
        return paxfulApi.invoke("/paxful/v1/offer/all", {
            offer_type: type,
            limit,
            offset,
            crypto_currency_code: currency,
            fiat_fixed_price_min: min,
            fiat_fixed_price_max: max
        });
    }

    var window = 100
    var lastPrice = 0;
    var loadCount = 0;
    var result = []
    while (window < 1e10) {

        let res = await loadOfferAll(1, lastPrice, lastPrice + window)
        let count = res.data.totalCount

        process.stdout.write(`.`);

        if (count < 1000) {
            result = result.concat(await offerAll(count, lastPrice, lastPrice + window))
            lastPrice += window
            loadCount += count
        }

        if (count >= 1000) {
            window = window / 2
        } else if (count <= 400) {
            window = window * 2
        }

    }

    let res = await loadOfferAll(1, lastPrice, undefined)
    loadCount += res.data.totalCount


    result = result.concat(await offerAll(res.data.totalCount, lastPrice, undefined))

    return { result, loadCount, delta: result.length - loadCount }
}

async function loadAll() {
    let data = {
        ETH: {},
        USDT: {},
        BTC: {}
    }

    let currency = Object.keys(data)
    for (let i = 0; i < currency.length; i++) {
        data[currency[i]].sell = await load('sell', currency[i])
        console.log(`sell | ${currency[i]}: ${data[currency[i]].sell.loadCount}`);
        data[currency[i]].buy = await load('buy', currency[i])
        console.log(`buy | ${currency[i]}: ${data[currency[i]].buy.loadCount}`);
    }

    var combineResult = []

    for (let i = 0; i < currency.length; i++) {
        combineResult = combineResult.concat(data[currency[i]].sell.result).concat(data[currency[i]].buy.result)
    }

    let res = combineResult.map(t => ({
        username: t.offer_owner_username,
        countrycode: t.offer_owner_country_iso || '',
        currency: t.fiat_currency_code,
        payment: t.payment_method_name,
        min_amount: t.fiat_amount_range_min,
        max_amount: t.fiat_amount_range_max,
        price: t.fiat_price_per_crypto,
        url: t.offer_link,
        type: t.offer_type,
        crypto: t.crypto_currency_code
    }))

    return res
}

exports.load = loadAll
