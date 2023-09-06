(function () {
    const BUIENRADAR_API = 'https://data.buienradar.nl/2.0/feed/json';
    const CITIES_API = 'https://files.instruct.nl/fundament/buienradar/cities.js';

    const CACHE_MS = 300_000;

    const LS_CACHE = 'nl.instruct.buienradar';

    const ERROR_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAUUlEQVQoz2P4DwQMDP+JAWBlDCAKggiqBiMGZA5B1WAbMITwqEbSgEsPhiBeaWxGMOB0AA5H4nU0Ni9RroE0J5HmadKClbSIIy1pkJn4iE7eALWZVcf6S1ptAAAAAElFTkSuQmCC';

    const POS_INSTRUCT = {lat: 52.071, lon: 4.763};

    let data = null;
    // noinspection JSMismatchedCollectionQueryUpdate
    let cities = [];
    let pos = POS_INSTRUCT;

    async function cachedFetch(url, json = true) {
        const now = +new Date();

        let cache = {};

        try {
            cache = JSON.parse(localStorage.getItem(LS_CACHE)) || {};
        } catch (e) {
        }

        for (let key in cache) {
            if (now - cache[key].ts > CACHE_MS) {
                delete cache[key];
            }
        }

        if (typeof cache[url] === 'undefined') {
            cache[url] = {
                data: null,
                ts: 0
            };
        }

        if (now - cache[url].ts > CACHE_MS || cache[url].data === null) {
            const res = await fetch(url, {credentials: 'omit'});
            cache[url].data = json ? (await res.json()) : (await res.text());
            cache[url].ts = now;
        }

        localStorage.setItem(LS_CACHE, JSON.stringify(cache));
        return cache[url].data;
    }

    async function delay(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    async function load(callback) {
        const script = document.createElement('script');
        script.src = CITIES_API;
        document.body.appendChild(script);

        data = await cachedFetch(BUIENRADAR_API);

        pos = await getLocation();

        for (let i = 0; i < 20; i++) {
            if (cities.length) {
                break;
            }
            await delay(50);
        }

        callback.bind(window)();
    }

    async function getLocation() {
        if (!navigator.geolocation) {
            // Instruct B.V. :-)
            return POS_INSTRUCT;
        }

        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            return {lat: pos.coords.latitude, lon: pos.coords.longitude};
        } catch (e) {
            return POS_INSTRUCT;
        }
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    function getDistance(pos1, pos2) {
        const R = 6371;

        const dLat = deg2rad(pos2.lat - pos1.lat);
        const dLon = deg2rad(pos2.lon - pos1.lon);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(pos1.lat)) * Math.cos(deg2rad(pos2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function getNearestWeatherStation(search) {
        return data.actual.stationmeasurements.reduce(({nearest, distance}, station) => {
            const stationPos = {lat: station.lat, lon: station.lon};
            const stationDistance = getDistance(pos, stationPos);
            if (stationDistance < distance && (typeof station[search] !== 'undefined')) {
                return {nearest: station, distance: stationDistance};
            } else {
                return {nearest, distance};
            }
        }, {nearest: null, distance: Infinity}).nearest ?? null;
    }

    function renderer(resolver, attribute = 'textContent', errorValue = '-') {
        return (id) => {
            let value;
            try {
                value = resolver();
            } catch (e) {
                value = errorValue;
            }

            if (typeof id !== 'undefined' && id !== null) {
                const element = document.getElementById(id);

                if (element === null) {
                    console.warn(`Je probeerde informatie weer te geven op een niet-bestaand element met ID ${id}!`);
                } else {
                    element[attribute] = value;
                }
            }

            return value;
        };
    }

    function rendererForNearestStation(property, attribute = 'textContent', errorValue = '-') {
        return renderer(() => {
            const station = getNearestWeatherStation(property);

            if (!station) {
                throw new Error('Dichtbij station niet gevonden!');
            }

            if (typeof station[property] !== 'undefined') {
                return station[property];
            }

            throw new Error(`Geen station gevonden met eigenschap ${property}`);
        }, attribute, errorValue);
    }

    function rendererForStation(property, attribute = 'textContent', errorValue = '-') {
        return (stationId, id) => {
            return renderer(() => {
                const station = data.actual.stationmeasurements.find((s) => s.stationid === stationId);

                if (!station) {
                    throw new Error(`Station met ID ${stationId} bestaat niet`);
                }

                if (typeof station[property] !== 'undefined') {
                    return station[property];
                }

                throw new Error(`Station ${stationId} heeft geen eigenschap ${property}`);
            }, attribute, errorValue)(id);
        };
    }

    function rendererForNestedProperty(nestedProperty, attribute = 'textContent', errorValue = '-') {
        return renderer(nestedPropertyResolver(nestedProperty), attribute, errorValue);
    }

    function nestedPropertyResolver(nestedProperty) {
        return () => {
            const parts = nestedProperty.split('.');
            let cursor = data;

            for (let part of parts) {
                if (cursor[part]) {
                    cursor = cursor[part];
                } else {
                    throw new Error(`Eigenschap ${part} niet gevonden in cursor (query: ${nestedProperty})`);
                }
            }

            return cursor;
        };
    }

    function rendererForFiveDayForecast(property, attribute = 'textContent', errorValue = '-') {
        return (id, day) => {
            if (typeof day === 'undefined') {
                day = id;
                id = null;
            }
            return renderer(() => fiveDayForecastResolver(property)(day), attribute, errorValue)(id);
        };
    }

    function fiveDayForecastResolver(property) {
        return (day) => {
            if (day < 1 || day > 5) {
                throw new Error(`Dag ${day} is niet geldig`);
            }

            if (data.forecast.fivedayforecast.length !== 5) {
                throw new Error('Onverwacht aantal voorspellingen in de vijfdaagse voorspelling');
            }

            const forecast = data.forecast.fivedayforecast[day - 1];

            if (forecast && typeof forecast[property] !== 'undefined') {
                return forecast[property];
            }

            throw new Error(`Eigenschap ${property} niet gevonden in voorspelling #${day}`);
        };
    }

    function rendererForDate(resolver) {
        return (id, date) => {
            if (typeof date === 'undefined') {
                date = id;
                id = null;
            }

            if (Object.prototype.toString.call(date) !== '[object Date]') {
                date = new Date(date);
            }

            return renderer(() => resolver(date))(id);
        };
    }

    async function showRainChart(id, demo) {
        const e = document.getElementById(id);
        demo = demo || false;

        if (e === null) {
            console.error(`Je probeerde informatie weer te geven op een niet-bestaand element met ID ${id}!`);
            return;
        }

        const res = await cachedFetch(`https://gpsgadget.buienradar.nl/data/raintext?lat=${pos.lat}&lon=${pos.lon}`, false);

        let demoDatapoint = Math.random() * .5;

        const dataPoints = res.split("\n").map((line) => {
            const matches = line.match(/^(\d{3})\|(\d\d:\d\d)/);

            if (matches === null) {
                return null;
            }

            const value = parseInt(matches[1], 10);
            const time = matches[2];

            demoDatapoint += .5 * (0.5 - Math.random());
            demoDatapoint = Math.max(0, demoDatapoint);

            const mmPerHour = demo
                ? demoDatapoint
                : Math.pow(10, ((value - 109) / 32)).toFixed(1);

            return {time, mmPerHour};
        }).filter(v => v !== null);

        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';

        e.appendChild(canvas);

        const config = {
            type: 'bar',
            data: {
                labels: dataPoints.map((p) => p.time),
                datasets: [
                    {
                        label: 'Neerslag (mm/uur)',
                        data: dataPoints.map((p) => p.mmPerHour),
                        backgroundColor: '#0064ff'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        suggestedMax: 1
                    }
                }
            }
        };

        new Chart(canvas, config);
    }

    // noinspection JSUnusedGlobalSymbols
    window.buienradar = {
        __loadCityDatabase: function (data) {
            cities = data;
        },
        load,
        date: {
            name: rendererForDate((date) => {
                return ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'][date.getDay()];
            }),
            date: rendererForDate((date) => {
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                const day = date.getDate();

                return `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
            }),
            dayMonth: rendererForDate((date) => {
                const month = date.getMonth() + 1;
                const day = date.getDate();

                return `${day < 10 ? '0' : ''}${day}-${month < 10 ? '0' : ''}${month}`;
            }),
            time: rendererForDate((date) => {
                const hour = date.getHours();
                const minute = date.getMinutes();

                return `${hour < 10 ? '0' : ''}${hour}:${minute < 10 ? '0' : ''}${minute}`;
            })
        },
        buienradar: {
            copyright: rendererForNestedProperty('buienradar.copyright'),
            terms: rendererForNestedProperty('buienradar.terms'),
        },
        sunrise: nestedPropertyResolver('actual.sunrise'),
        sunset: nestedPropertyResolver('actual.sunset'),
        map: rendererForNestedProperty('actual.actualradarurl', 'src', ERROR_IMG),
        currentLocation: {
            cityName: renderer(() => {
                return cities.reduce(({nearest, distance}, city) => {
                    const [lat, lon, name] = city;
                    const cityDistance = getDistance(pos, {lat, lon});

                    if (cityDistance < distance) {
                        return {nearest: name, distance: cityDistance};
                    } else {
                        return {nearest, distance};
                    }
                }, {nearest: null, distance: Infinity}).nearest ?? null;
            }),
            station: {
                name: rendererForNearestStation('stationname'),
                regio: rendererForNearestStation('regio'),
            },
            icon: rendererForNearestStation('iconurl', 'src', ERROR_IMG),
            description: rendererForNearestStation('weatherdescription'),
            temperature: {
                actual: rendererForNearestStation('temperature'),
                ground: rendererForNearestStation('groundtemperature'),
                feel: rendererForNearestStation('feeltemperature'),
            },
            wind: {
                direction: rendererForNearestStation('winddirection'),
                directionDegrees: rendererForNearestStation('winddirectiondegrees'),
                gusts: rendererForNearestStation('windgusts'),
                speed: rendererForNearestStation('windspeed'),
                speedBft: rendererForNearestStation('windspeedBft'),
            },
            airPressure: rendererForNearestStation('airpressure'),
            visibility: rendererForNearestStation('visibility'),
            humidity: rendererForNearestStation('humidity'),
            sunPower: rendererForNearestStation('sunpower'),
            rain: {
                now: rendererForNearestStation('precipitation'),
                last24Hours: rendererForNearestStation('rainFallLast24Hour'),
                lastHour: rendererForNearestStation('rainFallLastHour'),
            },

        },
        weatherStation: {
            station: {
                name: rendererForStation('stationname'),
                regio: rendererForStation('regio'),
            },
            icon: rendererForStation('iconurl', 'src', ERROR_IMG),
            description: rendererForStation('weatherdescription'),
            temperature: {
                actual: rendererForStation('temperature'),
                ground: rendererForStation('groundtemperature'),
                feel: rendererForStation('feeltemperature'),
            },
            wind: {
                direction: rendererForStation('windidrection'),
                directionDegrees: rendererForStation('winddirectiondegrees'),
                gusts: rendererForStation('windgusts'),
                speed: rendererForStation('windspeed'),
                speedBft: rendererForStation('windspeedBft'),
            },
            airPressure: rendererForStation('airpressure'),
            visibiliy: rendererForStation('visibility'),
            humidity: rendererForStation('humidity'),
            sunPower: rendererForStation('sunpower'),
            rain: {
                now: rendererForStation('precipitation'),
                last24Hours: rendererForStation('rainFallLast24Hour'),
                lastHour: rendererForStation('rainFallLastHour'),
            },
        },
        forecast: {
            report: {
                published: nestedPropertyResolver('forecast.weatherreport.published'),
                title: rendererForNestedProperty('forecast.weatherreport.title'),
                summary: rendererForNestedProperty('forecast.weatherreport.summary'),
                text: rendererForNestedProperty('forecast.weatherreport.text', 'innerHTML'),
                author: rendererForNestedProperty('forecast.weatherreport.author'),
                authorBio: rendererForNestedProperty('forecast.weatherreport.authorbio'),
            },
            shortTerm: {
                start: nestedPropertyResolver('forecast.shortterm.startdate'),
                end: nestedPropertyResolver('forecast.shortterm.enddate'),
                forecast: rendererForNestedProperty('forecast.shortterm.forecast')
            },
            longTerm: {
                start: nestedPropertyResolver('forecast.longterm.startdate'),
                end: nestedPropertyResolver('forecast.longterm.enddate'),
                forecast: rendererForNestedProperty('forecast.longterm.forecast')
            },
            fiveDays: {
                date: fiveDayForecastResolver('day'),
                temperature: {
                    min: rendererForFiveDayForecast('mintemperatureMin'),
                    max: rendererForFiveDayForecast('maxtemperatureMax'),
                },
                rain: {
                    chance: rendererForFiveDayForecast('rainChance'),
                    mmMin: rendererForFiveDayForecast('mmRainMin'),
                    mmMax: rendererForFiveDayForecast('mmRainMax'),
                },
                sunChance: rendererForFiveDayForecast('sunChance'),
                wind: {
                    direction: rendererForFiveDayForecast('windDirection'),
                    speed: rendererForFiveDayForecast('wind'),
                },
                description: rendererForFiveDayForecast('weatherdescription'),
                icon: rendererForFiveDayForecast('iconurl', 'src', ERROR_IMG),
            }
        },
        showRainChart
    };
})();