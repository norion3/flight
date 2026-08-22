/**
 * AI可読性・先祖返り防止コメント:
 * 【ゲームバランス最適化の要】
 * 航路を張り巡らせるため、世界中の空白地帯を埋める架空（Fictional）空港のデータ群です。
 * 景観を損なわないよう、デザインは最も控えめな「単円」で描画されます。
 * 実在データと分割することで、ファイルの肥大化とエラーを防いでいます。
 */
export const FICTIONAL_AIRPORTS = [
    // アジア・シベリア
    { id: 'F01', name: 'Aomori Apple Field', lat: 40.8196, lon: 140.7634, country: 'Japan', type: 'fictional' },
    { id: 'F02', name: 'Kyoto Matcha Strip', lat: 35.0116, lon: 135.7681, country: 'Japan', type: 'fictional' },
    { id: 'F03', name: 'Siberia Taiga Base', lat: 61.0, lon: 100.0, country: 'Russia', type: 'fictional' },
    { id: 'F04', name: 'Kamchatka Ice Air', lat: 56.0, lon: 159.0, country: 'Russia', type: 'fictional' },
    { id: 'F05', name: 'Gobi Desert Strip', lat: 43.0, lon: 105.0, country: 'Mongolia', type: 'fictional' },
    { id: 'F06', name: 'Himalaya Yeti Hub', lat: 29.0, lon: 83.0, country: 'Nepal', type: 'fictional' },

    // オセアニア
    { id: 'F10', name: 'Outback Red Sand', lat: -25.0, lon: 130.0, country: 'Australia', type: 'fictional' },
    { id: 'F11', name: 'Tasmania Devil Air', lat: -42.0, lon: 146.0, country: 'Australia', type: 'fictional' },
    { id: 'F12', name: 'Coral Reef Strip', lat: -15.0, lon: 150.0, country: 'Coral Sea', type: 'fictional' },

    // 北米・グリーンランド
    { id: 'F20', name: 'Texas BBQ Airport', lat: 31.0, lon: -100.0, country: 'USA', type: 'fictional' },
    { id: 'F21', name: 'Rocky Mountain Air', lat: 40.0, lon: -108.0, country: 'USA', type: 'fictional' },
    { id: 'F22', name: 'Alaska Salmon Base', lat: 65.0, lon: -152.0, country: 'USA', type: 'fictional' },
    { id: 'F23', name: 'Greenland Glacier', lat: 72.0, lon: -40.0, country: 'Greenland', type: 'fictional' },
    { id: 'F24', name: 'Yukon Maple Hub', lat: 58.0, lon: -130.0, country: 'Canada', type: 'fictional' },
    { id: 'F25', name: 'Hudson Bay Strip', lat: 60.0, lon: -85.0, country: 'Canada', type: 'fictional' },

    // 中南米
    { id: 'F30', name: 'Amazon Anaconda Air', lat: -3.0, lon: -65.0, country: 'Brazil', type: 'fictional' },
    { id: 'F31', name: 'Andes Llama Hub', lat: -15.0, lon: -72.0, country: 'Peru', type: 'fictional' },
    { id: 'F32', name: 'Patagonia Ice Strip', lat: -45.0, lon: -68.0, country: 'Argentina', type: 'fictional' },
    { id: 'F33', name: 'Galapagos Turtle Air', lat: -0.5, lon: -90.5, country: 'Ecuador', type: 'fictional' },

    // ヨーロッパ
    { id: 'F40', name: 'Scottish Whiskey Air', lat: 57.0, lon: -4.0, country: 'UK', type: 'fictional' },
    { id: 'F41', name: 'Swiss Cheese Base', lat: 46.5, lon: 7.0, country: 'Switzerland', type: 'fictional' },
    { id: 'F42', name: 'Nordic Salmon Strip', lat: 65.0, lon: 15.0, country: 'Norway', type: 'fictional' },
    { id: 'F43', name: 'Lapland Aurora Air', lat: 68.0, lon: 25.0, country: 'Finland', type: 'fictional' },

    // アフリカ・中東
    { id: 'F50', name: 'Sahara Oasis Field', lat: 22.0, lon: 10.0, country: 'Libya', type: 'fictional' },
    { id: 'F51', name: 'Serengeti Lion Hub', lat: -2.0, lon: 34.0, country: 'Tanzania', type: 'fictional' },
    { id: 'F52', name: 'Madagascar Baobab', lat: -18.0, lon: 47.0, country: 'Madagascar', type: 'fictional' },
    { id: 'F53', name: 'Arabian Camel Air', lat: 21.0, lon: 50.0, country: 'Saudi Arabia', type: 'fictional' },
    { id: 'F54', name: 'Congo Jungle Strip', lat: -1.0, lon: 22.0, country: 'DRC', type: 'fictional' },
    
    // 大西洋・太平洋 (ノードとしての島)
    { id: 'F60', name: 'Azores Blue Field', lat: 37.7, lon: -25.6, country: 'Portugal', type: 'fictional' },
    { id: 'F61', name: 'Canary Sun Base', lat: 28.2, lon: -16.5, country: 'Spain', type: 'fictional' },
    { id: 'F62', name: 'Easter Island Hub', lat: -27.1, lon: -109.3, country: 'Chile', type: 'fictional' }
];

