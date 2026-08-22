/**
 * AI可読性・先祖返り防止コメント:
 * 【ファイル分割の経緯】
 * 空港データ（特にFictional空港）を大量に追加したことによるファイルの肥大化とバグ（括弧の閉じ忘れ等）を
 * 未然に防ぐため、実在する空港データ（Major, Local）を独立したモジュールとして管理しています。
 */
export const REAL_AIRPORTS = [
    // --- Major Hubs (主要空港: 三重円で描画) ---
    { id: 'HND', name: 'Tokyo Haneda', lat: 35.5494, lon: 139.7798, country: 'Japan', type: 'major' },
    { id: 'NRT', name: 'Tokyo Narita', lat: 35.7720, lon: 140.3929, country: 'Japan', type: 'major' },
    { id: 'KIX', name: 'Kansai Intl', lat: 34.4320, lon: 135.2304, country: 'Japan', type: 'major' },
    { id: 'ICN', name: 'Seoul Incheon', lat: 37.4602, lon: 126.4407, country: 'South Korea', type: 'major' },
    { id: 'PEK', name: 'Beijing Capital', lat: 40.0799, lon: 116.6031, country: 'China', type: 'major' },
    { id: 'PVG', name: 'Shanghai Pudong', lat: 31.1443, lon: 121.8083, country: 'China', type: 'major' },
    { id: 'HKG', name: 'Hong Kong', lat: 22.3080, lon: 113.9185, country: 'Hong Kong', type: 'major' },
    { id: 'TPE', name: 'Taiwan Taoyuan', lat: 25.0797, lon: 121.2342, country: 'Taiwan', type: 'major' },
    { id: 'SIN', name: 'Singapore Changi', lat: 1.3644, lon: 103.9915, country: 'Singapore', type: 'major' },
    { id: 'BKK', name: 'Bangkok Suvarnabhumi', lat: 13.6900, lon: 100.7501, country: 'Thailand', type: 'major' },
    { id: 'MNL', name: 'Manila Ninoy Aquino', lat: 14.5086, lon: 121.0194, country: 'Philippines', type: 'major' },
    { id: 'CGK', name: 'Jakarta Soekarno-Hatta', lat: -6.1275, lon: 106.6537, country: 'Indonesia', type: 'major' },
    { id: 'DEL', name: 'Delhi Indira Gandhi', lat: 28.5562, lon: 77.1000, country: 'India', type: 'major' },
    { id: 'BOM', name: 'Mumbai Chhatrapati', lat: 19.0896, lon: 72.8656, country: 'India', type: 'major' },
    { id: 'DXB', name: 'Dubai Intl', lat: 25.2532, lon: 55.3657, country: 'UAE', type: 'major' },
    { id: 'DOH', name: 'Doha Hamad', lat: 25.2731, lon: 51.6081, country: 'Qatar', type: 'major' },
    
    { id: 'SYD', name: 'Sydney Kingsford Smith', lat: -33.9399, lon: 151.1753, country: 'Australia', type: 'major' },
    { id: 'MEL', name: 'Melbourne', lat: -37.6690, lon: 144.8410, country: 'Australia', type: 'major' },
    { id: 'AKL', name: 'Auckland', lat: -37.0082, lon: 174.7850, country: 'New Zealand', type: 'major' },
    { id: 'HNL', name: 'Honolulu', lat: 21.3187, lon: -157.9225, country: 'USA (Hawaii)', type: 'major' },

    { id: 'LAX', name: 'Los Angeles', lat: 33.9416, lon: -118.4085, country: 'USA', type: 'major' },
    { id: 'SFO', name: 'San Francisco', lat: 37.6213, lon: -122.3790, country: 'USA', type: 'major' },
    { id: 'JFK', name: 'New York JFK', lat: 40.6413, lon: -73.7781, country: 'USA', type: 'major' },
    { id: 'ORD', name: 'Chicago O\'Hare', lat: 41.9742, lon: -87.9073, country: 'USA', type: 'major' },
    { id: 'ATL', name: 'Atlanta Hartsfield', lat: 33.6407, lon: -84.4277, country: 'USA', type: 'major' },
    { id: 'MIA', name: 'Miami Intl', lat: 25.7959, lon: -80.2870, country: 'USA', type: 'major' },
    { id: 'YVR', name: 'Vancouver', lat: 49.1967, lon: -123.1815, country: 'Canada', type: 'major' },
    
    { id: 'MEX', name: 'Mexico City', lat: 19.4363, lon: -99.0721, country: 'Mexico', type: 'major' },
    { id: 'GRU', name: 'Sao Paulo Guarulhos', lat: -23.4356, lon: -46.4731, country: 'Brazil', type: 'major' },
    { id: 'EZE', name: 'Buenos Aires Ezeiza', lat: -34.8222, lon: -58.5358, country: 'Argentina', type: 'major' },
    { id: 'SCL', name: 'Santiago', lat: -33.3930, lon: -70.7858, country: 'Chile', type: 'major' },

    { id: 'LHR', name: 'London Heathrow', lat: 51.4700, lon: -0.4543, country: 'UK', type: 'major' },
    { id: 'CDG', name: 'Paris Charles de Gaulle', lat: 49.0097, lon: 2.5479, country: 'France', type: 'major' },
    { id: 'FRA', name: 'Frankfurt', lat: 50.0379, lon: 8.5622, country: 'Germany', type: 'major' },
    { id: 'AMS', name: 'Amsterdam Schiphol', lat: 52.3105, lon: 4.7683, country: 'Netherlands', type: 'major' },
    { id: 'MAD', name: 'Madrid Barajas', lat: 40.4839, lon: -3.5680, country: 'Spain', type: 'major' },
    { id: 'FCO', name: 'Rome Fiumicino', lat: 41.8003, lon: 12.2389, country: 'Italy', type: 'major' },
    { id: 'IST', name: 'Istanbul', lat: 41.2753, lon: 28.7520, country: 'Turkey', type: 'major' },
    
    { id: 'CAI', name: 'Cairo Intl', lat: 30.1219, lon: 31.4056, country: 'Egypt', type: 'major' },
    { id: 'JNB', name: 'Johannesburg', lat: -26.1367, lon: 28.2411, country: 'South Africa', type: 'major' },
    { id: 'NBO', name: 'Nairobi Jomo Kenyatta', lat: -1.3192, lon: 36.9278, country: 'Kenya', type: 'major' },
    { id: 'CMN', name: 'Casablanca Mohammed V', lat: 33.3675, lon: -7.5899, country: 'Morocco', type: 'major' },

    // --- Local / Regional Airports (ローカル空港: 二重円で描画) ---
    { id: 'CTS', name: 'New Chitose', lat: 42.7752, lon: 141.6923, country: 'Japan', type: 'local' },
    { id: 'FUK', name: 'Fukuoka', lat: 33.5859, lon: 130.4507, country: 'Japan', type: 'local' },
    { id: 'OKA', name: 'Naha Okinawa', lat: 26.1958, lon: 127.6458, country: 'Japan', type: 'local' },
    { id: 'NGO', name: 'Chubu Centrair', lat: 34.8583, lon: 136.8054, country: 'Japan', type: 'local' },
    { id: 'DPS', name: 'Bali Ngurah Rai', lat: -8.7482, lon: 115.1675, country: 'Indonesia', type: 'local' },
    { id: 'CEB', name: 'Cebu Mactan', lat: 10.3075, lon: 123.9794, country: 'Philippines', type: 'local' },
    { id: 'HAN', name: 'Hanoi Noi Bai', lat: 21.2212, lon: 105.8072, country: 'Vietnam', type: 'local' },
    { id: 'BNE', name: 'Brisbane', lat: -27.3842, lon: 153.1175, country: 'Australia', type: 'local' },
    { id: 'PER', name: 'Perth', lat: -31.9403, lon: 115.9668, country: 'Australia', type: 'local' },
    { id: 'NAN', name: 'Nadi Intl', lat: -17.7554, lon: 177.4432, country: 'Fiji', type: 'local' },
    { id: 'PPT', name: 'Tahiti Faa\'a', lat: -17.5539, lon: -149.6074, country: 'French Polynesia', type: 'local' },
    { id: 'GUM', name: 'Guam', lat: 13.4834, lon: 144.7960, country: 'Guam', type: 'local' },
    { id: 'SEA', name: 'Seattle Tacoma', lat: 47.4502, lon: -122.3088, country: 'USA', type: 'local' },
    { id: 'LAS', name: 'Las Vegas McCarran', lat: 36.0840, lon: -115.1537, country: 'USA', type: 'local' },
    { id: 'ANC', name: 'Anchorage', lat: 61.1743, lon: -149.9962, country: 'USA', type: 'local' },
    { id: 'CUN', name: 'Cancun', lat: 21.0365, lon: -86.8771, country: 'Mexico', type: 'local' },
    { id: 'HAV', name: 'Havana Jose Marti', lat: 22.9892, lon: -82.4091, country: 'Cuba', type: 'local' },
    { id: 'BCN', name: 'Barcelona El Prat', lat: 41.2974, lon: 2.0833, country: 'Spain', type: 'local' },
    { id: 'ATH', name: 'Athens', lat: 37.9364, lon: 23.9445, country: 'Greece', type: 'local' },
    { id: 'KEF', name: 'Keflavik Intl', lat: 63.9850, lon: -22.6056, country: 'Iceland', type: 'local' },
    { id: 'SEZ', name: 'Seychelles Intl', lat: -4.6743, lon: 55.5219, country: 'Seychelles', type: 'local' },
    { id: 'MLE', name: 'Velana Male', lat: 4.1918, lon: 73.5291, country: 'Maldives', type: 'local' }
];

