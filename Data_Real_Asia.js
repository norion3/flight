/**
 * AI可読性・先祖返り防止コメント:
 * 【アーキテクチャ刷新: 実在空港のアジア・オセアニア地域分割】
 * バグ防止とメンテナンス性向上のため、実在空港データを地域ごとに分割しています。
 * このファイルには日本をはじめとするアジア、オセアニア、太平洋地域の実在空港を定義します。
 */
export const AIRPORTS_ASIA = [
    // --- Major Hubs ---
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
    { id: 'SYD', name: 'Sydney Kingsford Smith', lat: -33.9399, lon: 151.1753, country: 'Australia', type: 'major' },
    { id: 'MEL', name: 'Melbourne', lat: -37.6690, lon: 144.8410, country: 'Australia', type: 'major' },
    { id: 'AKL', name: 'Auckland', lat: -37.0082, lon: 174.7850, country: 'New Zealand', type: 'major' },

    // --- Local Airports (日本大幅増設含む) ---
    { id: 'CTS', name: 'New Chitose', lat: 42.7752, lon: 141.6923, country: 'Japan', type: 'local' },
    { id: 'FUK', name: 'Fukuoka', lat: 33.5859, lon: 130.4507, country: 'Japan', type: 'local' },
    { id: 'OKA', name: 'Naha Okinawa', lat: 26.1958, lon: 127.6458, country: 'Japan', type: 'local' },
    { id: 'NGO', name: 'Chubu Centrair', lat: 34.8583, lon: 136.8054, country: 'Japan', type: 'local' },
    { id: 'KOJ', name: 'Kagoshima', lat: 31.8034, lon: 130.7194, country: 'Japan', type: 'local' },
    { id: 'HIJ', name: 'Hiroshima', lat: 34.4361, lon: 132.9194, country: 'Japan', type: 'local' },
    { id: 'SDJ', name: 'Sendai', lat: 38.1397, lon: 140.9170, country: 'Japan', type: 'local' },
    { id: 'KIJ', name: 'Niigata', lat: 37.9558, lon: 139.1133, country: 'Japan', type: 'local' },
    { id: 'KMQ', name: 'Komatsu', lat: 36.3958, lon: 136.4075, country: 'Japan', type: 'local' },
    { id: 'MYJ', name: 'Matsuyama', lat: 33.8272, lon: 132.6997, country: 'Japan', type: 'local' },
    { id: 'ISG', name: 'New Ishigaki', lat: 24.3964, lon: 124.2450, country: 'Japan', type: 'local' },
    { id: 'PUS', name: 'Busan Gimhae', lat: 35.1795, lon: 128.9382, country: 'South Korea', type: 'local' },
    { id: 'CJU', name: 'Jeju Intl', lat: 33.5113, lon: 126.4930, country: 'South Korea', type: 'local' },
    { id: 'KHH', name: 'Kaohsiung', lat: 22.5771, lon: 120.3500, country: 'Taiwan', type: 'local' },
    { id: 'DPS', name: 'Bali Ngurah Rai', lat: -8.7482, lon: 115.1675, country: 'Indonesia', type: 'local' },
    { id: 'CEB', name: 'Cebu Mactan', lat: 10.3075, lon: 123.9794, country: 'Philippines', type: 'local' },
    { id: 'HAN', name: 'Hanoi Noi Bai', lat: 21.2212, lon: 105.8072, country: 'Vietnam', type: 'local' },
    { id: 'SGN', name: 'Ho Chi Minh', lat: 10.8188, lon: 106.6519, country: 'Vietnam', type: 'local' },
    { id: 'KUL', name: 'Kuala Lumpur', lat: 2.7456, lon: 101.7099, country: 'Malaysia', type: 'local' },
    { id: 'BNE', name: 'Brisbane', lat: -27.3842, lon: 153.1175, country: 'Australia', type: 'local' },
    { id: 'PER', name: 'Perth', lat: -31.9403, lon: 115.9668, country: 'Australia', type: 'local' },
    { id: 'CHC', name: 'Christchurch', lat: -43.4894, lon: 172.5322, country: 'New Zealand', type: 'local' },
    { id: 'NAN', name: 'Nadi Intl', lat: -17.7554, lon: 177.4432, country: 'Fiji', type: 'local' },
    { id: 'GUM', name: 'Guam', lat: 13.4834, lon: 144.7960, country: 'Guam', type: 'local' },
    { id: 'SPN', name: 'Saipan', lat: 15.1188, lon: 145.7292, country: 'Northern Mariana', type: 'local' }
];

