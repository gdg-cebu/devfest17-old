const path = require('path');
const fs = require('fs-promise');
const express = require('express');
const consolidate = require('consolidate');
const morgan = require('morgan');
const favicon = require('serve-favicon');
const config = require('./config');

const app = express();

app.engine('html', consolidate.nunjucks);
app.set('views', path.join(__dirname, 'views'));

app.use(morgan('dev'));
app.use(favicon(path.join(__dirname, 'static', 'images', 'favicon.ico')));

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/sw.js', express.static(path.join(__dirname, 'static', 'javascripts', 'sw.js')));
app.use('/sw-offline-google-analytics.js', express.static(path.join(
    __dirname, 'node_modules', 'sw-offline-google-analytics', 'build',
    'importScripts', 'sw-offline-google-analytics.prod.v0.0.25.js')));

app.use((req, res, next) => {
    res.locals.secrets = config.get('SECRETS');
    res.locals.analytics = req.hostname !== 'localhost';
    next();
});

app.get('/', (req, res) => {
    Promise.all([
        read(__dirname, 'data', 'speakers.json'),
        read(__dirname, 'data', 'sessions.json'),
        read(__dirname, 'data', 'sponsors.json')
    ]).then(([speakers, sessions, sponsors]) => {
        const context = {
            map: mapUrl(),
            speakers: speakers.sort(_ => Math.random() - 0.5),
            sessions: sessions,
            sponsors: sponsors
        };
        res.render('pages/index.html', context);
    });
});

app.get('/faqs', (req, res) => {
    read(__dirname, 'data', 'faqs.json').then(faqs => {
        const context = { faqs };
        res.render('pages/faqs.html', context);
    });
});

app.get('/coc', (req, res) => {
    res.render('pages/coc.html');
});

function mapUrl() {
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const latitude = config.get('VENUE_LATITUDE');
    const longitude = config.get('VENUE_LONGITUDE');
    const query = config.get('GOOGLE_MAPS_CONFIG');
    query['markers'] = `color:red|${latitude},${longitude}`;
    query['center'] = `${latitude},${longitude}`;
    query['key'] = config.get('SECRETS')['GOOGLE_MAPS_API_KEY'];

    const querystring = Object.keys(query).reduce((qs, key) => {
        qs.push(`${key}=${encodeURIComponent(query[key])}`);
        return qs;
    }, []).join('&');
    return `${baseUrl}?${querystring}`;
}

function read(...segments) {
    const filepath = path.join.apply(path, segments);
    return fs.readFile(filepath).then(body => JSON.parse(body));
}

module.exports = app;
