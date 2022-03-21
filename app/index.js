const local = require('./loadLocalbit.js')
const paxful = require('./loadPaxful.js')
const db = require('./dbProvider')


async function load() {
    let localRes = (await local.load()).map(t => ({ platform: 'localbitcoins', crypto: 'BTC', ...t }))
    let paxfulRes = (await paxful.load()).map(t => ({ platform: 'paxful', ...t }))


    let data = paxfulRes.concat(localRes)
    await db.db.from('PoC').where(true).del()

    for (let i = 0; i < data.length; i += 500) {
        await db.db.insert(data.slice(i, i + 500)).into('PoC')
        console.log(i / data.length);
    }

    console.log(`DONE ${data.length}`);

}

load()
