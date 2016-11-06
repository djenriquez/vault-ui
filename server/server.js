import express from 'express';
import bodyParser from 'body-parser';
import favicon from 'serve-favicon';

const PORT = 8000;

var app = express();

app.use('/static', express.static('dist'));
app.use(express.static('./src/server/public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.listen(PORT, () => {
    console.log(`Vault UI listening on: ${PORT}`);
});