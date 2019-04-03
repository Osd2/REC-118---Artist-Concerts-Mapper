$('#datePickerByRange').dateRangePicker({
    autoClose: false,
	format: 'YYYY-MM-DD',
    separator: ' to ',
    startDate: moment(),
});

mapboxgl.accessToken = 'pk.eyJ1Ijoib3NkZSIsImEiOiJjanR1Y3p5MDkxMnd2NDNtbW96OGVjY2lnIn0.qvu1YnUJmDe-5Umm8gVR5A';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [2.3518217564128463, 47.867515761500414],
    zoom: 4
});
var artistEvent;
var featuresContainer = { 
    type: 'FeatureCollection',
    features: []
};

function getData(){
    var artistId = $('#artistPicker').val();
    var timeRange = $('#datePickerByRange').val();
    if (artistId || timeRange != null) {
        var url = '//api.songkick.com/api/3.0/artists/' + artistId.substring(0, artistId.indexOf('-')) + '/calendar.json?apikey=io09K9l3ebJxmxe2&jsoncallback=?';
        songKickDataToMappBoxLayer(url, timeRange.substring(0, timeRange.indexOf(' to')), timeRange.substring(timeRange.lastIndexOf(' ') + 1, timeRange.length));
    } else {
        alert("Please Choose an artist and select a time range.");
    }
};

function songKickDataToMappBoxLayer(url, startDate, endDate) {
    var iterator = 0
    var noEvent = false
    if (artistEvent != undefined) {
        artistEvent.length = 0
        console.log('artistEvent.isEmpty')
    }
    if (featuresContainer.features.length != undefined) {
        featuresContainer.features.length = 0
        console.log('featuresContainer.isEmpty')
    }
    $.getJSON(url, function(data) {
        console.log(data)
        if (data.resultsPage.totalEntries != 0) {
            var events = data.resultsPage.results.event;
            events.forEach(function(item, index, array) {
                artistEvent = new Object();
                artistEvent.name = array[index].displayName;
                artistEvent.lat = array[index].location.lat;
                artistEvent.lng = array[index].location.lng;
                artistEvent.startDate = array[index].start.date;
                artistEvent.uri = array[index].uri;
                if (moment(artistEvent.startDate).isBetween(startDate, endDate)) {
                    geoJsonMaker(artistEvent);
                    iterator++
                }
            });
        } else {
            noEvent = true
            alert('Sorry, your artist has no concert scheduled !')
        }
        if (iterator === 0 && noEvent === false)
            alert('Sorry, your artist has no concert scheduled during the time select !')
        map.fire('click', { lngLat: [2.3518217564128463, 47.867515761500414] })
    });
};

function geoJsonMaker(obj) {
    var feature = {
        type: 'Feature',
        properties: {
            description: '<br><strong><a href="' + obj.uri + '" target="_blank">' + obj.name + '</a></strong><br><!--p>Description Event</p-->',
            icon: 'music'
        },
        geometry: {
            type: 'Point',
            coordinates: [obj.lng, obj.lat]
        }
    };
    featuresContainer.features.push(feature)
}

var layerFilled = false
map.on('click', function () {
    if (featuresContainer.features.length != 0) {
        if (layerFilled != true) {
            console.log(featuresContainer)
            map.addSource('features', { type: 'geojson', data: featuresContainer }); 
            map.addLayer({
                "id": "features",
                "type": "symbol",
                "source": "features",
                "layout": {
                    "icon-image": "{icon}-15",
                    "icon-allow-overlap": true
                }
            });
            layerFilled = true
        }
    }

    // When a click event occurs on a feature in the places layer, open a popup at the
    // location of the feature, with description HTML from its properties.
    map.on('click', 'features', function (e) {
        var coordinates = e.features[0].geometry.coordinates.slice();
        var description = e.features[0].properties.description;
        
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    
    new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);
    });
    
    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', 'places', function () {
        map.getCanvas().style.cursor = 'pointer';
    });
    
    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'places', function () {
        map.getCanvas().style.cursor = '';
    });
});