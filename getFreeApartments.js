const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');
const cheerio = require('cheerio');

const apartment = require('./apartments')
const Config = require('./krisha.json')
const PROXY = require('./proxy')

const axios = require('axios');
const url = require('url');
const FormData = require('form-data');
const CronJob = require('cron').CronJob;
const isProcessing = {}
const arrayPaidLabels = []


const getFreeNewFlat = async (page = 1, city, startPage) => {
    if (page >= (startPage +5)) {
        console.log(city +' finished job(paid)')
        return;
    }

    const html = await getHtmlFromSearchPage(page, city)

     if(html){
        const flats = getFlatsJsonDataFromSearchPageHtml(html);
        for (let i = 0; i < flats.search.ids.length; i++) {
            const flatHtml = await getHtmlFromFlatPage(flats.search.ids[i])
            const parsedDatas = cheerio.load(flatHtml);
            let parseTextOwner = parsedDatas('div[class="owners__name owners__name--large"]').text() ? 1 : 0
            if (parseTextOwner === 1) {
                const views = await checkViewsOfFlat(flats.search.ids[i])
                // try to check by publicationDate
                if (views && views < 300) {
                    const isInDb = await checkForExistenceInFlatDb(flats.search.ids[i], views)
                    if (!isInDb) {
                        const flatHtml = await getHtmlFromFlatPage(flats.search.ids[i])
                        const jsonFormatForFlatPage = getFlatsJsonDataFromSearchPageHtml(flatHtml)

                        if (!flatHtml) {
                            continue;
                        }

                        const flatJson = await getFlatJsonDataFromFlatPageHtml(flatHtml, jsonFormatForFlatPage)

                        if (!flatJson) {
                            continue;
                        }
                        await saveFullInfoInDB(flats.search.ids[i], flatJson)
                    }
                }
            }
        }
    }
    await timeOut(100)
    await getFreeNewFlat(page + 1, city, startPage)

}
const timeOut = (timeout) =>{
    return new Promise((resolve)=>{
        setTimeout(() => {
            resolve()
        },timeout)
    })
}


const getHtmlFromSearchPage = async (page, city) => {
    const defaultUrl = `https://krisha.kz/arenda/kvartiry/${city}/`
    const params = page > 1 ? '?page=' + page : ''

    for (let counter = 0; counter < 10; counter++) {
        const html = await getUrl(defaultUrl + params)
        if (html !== null) {
            return html;
        }
        console.log(city+ ' Trying again page ' + page)
    }
    return undefined
}

const getFlatsJsonDataFromSearchPageHtml = (html) => {
    try {
        const parsedData = cheerio.load(html)

        let listOfScriptsWithFlatsData = parsedData('script#jsdata').toString();

        let splitString = listOfScriptsWithFlatsData.split(' = ')[1];
        let splitString2 = splitString.split('};')[0];
        splitString2 = splitString2 + "}";
        let parseJsonDataString = JSON.parse(splitString2)
        // console.log(parseJsonDataString)
        return parseJsonDataString

    } catch (err) {
        return []
    }
}


const checkForExistenceInFlatDb = async (flat, views) => {
    const isFlat = await apartment.findOne({id: flat});
    const forNameHtml = getHtmlFromFlatPage(flat);
    const parsedData = cheerio.load(await forNameHtml)
    const name = parsedData('.offer__advert-title').children('h1').text().trim();
    if (!isFlat) {
        apartment.create({
            id: flat,
            view: views,
        })
        console.log('I have found new flat(free): ' + name);


        return false
    } else {
        //await sendToBot(flat)

        return true
    }
}
const sendToBot = async (id) => {
    const data = await apartment.findOne({id: id});

    await axios({
        method: 'POST',
        url: 'https://bot.home.fastbot.pro',
        data: data,
    })
}

const getFlatJsonDataFromFlatPageHtml = async (html, flats) => {
    try{
        const parsedData = cheerio.load(html);

        let city = parsedData('.offer__location').text().trim().replace(/\n/g,'').split(' ')[0]
        if (city.charAt(city.length - 1) === ',') {
            city = city.split(',')[0]
        }
        let dom = parsedData('div[data-name="flat.building"]').children('div').last().text() === "" ? "" : parsedData('div[data-name="flat.building"]').children('div').last().text().trim()
        let floor = parsedData('div[data-name="flat.floor"]').children('div').last().text() === "" ? "" : parsedData('div[data-name="flat.floor"]').children('div').last().text().trim()
        let square = parsedData('div[data-name="live.square"]').children('div').last().text() === "" ? "" : parsedData('div[data-name="live.square"]').children('div').last().text().trim()
        let condition = parsedData('div[data-name="flat.renovation"]').children('div').last().text() === "" ? "" : parsedData('div[data-name="flat.renovation"]').children('div').last().text().trim()
        let residential_complex = parsedData('div[data-name="map.complex"]').children('div').last().text().trim() === '' ? '' : parsedData('div[data-name="map.complex"]').children('div').last().text().trim()
        let bathroom = parsedData('div[data-name="flat.toilet"]').children('div').last().text().trim() === '' ? '' : parsedData('div[data-name="flat.toilet"]').children('div').last().text().trim()
        let balcony = parsedData('div[data-name="flat.balcony"]').children('div').last().text().trim() === '' ? '' : parsedData('div[data-name="flat.balcony"]').children('div').last().text().trim()
        let balcony_osteklen = parsedData('div[data-name="flat.balcony_g"]').children('div').last().text().trim() === '' ? '' : parsedData('div[data-name="flat.balcony_g"]').children('div').last().text().trim()
        let internet = parsedData('div[data-name="inet.type"]').children('div').last().text().trim() === '' ? '' : parsedData('div[data-name="inet.type"]').children('div').last().text().trim()
        let mebel = parsedData('div[data-name="live.furniture"]').children('div').last().text().trim() === '' ? '' : parsedData('div[data-name="live.furniture"]').children('div').last().text().trim()
        let door = parsedData('div[data-name="flat.door"]').children('div').last().text().trim() === '' ? '' : parsedData('div[data-name="flat.door"]').children('div').last().text().trim()
        let safe = parsedData('div[data-name="flat.security"]').children('div').last().text().trim() === '' ? '' : parsedData('div[data-name="flat.security"]').children('div').last().text().trim()
        let duration = flats.advert.title.split('этаж ')[1] ? flats.advert.title.split('этаж ')[1] : flats.advert.title.split('м² ')[1];
        let microdistrict = '';
        let microdistrictString = 'мкр ';
        let microdistrictSplit = parsedData('.offer__advert-title').children('h1').text().trim().split('мкр ')[1] ? parsedData('.offer__advert-title').children('h1').text().trim().split('мкр ')[1] : '';
        microdistrictSplit = microdistrictSplit.split(', ')[0];
        microdistrictSplit = microdistrictSplit.split(' ')[0];

        if (microdistrictSplit != '') {
            microdistrict = microdistrictString + microdistrictSplit;
        }
        let street = flats.advert.addressTitle.split(', ')[1]
        let district = parsedData('.offer__location').text().trim().replace(/\n/g,'').split(' ')[1]

        const obj = {
            district: district,
            street: flats.adverts[0].address,
            url: 'https://krisha.kz' + flats.adverts[0].url,
            date: flats.adverts[0].addedAt,
            price: flats.advert.price,
            room: flats.advert.rooms,
            microdistrict: microdistrict,
            duration: duration,
            city: city,
            dom: dom,
            floor: floor,
            square: square,
            condition: condition,
            residential_complex: residential_complex,
            bathroom: bathroom,
            balcony: balcony,
            balcony_osteklen: balcony_osteklen,
            internet: internet,
            mebel: mebel,
            door: door,
            safe: safe
        }

        return obj

    } catch (err){
        return [];
    }

}


const getFreeFlatsStartingPage = async (page, min, max, counter, city) => {
    if (counter > 10) {
        console.log('Something went wrong with getFreeFlatsStartingPage ' + page)
        return page
    }

    const html = await getHtmlFromSearchPage(page, city)

    if(html){
        const flats = getFlatsJsonDataFromSearchPageHtml(html);
        const parsedData = cheerio.load(html)
        const checking = parsedData('.paid-labels').toArray()
        let isFirstFree = checking[0].children.length === 1 ? true : false
        let isLastPaid = checking[checking.length-1].children.length > 1 ? true : false
        // проверяются первое и конечное объявление на странице

        if(flats){
            let newPage;
            if (isFirstFree) {
                max = page
                newPage = Math.floor((min + max) / 2)
                // назад
                return await getFreeFlatsStartingPage(newPage, min, max, ++counter, city)
            } else if (isLastPaid) {
                min = page
                newPage = Math.floor((min + max) / 2)
                // вперед
                return await getFreeFlatsStartingPage(newPage, min, max, ++counter, city)
            } else {
                return page

                // нужная страница
            }
        }
    }
}

async function getUrl(endpoint) {
    try {
        let response
        if(!Config.useProxy) {
		//console.log ("proxy false free", 229);
            response = await fetch(endpoint);
        } else {
		//console.log("proxy true free", 232)
            const proxies = await PROXY.find({ banned: false })
            const proxy = proxies[Math.floor(Math.random() * proxies.length)] || {}

            //if we use login and pass for proxy
            var proxyOpts = url.parse(proxy.proxy);
            proxyOpts.auth = `${Config.proxyLogin}:${Config.proxyPass}`;

            const proxyAgent = new HttpsProxyAgent(proxyOpts);
            response = await fetch(endpoint, { timeout: 2000, agent: proxyAgent });
        }
        if (response && response.status === 200) {
            const body = await response.text();
            return body
        } else {
            console.log('Could not get response from '+endpoint+" and status code: " + response.status);

            return null
        }
    }
    catch (err) {
	    console.log ("free getUrl error: ", err, 253)
        return null
    }
}

async function checkViewsOfFlat(flatId) {
    const formData = new FormData();
    formData.append('return_counters', 1);
    formData.append('nb_views', 1);
    try {
        let res;
        if(!Config.useProxy) {
            res = await axios.post('https://krisha.kz/ms/views/krisha/live/' + flatId + '/', formData, {headers: formData.getHeaders()})
        } else {
		console.log("true", 268)
            const proxies = await PROXY.find({ banned: false })
            const proxy = proxies[Math.floor(Math.random() * proxies.length)] || {}
            //console.log(proxy, 271)
		let agent;
            if (proxy.proxy) {
                var proxyOpts = url.parse(proxy.proxy);
                proxyOpts.auth = `${Config.proxyLogin}:${Config.proxyPass}`;
                agent = new HttpsProxyAgent(proxyOpts);
            }
            res = await axios.post('https://krisha.kz/ms/views/krisha/live/' + flatId + '/', formData, { headers: formData.getHeaders(), httpsAgent: agent })
        	//console.log(res, 279)
	}
	    console.log("free ", flatId," ", res.data.data.nb_views, 280)
        return res.data.data.nb_views ? res.data.data.nb_views : null
    } catch (err) {
        console.log(err,209)
        return -1
    }
}
const getHtmlFromFlatPage = async (flatId) => {
    const defaultUrl = `https://krisha.kz/a/show/${flatId}`
    for (let counter = 0; counter < 10; counter++) {
        const html = await getUrl(defaultUrl)
        if (html !== null) {
            return html
        }
    }
    return undefined
}
async function saveFullInfoInDB(flatId, flatInfo) {
    await apartment.updateOne(
        { id: flatId },
        [
            { $set: flatInfo }
        ]
    )
}

function createJob(city){
    return new CronJob(Config.getFreeFlatsCrone, async function () {
        if (isProcessing[city]) {
            return
        }
        isProcessing[city] = true
        try{
            const foundPage = await getFreeFlatsStartingPage(80, 0, 200, 1, city)
            if(foundPage){
                console.log(city+' found page where free flats starts : ' + foundPage)
                await getFreeNewFlat(foundPage - 3, city, foundPage)
            }
        }catch(err){
            console.error(err)
        }finally{
            isProcessing[city] = false
            console.log(city+' Finished job (free)');
        }
    });
}


// const karaganda_obl = createJob('karagandinskaja-oblast')
// karaganda_obl.start()

const almaty = createJob('almaty')
almaty.start()

// const astana = createJob('nur-sultan')
// astana.start()
//
// const shymkent = createJob('shymkent')
// shymkent.start()
//
// const akmolinskaja_oblast = createJob('akmolinskaja-oblast')
// akmolinskaja_oblast.start()
//
// const aktjubinskaja_oblast = createJob('aktjubinskaja-oblast')
// aktjubinskaja_oblast.start()
//
// const almatinskaja_oblast = createJob('almatinskaja-oblast')
// almatinskaja_oblast.start()
//
// const atyrauskaja_oblast = createJob('atyrauskaja-oblast')
// atyrauskaja_oblast.start()
//
// const vostochno_kazahstanskaja_oblast = createJob('vostochno-kazahstanskaja-oblast')
// vostochno_kazahstanskaja_oblast.start()
//
// const zhambylskaja_oblast = createJob('zhambylskaja-oblast')
// zhambylskaja_oblast.start()
//
// const zapadno_kazahstanskaja_oblast = createJob('zapadno-kazahstanskaja-oblast')
// zapadno_kazahstanskaja_oblast.start()
//
// const kostanajskaja_oblast = createJob('kostanajskaja-oblast')
// kostanajskaja_oblast.start()
//
// const kyzylordinskaja_oblast = createJob('kyzylordinskaja-oblast')
// kyzylordinskaja_oblast.start()
//
// const mangistauskaja_oblast = createJob('mangistauskaja-oblast')
// mangistauskaja_oblast.start()
//
// const pavlodarskaja_oblast = createJob('pavlodarskaja-oblast')
// pavlodarskaja_oblast.start()
//
// const severo_kazahstanskaja_oblast = createJob('severo-kazahstanskaja-oblast')
// severo_kazahstanskaja_oblast.start()
//
// const juzhno_kazahstanskaja_oblast = createJob('juzhno-kazahstanskaja-oblast')
// juzhno_kazahstanskaja_oblast.start()
