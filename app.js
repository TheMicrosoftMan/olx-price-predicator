const Tokio = require('tokio');
var fs = require('fs');
const cheerio = require('cheerio');
let Classifier = require('./wink-naive-bayes-text-classifier');
let nbc = Classifier();

nbc.defineConfig({
    considerOnlyPresence: true,
    smoothingFactor: 0.5
});

getPages = page => {
    return new Promise((resolve, reject) => {
        const tokio = new Tokio({
            url: `https://www.olx.ua/elektronika/kompyutery-i-komplektuyuschie/?page=${page}/`
        });
        tokio.fetch().then(html => {
            const $ = cheerio.load(html, {
                normalizeWhitespace: true,
                xmlMode: true
            });
            let itemNameArr = [],
                itemPriceArr = [];
            $('.lheight22 a').each(function (i, elem) {
                itemNameArr[i] = $(this).text();
            });
            $('.price strong').each(function (i, elem) {
                itemPriceArr[i] = $(this).text();
            });
            let itemsArr = [];
            for (let i = 0; i < itemNameArr.length; i++) {
                itemsArr.push({
                    name: itemNameArr[i],
                    cost: itemPriceArr[i]
                });
            }
            resolve(itemsArr);
        });
    });
}

train = trainingDate => {
    return new Promise((resolve, reject) => {
        let data = require(trainingDate);

        for (let i = 0; i < data.length; i++) {
            nbc.learn(data[i].name, data[i].cost);
        }

        nbc.consolidate();
        resolve();
    });
}

predicate = (itemName) => {
    return new Promise((resolve, reject) => {
        let itemPrice = nbc.computeOdds(itemName);
        resolve(`${itemName} - ${itemPrice[0][0]}`);
    });
}

main = async () => {
    let PAGES_TO_DOWNLOAD = 3;
    let PREDIACETE = 'Acer core i5-4x3.3 Ghz';
    
    let pathToTrainData = "./output.json";
    if (!fs.existsSync(pathToTrainData)) {
        let dataToWrite = [];
        for (let numberPage = 1; numberPage <= PAGES_TO_DOWNLOAD; numberPage++) {
            let tempDataArr = await getPages(numberPage);
            tempDataArr.forEach(el => {
                dataToWrite.push(el);
            });
        }
        fs.writeFileSync('output.json', JSON.stringify(dataToWrite));
    }
    await train(pathToTrainData);
    console.log(await predicate(PREDIACETE));
}

main();
