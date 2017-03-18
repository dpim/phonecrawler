var express = require('express')
var request = require('request');
var app = express()


app.get('/crawl/:href(*)', function (req, res) {
    startUrl = req.params.href;
    phoneNumbers = [];
    horizon = [];
    visited = []
    console.log("parms", startUrl);
    horizon.push(format(startUrl))
    explore(horizon, visited, phoneNumbers, request, res);
})
   
app.listen(8080, function () {
    console.log('Example app listening on port 8080!')
})

function format(url) {
    return "https://" + url;
}

function explore(horizon, visited, phoneNums, request, response) {
    if (horizon.length > 0){
        currentUrl = horizon.pop();
        console.log("current url: ", currentUrl);
        if (!visited.includes(currentUrl)) {
            //issue request
            request(currentUrl, function (error, response, body) {
                //parse for phone numbers and urls 
                console.log("error:",error);
                if (!error && response && response.statusCode == 200) {
                    //parse for urls
                    urlMatches = body.match(/\w+\.(com|org|net)\/*\w*(\"|\'){1}/g)//body.match(/\w+\.\w{3,}\"/g);
                    urlMatchesCleaned = [];
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
                    console.log("hrozion", horizon);
                    phoneMatches = body.match(/\(?\d{3}\)?-{1}\d{3}-{1}\d{4}/g)
                    phoneNums.push(phoneMatches);
                    visited.push(currentUrl)
                } 
                explore(horizon, visited, phoneNums, request, res);
            });
        } else {
            explore(horizon, visited, phoneNums, request, res);
        }
    } else {
        res.write(phoneNums)
    }
}


