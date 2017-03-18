var express = require('express');
var request = require('request');
var app = express();

app.get('/crawl/:href(*)', function (req, res) {
    startUrl = req.params.href;
    phoneNumbers = [];
    horizon = [];
    visited = [];

    //choosing how to structure request
    if (!startUrl.includes("http")){
        if (startUrl.includes("localhost")){
            horizon.push(startUrl);   
        }
        horizon.push(format(startUrl));
    } else {
        horizon.push(startUrl);
    }
    res.header("Access-Control-Allow-Origin", "*");
    explore(horizon, visited, phoneNumbers, request, res);
})

app.get('/crawltest/:href(*)', function (req, res) {
    let fakePhoneArr = ['123-456-7891'];
    res.header("Access-Control-Allow-Origin", "*");
    res.send(fakePhoneArr);
})
   
app.listen(8080, function () {
    console.log('Example app listening on port 8080!');
})

function format(url) {
    return "https://" + url;
}

function explore(horizon, visited, phoneNums, request, crawlResponse) {
    if (horizon.length > 0){
        currentUrl = horizon.pop();
        //console.log("is res null: ", response == null);
        console.log("current url: ", currentUrl);
        console.log("current phones: ", phoneNums);
        console.log("current horizon: ", horizon);
        if (!visited.includes(currentUrl)) {
            //issue request
            request(currentUrl, function (error, response, body) {
                //parse for phone numbers and urls 
                console.log("error:",error);
                if (!error && response && response.statusCode == 200) {
                    //parse for urls
                    urlMatches = body.match(/\w+\.(com|org|net)\/*\w*(\"|\'){1}/g)//body.match(/\w+\.\w{3,}\"/g);
                    urlMatchesCleaned = [];
                    if (urlMatches){
                        for (let i = 0; i < urlMatches.length; i++) {
                            let curr = urlMatches[i];
                            urlMatchesCleaned.push(curr.substring(0, curr.length - 1)); //remove last char
                        }
                        //console.log(urlMatchesCleaned);
                        for (let i = 0; i < urlMatchesCleaned.length; i++) {
                            let matchCleaned = format(urlMatchesCleaned[i]);
                            if (!horizon.includes(matchCleaned)){
                                horizon.push(matchCleaned);
                            }
                        }
                    }
                    //matching phone numbers
                    phoneMatches = body.match(/\(?\d{3}\)?-{1}\d{3}-{1}\d{4}/g)
                    if (phoneMatches){
                        for (let i = 0; i < phoneMatches.length; i++) {
                            let curr = phoneMatches[i];
                            if (curr && !phoneNums.includes(curr)){
                                phoneNums.push(curr);
                            }
                        }
                    }
                    visited.push(currentUrl);
                } 
                explore(horizon, visited, phoneNums, request, crawlResponse);
            });
        } else {
            explore(horizon, visited, phoneNums, request, crawlResponse);
        }
    } else {
        console.log("is res null: ", crawlResponse == null);
        crawlResponse.send(phoneNums);
    }
}


