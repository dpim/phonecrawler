#!/usr/bin/env node
var program = require('commander');
var co = require('co');
var coprompt = require('co-prompt');
var request = require('request');
var fs = require('fs');

program
    .arguments('<url>')
    .option('-v, --verbose', 'verbose mode')
    .action(function (url) {
        co(function* () {
            var stayOnDomain = yield coprompt('> Would you like to crawl only on the same domain? (y/n):  ');
            var limit = yield coprompt('> Set limit for search? (y/n) :  ');
            var isLimited = (limit.toLowerCase() == 'yes' || limit.toLowerCase() == 'y') ? true : false;
            var countDoms = (isLimited) ? yield coprompt('> Maximum count of URLs processed:  ') : 1000000;
            var sameDomain = (stayOnDomain.toLowerCase() == 'yes' || stayOnDomain.toLowerCase() == 'y') ? true : false;
            crawl(url, program.verbose, sameDomain, countDoms);
        });
    }).parse(process.argv);

function crawl(url, verbose, sameDomain, countDoms) {
    startUrl = url;
    phoneNumbers = [];
    horizon = [];
    visited = [];
    //choosing how to structure request
    if (!startUrl.includes('http')) {
        horizon.push(format(startUrl));
    } else {
        horizon.push(startUrl);
    }
    explore(verbose, horizon, visited, phoneNumbers, sameDomain, countDoms);
}

function explore(verbose, horizon, visited, phoneNums, sameDomain, count) {
    if (horizon.length > 0 && count > 0) {
        currentUrl = horizon.shift();
        if (verbose) {
            console.log('Current url: ', currentUrl);
            console.log('Current phones: ', phoneNums);
            console.log('Current horizon: ', horizon);
        } else {
            printProgress(currentUrl, horizon.length, Object.keys(phoneNums).length);
        }
        if (!visited.includes(currentUrl)) {
            //issue request
            request(currentUrl, function (error, response, body) {
                //parse for phone numbers and urls 
                if (verbose) {
                    console.log('error:', error);
                }
                if (!error && response && response.statusCode == 200) {
                    //parse for urls
                    urlMatches = body.match(/\w+\.(com|org|net|gov)\/*\w*(\"|\'){1}/g);
                    urlMatchesCleaned = [];
                    if (urlMatches) {
                        for (let i = 0; i < urlMatches.length; i++) {
                            let curr = urlMatches[i];
                            urlMatchesCleaned.push(curr.substring(0, curr.length - 1));
                        }
                        for (let i = 0; i < urlMatchesCleaned.length; i++) {
                            let matchCleaned = format(urlMatchesCleaned[i]);
                            if (!horizon.includes(matchCleaned) && !matchCleaned.includes("schema.org")) {
                                if (!sameDomain) {
                                    horizon.push(matchCleaned);
                                } else if (sameDomain && matchDomain(currentUrl, matchCleaned)) {
                                    horizon.push(matchCleaned);
                                }
                            }
                        }
                    }
                    //matching phone numbers
                    phoneMatches = body.match(/\(?\d{3}\)?-{1}\d{3}-{1}\d{4}/g)
                    if (phoneMatches) {
                        for (let i = 0; i < phoneMatches.length; i++) {
                            let curr = phoneMatches[i];
                            if (curr && !phoneNums.includes(curr)) {
                                phoneNums[curr] = currentUrl;
                            }
                        }
                    }
                    visited.push(currentUrl);
                }
                explore(verbose, horizon, visited, phoneNums, sameDomain, count - 1);
            });
        } else {
            explore(verbose, horizon, visited, phoneNums, sameDomain, count - 1);
        }
    } else {
        console.log('\n');
        console.log(phoneNums);
        writeToFile(phoneNums);
    }
}

function writeToFile(phoneNumbers) {
    var stringified = stringify(phoneNumbers);
    fs.writeFile('results.txt', stringified, function (err) {
        if (err) {
            console.log("An error occurred saving the results to file")
        } else {
            console.log("Saved to file");
        }
    });
}

function stringify(phoneNumbers) {
    var str = '{';
    var count = Object.keys(phoneNumbers).length;
    var i = 0;
    for (phoneNumber in phoneNumbers) {
        if (i < count - 1) {
            str += '\n \"' + phoneNumber + '\" : \"' + phoneNumbers[phoneNumber] + '\",'
        } else {
            str += '\n \"' + phoneNumber + '\" : \"' + phoneNumbers[phoneNumber] + '\"'
        }
        i++;
    }
    return str + '\n}';
}

function format(url) {
    return "https://" + url;
}

function printProgress(url, toProcess, numsFound) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    var progress = 'Current url: ' + url + ', count to process: ' + toProcess + ', numbers found: ' + numsFound;
    process.stdout.write(progress);
}


function matchDomain(firstDomain, secondDomain) {
    var firstDomainParts = firstDomain.split(/\.(com|org|net|gov)/);
    var secondDomainParts = secondDomain.split(/\.(com|org|net|gov)/);
    return firstDomainParts[0] == secondDomainParts[0];
}

