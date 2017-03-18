var express = require('express')
var request = require('request');
var app = express()


app.get('/crawl/:urlPassed', function (req, res) {
    startUrl = req.params("urlPassed");
    phoneNumbers = [];
    horizon = [];
    console.log(startUrl);
    horizon.push("https://www.google.com"); //testing

    while (horizon.length > 0){
        currentUrl = horizon.pop();
        //issue request
        request(currentUrl, function (error, response, body) {
            //parse for phone numbers and urls 
            //console.log(error);
            //console.log(response);
            if (!error && response && response.statusCode == 200){
                //console.log(aParts.length);

                //parse for urls
                urlMatches = body.match(/\w+\.(com|org|net)\/*\w*(\"|\'){1}/g)//body.match(/\w+\.\w{3,}\"/g);
                urlMatchesCleaned = [];
                for (let i = 0; i < urlMatches.length; i++){
                    let curr = urlMatches[i];
                    urlMatchesCleaned.push(curr.substring(0, curr.length-1)); //remove last char
                }
                console.log(urlMatchesCleaned);
                //parse for phone numbers                


            }
        });
    }
})

app.listen(8080, function () {
  console.log('Example app listening on port 8080!')
})