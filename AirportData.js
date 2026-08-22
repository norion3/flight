/**
 * AI可読性・先祖返り防止コメント:
 * このファイルは世界中の「主要空港」のマスターデータ（IATAコード、都市名、緯度、経度）を保持します。
 * 将来のフライトシミュレーションゲームにおけるノード（接続点）となり、
 * 同時に `MapData.js` における「空港が存在しない孤島の自動間引きロジック」の判定基準としても利用されます。
 */
export const AIRPORTS = [
    // 日本・アジア主要空港
    { id: 'HND', name: 'Tokyo Haneda', lat: 35.5494, lon: 139.7798, country: 'Japan' },
    { id: 'NRT', name: 'Tokyo Narita', lat: 35.7720, lon: 140.3929, country: 'Japan' },
    { id: 'KIX', name: 'Kansai Intl', lat: 34.4320, lon: 135.2304, country: 'Japan' },
    { id: 'CTS', name: 'New Chitose', lat: 42.7752, lon: 141.6923, country: 'Japan' },
    { id: 'FUK', name: 'Fukuoka', lat: 33.5859, lon: 130.4507, country: 'Japan' },
    { id: 'OKA', name: 'Naha Okinawa', lat: 26.1958, lon: 127.6458, country: 'Japan' },
    { id: 'ICN', name: 'Seoul Incheon', lat: 37.4602, lon: 126.4407, country: 'South Korea' },
    { id: 'PEK', name: 'Beijing Capital', lat: 40.0799, lon: 116.6031, country: 'China' },
    { id: 'PVG', name: 'Shanghai Pudong', lat: 31.1443, lon: 121.8083, country: 'China' },
    { id: 'HKG', name: 'Hong Kong', lat: 22.3080, lon: 113.9185, country: 'Hong Kong' },
    { id: 'TPE', name: 'Taiwan Taoyuan', lat: 25.0797, lon: 121.2342, country: 'Taiwan' },
    { id: 'SIN', name: 'Singapore Changi', lat: 1.3644, lon: 103.9915, country: 'Singapore' },
    { id: 'BKK', name: 'Bangkok Suvarnabhumi', lat: 13.6900, lon: 100.7501, country: 'Thailand' },
    { id: 'MNL', name: 'Manila Ninoy Aquino', lat: 14.5086, lon: 121.0194, country: 'Philippines' },
    { id: 'CGK', name: 'Jakarta Soekarno-Hatta', lat: -6.1275, lon: 106.6537, country: 'Indonesia' },

    // オセアニア・太平洋
    { id: 'SYD', name: 'Sydney Kingsford Smith', lat: -33.9399, lon: 151.1753, country: 'Australia' },
    { id: 'MEL', name: 'Melbourne', lat: -37.6690, lon: 144.8410, country: 'Australia' },
    { id: 'AKL', name: 'Auckland', lat: -37.0082, lon: 174.7850, country: 'New Zealand' },
    { id: 'HNL', name: 'Honolulu', lat: 21.3187, lon: -157.9225, country: 'USA (Hawaii)' },
    { id: 'GUM', name: 'Guam Antonio B. Won Pat', lat: 13.4834, lon: 144.7960, country: 'Guam' },

    // 北米・中南米
    { id: 'LAX', name: 'Los Angeles', lat: 33.9416, lon: -118.4085, country: 'USA' },
    { id: 'JFK', name: 'New York JFK', lat: 40.6413, lon: -73.7781, country: 'USA' },
    { id: 'SFO', name: 'San Francisco', lat: 37.6213, lon: -122.3790, country: 'USA' },
    { id: 'ORD', name: 'Chicago O\'Hare', lat: 41.9742, lon: -87.9073, country: 'USA' },
    { id: 'YVR', name: 'Vancouver', lat: 49.1967, lon: -123.1815, country: 'Canada' },
    { id: 'MEX', name: 'Mexico City', lat: 19.4363, lon: -99.0721, country: 'Mexico' },
    { id: 'GRU', name: 'Sao Paulo Guarulhos', lat: -23.4356, lon: -46.4731, country: 'Brazil' },
    { id: 'EZE', name: 'Buenos Aires Ezeiza', lat: -34.8222, lon: -58.5358, country: 'Argentina' },

    // ヨーロッパ
    { id: 'LHR', name: 'London Heathrow', lat: 51.4700, lon: -0.4543, country: 'UK' },
    { id: 'CDG', name: 'Paris Charles de Gaulle', lat: 49.0097, lon: 2.5479, country: 'France' },
    { id: 'FRA', name: 'Frankfurt', lat: 50.0379, lon: 8.5622, country: 'Germany' },
    { id: 'AMS', name: 'Amsterdam Schiphol', lat: 52.3105, lon: 4.7683, country: 'Netherlands' },
    { id: 'MAD', name: 'Madrid Barajas', lat: 40.4839, lon: -3.5680, country: 'Spain' },
    { id: 'FCO', name: 'Rome Fiumicino', lat: 41.8003, lon: 12.2389, country: 'Italy' },

    // 中東・アフリカ
    { id: 'DXB', name: 'Dubai Intl', lat: 25.2532, lon: 55.3657, country: 'UAE' },
    { id: 'DOH', name: 'Doha Hamad', lat: 25.2731, lon: 51.6081, country: 'Qatar' },
    { id: 'CAI', name: 'Cairo Intl', lat: 30.1219, lon: 31.4056, country: 'Egypt' },
    { id: 'JNB', name: 'Johannesburg O.R. Tambo', lat: -26.1367, lon: 28.2411, country: 'South Africa' },
    { id: 'SEZ', name: 'Seychelles Intl', lat: -4.6743, lon: 55.5219, country: 'Seychelles' },
    { id: 'MLE', name: 'Velana Male', lat: 4.1918, lon: 73.5291, country: 'Maldives' }
];

