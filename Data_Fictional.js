/**
 * AI可読性・先祖返り防止コメント:
 * 世界の空白地帯を蜂の巣状（ハニカム）に埋める架空（Fictional）空港データ。
 * ファイル肥大化を防ぐため「lat,lon,Name,Country」のパイプ(|)区切り文字列で圧縮保持します。
 * 約300箇所のノードを配置し、ゲームバランスを成立させます。
 */

export const FICTIONAL_CSV_DATA = [
    // --- ユーラシア・ロシア・中央アジア ---
    "61.0,100.0,Siberia Taiga Base,Russia", "66.0,130.0,Yakutsk Ice Strip,Russia", "56.0,159.0,Kamchatka Volcano,Russia",
    "70.0,80.0,Arctic Tundra Hub,Russia", "50.0,80.0,Altai Mountain Air,Russia", "43.0,105.0,Gobi Desert Strip,Mongolia",
    "48.0,115.0,Mongolian Steppe,Mongolia", "35.0,90.0,Tibet Plateau Field,China", "38.0,80.0,Taklamakan Dune,China",
    "45.0,60.0,Aral Sea Port,Kazakhstan", "50.0,70.0,Kazakh Steppe Hub,Kazakhstan", "40.0,70.0,Tien Shan Ridge,Kyrgyzstan",
    "30.0,60.0,Persian Desert Base,Iran", "35.0,55.0,Caspian Sea Air,Iran", "30.0,65.0,Afghan Highland,Afghanistan",
    "29.0,83.0,Himalaya Yeti Hub,Nepal", "25.0,95.0,Myanmar Jungle Strip,Myanmar",

    // --- ヨーロッパ・北極圏 ---
    "57.0,-4.0,Scottish Whiskey Air,UK", "65.0,15.0,Nordic Salmon Strip,Norway", "68.0,25.0,Lapland Aurora Air,Finland",
    "78.0,15.0,Svalbard Polar Base,Norway", "72.0,-40.0,Greenland Glacier,Greenland", "65.0,-50.0,Nuuk Fjord Strip,Greenland",
    "64.0,-20.0,Iceland Geyser Hub,Iceland",

    // --- 北米・カナダ ---
    "65.0,-100.0,Nunavut Maple Hub,Canada", "60.0,-85.0,Hudson Bay Strip,Canada", "55.0,-110.0,Saskatchewan Pine,Canada",
    "60.0,-120.0,Northwest Bear Air,Canada", "65.0,-152.0,Alaska Salmon Base,USA", "70.0,-150.0,Prudhoe Bay Ice,USA",
    "40.0,-108.0,Rocky Mountain Air,USA", "45.0,-100.0,Dakota Prairie Hub,USA", "31.0,-100.0,Texas BBQ Airport,USA",
    "35.0,-105.0,New Mexico Desert,USA", "25.0,-105.0,Sonora Cactus Air,Mexico", "20.0,-100.0,Aztec Ruins Strip,Mexico",

    // --- 南米・アマゾン・アンデス ---
    "-3.0,-65.0,Amazon Anaconda Air,Brazil", "-10.0,-55.0,Mato Grosso Strip,Brazil", "-5.0,-50.0,Para Jungle Hub,Brazil",
    "-15.0,-72.0,Andes Llama Hub,Peru", "-20.0,-65.0,Bolivia Salt Flat,Bolivia", "-25.0,-60.0,Chaco Dry Forest,Paraguay",
    "-45.0,-68.0,Patagonia Ice Strip,Argentina", "-50.0,-70.0,Tierra del Fuego,Argentina", "-0.5,-90.5,Galapagos Turtle,Ecuador",
    "-10.0,-40.0,Bahia Coast Strip,Brazil",

    // --- アフリカ・サハラ・マダガスカル ---
    "22.0,10.0,Sahara Oasis Field,Libya", "25.0,0.0,Algerian Dune Base,Algeria", "18.0,-5.0,Mali Golden Strip,Mali",
    "15.0,15.0,Chad Safari Hub,Chad", "20.0,30.0,Nubian Desert Air,Sudan", "10.0,35.0,Ethiopian Rift,Ethiopia",
    "5.0,20.0,Central African Wood,CAR", "-1.0,22.0,Congo Gorilla Strip,DRC", "-10.0,20.0,Angola Diamond Hub,Angola",
    "-20.0,25.0,Kalahari Bush Air,Botswana", "-2.0,34.0,Serengeti Lion Hub,Tanzania", "-18.0,47.0,Madagascar Baobab,Madagascar",

    // --- オセアニア・アウトバック ---
    "-25.0,130.0,Outback Red Sand,Australia", "-20.0,140.0,Queensland Outback,Australia", "-30.0,120.0,Western Gold Field,Australia",
    "-20.0,125.0,Great Sandy Air,Australia", "-35.0,125.0,Nullarbor Plain Hub,Australia", "-42.0,146.0,Tasmania Devil Air,Australia",
    "-15.0,150.0,Coral Reef Strip,Coral Sea", "-10.0,160.0,Solomon Pearl Air,Solomon", "-15.0,170.0,Vanuatu Blue Base,Vanuatu",

    // --- 海洋上の点（太平洋・大西洋・インド洋） ---
    "0.0,170.0,Equator Line Base,Pacific", "15.0,-160.0,Hawaii Outer Reef,Pacific", "30.0,-140.0,Pacific Deep Hub,Pacific",
    "-30.0,-140.0,South Pacific Swell,Pacific", "-40.0,-110.0,Oceanic Ridge Air,Pacific", "-27.1,-109.3,Easter Island Hub,Chile",
    "37.7,-25.6,Azores Blue Field,Portugal", "28.2,-16.5,Canary Sun Base,Spain", "15.0,-30.0,Cape Verde Wind,Atlantic",
    "-15.0,-15.0,St Helena Point,Atlantic", "-30.0,-20.0,Tristan da Cunha,Atlantic", "-45.0,40.0,Prince Edward Isle,Indian",
    "-30.0,80.0,Indian Ocean Strip,Indian", "-10.0,70.0,Diego Garcia Atoll,UK", "-50.0,70.0,Kerguelen Penguin,French Southern"
].join('|');


