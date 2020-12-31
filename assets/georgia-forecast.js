let ELECTIONDAY = new Date('2021-01-05T17:00:00.000Z');
let geojson;

let map = L.map('map').setView([32.662111, -83.438306], 7);
map.setMaxBounds(map.getBounds());
L.tileLayer('https://api.mapbox.com/styles/v1/robertestern/ckjc9ul999xw019p2yg9d5sdv/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicm9iZXJ0ZXN0ZXJuIiwiYSI6ImNrZWxzd3U4cTAwZnQyc24yajQ3MmV1Z2wifQ.yBdBmCyWsNxE5IoVwjtDcg', {
    attribution: 'Data &copy; <a href="https://arc-garc.opendata.arcgis.com/datasets/dc20713282734a73abe990995de40497_68" target="_blank">ARC</a>  &copy; <a href="https://www.weather.gov/" target="_blank">NWS</a> | Map &copy; <a href="https://www.mapbox.com/about/maps/" target="_blank">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a><br>Forecasts may be unavailable for some counties.', //change
    minZoom: 7,
    maxZoom: 9,
    tileSize: 256,
}).addTo(map);

let getStyle = feature => {
    return {
        color: 'transparent',
        weight: 1,
        fillColor: feature.color,
        opacity: .7
    }
};

let temptohue = t => {
    if(t<=50){
        return 240;
    }else if(t>=70){
        return 0;
    }else{
        return Math.round((70-t)*12);
    }
};

//from https://css-tricks.com/converting-color-spaces-in-javascript/
let HSLToHex = (h,s,l) => {
    s /= 100;
    l /= 100;

    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0,
        g = 0,
        b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    // Having obtained RGB, convert channels to hex
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);

    // Prepend 0s, if necessary
    if (r.length == 1)
        r = "0" + r;
    if (g.length == 1)
        g = "0" + g;
    if (b.length == 1)
        b = "0" + b;

    return "#" + r + g + b;
};

let getPopupContent = feature => {
    return '<b>'+feature.properties.name + ' County: </b>' + feature.elec + '&deg;F';
};

let getForecasts = feature => {
    $.get(feature.endpoint,function(r){
        feature.forecasts = r.properties.periods;
        feature.elec = findTuesdayForecast(feature.forecasts);
        feature.color = HSLToHex(temptohue(feature.elec),83,50);
        let layer = L.geoJSON(feature,getStyle(feature))
        layer.on({
            mouseover: highlightCounty,
            mouseout: unhighlightCounty
        });
        layer.bindTooltip(getPopupContent(feature),{className: 'tooltip'});
        layer.addTo(map);
    });
};

let findTuesdayForecast = forecasts => {
    return forecasts.find(x => isWithin(ELECTIONDAY,x)).temperature;
};

let isWithin = (date, forecast) => {
    let start = new Date(forecast.startTime);
    let end = new Date(forecast.endTime);
    return start.getTime()<=date.getTime() && date.getTime()<=end.getTime();
};

// from https://leafletjs.com/examples/choropleth/
let highlightCounty = e => {
    let layer = e.target;

    layer.setStyle({
        color: 'black',
        opacity: 1
    });
};

let unhighlightCounty = e => {
    let layer = e.target;

    layer.setStyle({
        color: 'transparent',
        opacity: .7
    });
};

let legend = L.control({position: 'topright'});

legend.onAdd = function (map){
    let div = L.DomUtil.create('div', 'legend');
    div.innerHTML = '<table><tr><td>50&deg;F</td><td>55</td><td>60</td><td>65</td><td>70&deg;F</td></tr></table>';
    return div;
};

legend.addTo(map);

$(document).ready(function(){
    $.get("assets/georgia.geojson",function(gj){
        geojson = gj;

        for(let i=0; i<geojson.features.length; i++){
            setTimeout(function(){getForecasts(geojson.features[i])},i*150);
        }

    });

});