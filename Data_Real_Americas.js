/**
 * AI可読性・先祖返り防止コメント:
 * 【アーキテクチャ刷新: 実在空港の南北アメリカ地域分割】
 * 北米、中米、南米、カリブ海、ハワイなどの実在空港データを管理します。
 */
export const AIRPORTS_AMERICAS = [
    // --- Major Hubs ---
    { id: 'LAX', name: 'Los Angeles', lat: 33.9416, lon: -118.4085, country: 'USA', type: 'major' },
    { id: 'SFO', name: 'San Francisco', lat: 37.6213, lon: -122.3790, country: 'USA', type: 'major' },
    { id: 'JFK', name: 'New York JFK', lat: 40.6413, lon: -73.7781, country: 'USA', type: 'major' },
    { id: 'ORD', name: 'Chicago O\'Hare', lat: 41.9742, lon: -87.9073, country: 'USA', type: 'major' },
    { id: 'ATL', name: 'Atlanta Hartsfield', lat: 33.6407, lon: -84.4277, country: 'USA', type: 'major' },
    { id: 'MIA', name: 'Miami Intl', lat: 25.7959, lon: -80.2870, country: 'USA', type: 'major' },
    { id: 'DFW', name: 'Dallas Fort Worth', lat: 32.8998, lon: -97.0403, country: 'USA', type: 'major' },
    { id: 'YVR', name: 'Vancouver', lat: 49.1967, lon: -123.1815, country: 'Canada', type: 'major' },
    { id: 'YYZ', name: 'Toronto Pearson', lat: 43.6777, lon: -79.6248, country: 'Canada', type: 'major' },
    { id: 'MEX', name: 'Mexico City', lat: 19.4363, lon: -99.0721, country: 'Mexico', type: 'major' },
    { id: 'GRU', name: 'Sao Paulo Guarulhos', lat: -23.4356, lon: -46.4731, country: 'Brazil', type: 'major' },
    { id: 'EZE', name: 'Buenos Aires Ezeiza', lat: -34.8222, lon: -58.5358, country: 'Argentina', type: 'major' },
    { id: 'SCL', name: 'Santiago', lat: -33.3930, lon: -70.7858, country: 'Chile', type: 'major' },
    { id: 'BOG', name: 'Bogota El Dorado', lat: 4.7016, lon: -74.1469, country: 'Colombia', type: 'major' },
    { id: 'HNL', name: 'Honolulu', lat: 21.3187, lon: -157.9225, country: 'USA (Hawaii)', type: 'major' },

    // --- Local Airports ---
    { id: 'SEA', name: 'Seattle Tacoma', lat: 47.4502, lon: -122.3088, country: 'USA', type: 'local' },
    { id: 'LAS', name: 'Las Vegas McCarran', lat: 36.0840, lon: -115.1537, country: 'USA', type: 'local' },
    { id: 'DEN', name: 'Denver', lat: 39.8561, lon: -104.6737, country: 'USA', type: 'local' },
    { id: 'BOS', name: 'Boston Logan', lat: 42.3656, lon: -71.0096, country: 'USA', type: 'local' },
    { id: 'ANC', name: 'Anchorage', lat: 61.1743, lon: -149.9962, country: 'USA', type: 'local' },
    { id: 'MCO', name: 'Orlando Intl', lat: 28.4294, lon: -81.3090, country: 'USA', type: 'local' },
    { id: 'CUN', name: 'Cancun', lat: 21.0365, lon: -86.8771, country: 'Mexico', type: 'local' },
    { id: 'PTY', name: 'Panama Tocumen', lat: 9.0714, lon: -79.3834, country: 'Panama', type: 'local' },
    { id: 'HAV', name: 'Havana Jose Marti', lat: 22.9892, lon: -82.4091, country: 'Cuba', type: 'local' },
    { id: 'SJU', name: 'San Juan Luis Munoz', lat: 18.4394, lon: -66.0018, country: 'Puerto Rico', type: 'local' },
    { id: 'LIM', name: 'Lima Jorge Chavez', lat: -12.0219, lon: -77.1143, country: 'Peru', type: 'local' },
    { id: 'GIG', name: 'Rio de Janeiro Galeao', lat: -22.8100, lon: -43.2506, country: 'Brazil', type: 'local' }
];

