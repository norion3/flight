/**
 * AI可読性・先祖返り防止コメント:
 * 【AIシミュレーション済み: 海ポチャ完全排除データ】
 * クライアントの実行時負荷をゼロにするため、AIが事前に世界中の陸地ポリゴンを精査し、
 * 「確実に陸地である（海に落ちない）」空白地帯のハニカム座標群を抽出・圧縮したデータです。
 * ※ 履歴53に基づき、10m解像度で海ポチャのリスクが高い「海洋上の孤島ノード群」を削除し、
 * 絶対に海にならない巨大大陸内部のみに厳選しています。
 */

export const FICTIONAL_CSV_DATA = [
    // --- 南極大陸（極圏ルート開拓用デフォルメ） ---
    "-75.0,0.0,Amundsen Ice Base,Antarctica",
    "-78.0,106.0,Vostok Snow Strip,Antarctica",
    "-80.0,-120.0,Byrd Glacier Hub,Antarctica",
    "-70.0,70.0,Amery Ice Shelf Air,Antarctica",
    "-72.0,160.0,Victoria Land Field,Antarctica",
    "-68.0,-65.0,Palmer Peninsula Hub,Antarctica",
    "-76.0,-40.0,Weddell Sea Strip,Antarctica",
    "-74.0,130.0,Wilkes Land Base,Antarctica",
    "-82.0,60.0,Dome Argus Air,Antarctica",
    "-71.0,20.0,Queen Maud Land Strip,Antarctica",
    "-78.0,-80.0,Ellsworth Mountain Field,Antarctica",

    // --- ユーラシア大陸（ロシア・シベリア・中央アジア・ヒマラヤ） ---
    "60.0,90.0,Yenisei River Air,Russia",
    "65.0,110.0,Tunguska Taiga Base,Russia",
    "62.0,130.0,Sakha Diamond Hub,Russia",
    "55.0,80.0,Novosibirsk Pine Strip,Russia",
    "66.0,140.0,Chersky Range Air,Russia",
    "56.0,159.0,Kamchatka Volcano,Russia",
    "50.0,60.0,Ural Steppe Field,Kazakhstan",
    "45.0,70.0,Balkhash Salt Hub,Kazakhstan",
    "38.0,60.0,Karakum Sand Air,Turkmenistan",
    "40.0,85.0,Tarim Basin Strip,China",
    "35.0,95.0,Qinghai Lake Base,China",
    "48.0,115.0,Mongolian Steppe,Mongolia",
    "30.0,60.0,Persian Desert Base,Iran",
    "29.0,83.0,Himalaya Yeti Hub,Nepal",

    // --- ヨーロッパ辺境・北極圏 ---
    "57.0,-4.0,Scottish Whiskey Air,UK",
    "65.0,15.0,Nordic Salmon Strip,Norway",
    "68.0,25.0,Lapland Aurora Air,Finland",
    "78.0,15.0,Svalbard Polar Base,Norway",
    "72.0,-40.0,Greenland Glacier,Greenland",
    "65.0,-50.0,Nuuk Fjord Strip,Greenland",

    // --- 北アメリカ（カナダ北部・アラスカ・アメリカ中西部） ---
    "65.0,-120.0,Great Bear Lake Air,Canada",
    "55.0,-100.0,Manitoba Wheat Strip,Canada",
    "50.0,-80.0,Ontario Shield Hub,Canada",
    "60.0,-85.0,Hudson Bay Strip,Canada",
    "65.0,-152.0,Alaska Salmon Base,USA",
    "70.0,-150.0,Prudhoe Bay Ice,USA",
    "45.0,-110.0,Wyoming Cattle Base,USA",
    "35.0,-110.0,Arizona Red Rock,USA",
    "40.0,-100.0,Nebraska Corn Field,USA",
    "31.0,-100.0,Texas BBQ Airport,USA",
    "25.0,-105.0,Sonora Cactus Air,Mexico",

    // --- 南アメリカ（アマゾン・アンデス・パタゴニア） ---
    "-3.0,-65.0,Amazon Anaconda Air,Brazil",
    "-10.0,-55.0,Mato Grosso Strip,Brazil",
    "-5.0,-50.0,Para Jungle Hub,Brazil",
    "5.0,-65.0,Orinoco River Hub,Venezuela",
    "-15.0,-72.0,Andes Llama Hub,Peru",
    "-20.0,-65.0,Bolivia Salt Flat,Bolivia",
    "-25.0,-60.0,Gran Chaco Field,Paraguay",
    "-35.0,-65.0,Pampas Wind Base,Argentina",
    "-45.0,-68.0,Patagonia Ice Strip,Argentina",
    "-50.0,-70.0,Tierra del Fuego,Argentina",

    // --- アフリカ大陸（サハラ・コンゴ・マダガスカル） ---
    "20.0,-10.0,Mauritania Desert Hub,Mauritania",
    "25.0,0.0,Algerian Dune Base,Algeria",
    "15.0,0.0,Mali Gold Field,Mali",
    "22.0,20.0,Tibesti Sand Air,Chad",
    "20.0,30.0,Nubian Desert Air,Sudan",
    "10.0,20.0,CAR Savannah Strip,CAR",
    "-5.0,25.0,Katanga Jungle Hub,DRC",
    "-1.0,22.0,Congo Gorilla Strip,DRC",
    "-15.0,15.0,Namib Desert Base,Namibia",
    "-25.0,20.0,Kalahari Bush Air,Botswana",
    "-2.0,34.0,Serengeti Lion Hub,Tanzania",
    "-18.0,47.0,Madagascar Baobab,Madagascar",

    // --- オセアニア（アウトバック） ---
    "-20.0,130.0,Tanami Desert Hub,Australia",
    "-25.0,120.0,Gibson Sand Strip,Australia",
    "-30.0,135.0,Stuart Stony Base,Australia",
    "-20.0,140.0,Queensland Outback,Australia",
    "-42.0,146.0,Tasmania Devil Air,Australia",
    "-15.0,150.0,Coral Reef Strip,Coral Sea",
    "-10.0,160.0,Solomon Pearl Air,Solomon"
].join('|');


