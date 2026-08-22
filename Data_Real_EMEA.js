/**
 * AI可読性・先祖返り防止コメント:
 * 欧州、中東、アフリカの実在空港データ。
 */
export const AIRPORTS_EMEA = [
    // --- Major Hubs ---
    { id: 'LHR', name: 'London Heathrow', lat: 51.4700, lon: -0.4543, country: 'UK', type: 'major' },
    { id: 'CDG', name: 'Paris Charles de Gaulle', lat: 49.0097, lon: 2.5479, country: 'France', type: 'major' },
    { id: 'FRA', name: 'Frankfurt', lat: 50.0379, lon: 8.5622, country: 'Germany', type: 'major' },
    { id: 'AMS', name: 'Amsterdam Schiphol', lat: 52.3105, lon: 4.7683, country: 'Netherlands', type: 'major' },
    { id: 'MAD', name: 'Madrid Barajas', lat: 40.4839, lon: -3.5680, country: 'Spain', type: 'major' },
    { id: 'FCO', name: 'Rome Fiumicino', lat: 41.8003, lon: 12.2389, country: 'Italy', type: 'major' },
    { id: 'MUC', name: 'Munich', lat: 48.3537, lon: 11.7861, country: 'Germany', type: 'major' },
    { id: 'IST', name: 'Istanbul', lat: 41.2753, lon: 28.7520, country: 'Turkey', type: 'major' },
    { id: 'SVO', name: 'Moscow Sheremetyevo', lat: 55.9726, lon: 37.4146, country: 'Russia', type: 'major' },
    { id: 'DXB', name: 'Dubai Intl', lat: 25.2532, lon: 55.3657, country: 'UAE', type: 'major' },
    { id: 'DOH', name: 'Doha Hamad', lat: 25.2731, lon: 51.6081, country: 'Qatar', type: 'major' },
    { id: 'JED', name: 'Jeddah', lat: 21.6796, lon: 39.1565, country: 'Saudi Arabia', type: 'major' },
    { id: 'CAI', name: 'Cairo Intl', lat: 30.1219, lon: 31.4056, country: 'Egypt', type: 'major' },
    { id: 'JNB', name: 'Johannesburg', lat: -26.1367, lon: 28.2411, country: 'South Africa', type: 'major' },
    { id: 'ADD', name: 'Addis Ababa Bole', lat: 8.9778, lon: 38.7993, country: 'Ethiopia', type: 'major' },
    { id: 'CMN', name: 'Casablanca', lat: 33.3675, lon: -7.5899, country: 'Morocco', type: 'major' },

    // --- Local Airports ---
    { id: 'LGW', name: 'London Gatwick', lat: 51.1537, lon: -0.1821, country: 'UK', type: 'local' },
    { id: 'MAN', name: 'Manchester', lat: 53.3537, lon: -2.2750, country: 'UK', type: 'local' },
    { id: 'EDI', name: 'Edinburgh', lat: 55.9500, lon: -3.3725, country: 'UK', type: 'local' },
    { id: 'ORY', name: 'Paris Orly', lat: 48.7262, lon: 2.3652, country: 'France', type: 'local' },
    { id: 'NCE', name: 'Nice Cote d\'Azur', lat: 43.6584, lon: 7.2159, country: 'France', type: 'local' },
    { id: 'BCN', name: 'Barcelona', lat: 41.2974, lon: 2.0833, country: 'Spain', type: 'local' },
    { id: 'PMI', name: 'Palma de Mallorca', lat: 39.5517, lon: 2.7388, country: 'Spain', type: 'local' },
    { id: 'LIS', name: 'Lisbon', lat: 38.7742, lon: -9.1342, country: 'Portugal', type: 'local' },
    { id: 'MXP', name: 'Milan Malpensa', lat: 45.6301, lon: 8.7231, country: 'Italy', type: 'local' },
    { id: 'VCE', name: 'Venice', lat: 45.5053, lon: 12.3519, country: 'Italy', type: 'local' },
    { id: 'ZRH', name: 'Zurich', lat: 47.4582, lon: 8.5555, country: 'Switzerland', type: 'local' },
    { id: 'GVA', name: 'Geneva', lat: 46.2381, lon: 6.1089, country: 'Switzerland', type: 'local' },
    { id: 'VIE', name: 'Vienna', lat: 48.1103, lon: 16.5697, country: 'Austria', type: 'local' },
    { id: 'WAW', name: 'Vienna', lat: 52.1657, lon: 20.9671, country: 'Poland', type: 'local' },
    { id: 'ATH', name: 'Athens', lat: 37.9364, lon: 23.9445, country: 'Greece', type: 'local' },
    { id: 'CPH', name: 'Copenhagen', lat: 55.6180, lon: 12.6508, country: 'Denmark', type: 'local' },
    { id: 'ARN', name: 'Stockholm Arlanda', lat: 59.6498, lon: 17.9238, country: 'Sweden', type: 'local' },
    { id: 'OSL', name: 'Oslo', lat: 60.1976, lon: 11.1004, country: 'Norway', type: 'local' },
    { id: 'HEL', name: 'Helsinki', lat: 60.3172, lon: 24.9633, country: 'Finland', type: 'local' },
    { id: 'KEF', name: 'Keflavik', lat: 63.9850, lon: -22.6056, country: 'Iceland', type: 'local' },
    
    { id: 'AUH', name: 'Abu Dhabi', lat: 24.4329, lon: 54.6511, country: 'UAE', type: 'local' },
    { id: 'MCT', name: 'Muscat', lat: 23.5933, lon: 58.2844, country: 'Oman', type: 'local' },
    { id: 'BAH', name: 'Bahrain', lat: 26.2708, lon: 50.6336, country: 'Bahrain', type: 'local' },
    { id: 'AMM', name: 'Amman', lat: 31.7226, lon: 35.9932, country: 'Jordan', type: 'local' },
    { id: 'TLV', name: 'Tel Aviv', lat: 32.0094, lon: 34.8828, country: 'Israel', type: 'local' },
    { id: 'LOS', name: 'Lagos', lat: 6.5774, lon: 3.3215, country: 'Nigeria', type: 'local' },
    { id: 'NBO', name: 'Nairobi', lat: -1.3192, lon: 36.9278, country: 'Kenya', type: 'local' },
    { id: 'CPT', name: 'Cape Town', lat: -33.9715, lon: 18.6021, country: 'South Africa', type: 'local' },
    { id: 'MRU', name: 'Mauritius', lat: -20.4302, lon: 57.6766, country: 'Mauritius', type: 'local' },
    { id: 'SEZ', name: 'Seychelles', lat: -4.6743, lon: 55.5219, country: 'Seychelles', type: 'local' }
];


