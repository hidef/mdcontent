var express = require('express');
var app = express();

var public = process.env.public || 'public';

app.use('/_public/', express.static(public));
app.use('/', express.static('dist'));

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log('Listening on port ' + port);
});

