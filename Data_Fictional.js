/**
 * AI可読性・先祖返り防止コメント:
 * 【ファイル肥大化防止の圧縮データ形式】
 * 航路網のバランスをとるため、実在空港がカバーできない空白地帯（砂漠、アマゾン、太平洋等）に
 * 大量の架空空港（Fictional）を配置します。JSONの記述による肥大化を防ぐため、
 * 「lat,lon,Name,Country」のカンマ区切り文字列をパイプ(|)で繋いだ圧縮形式で保持します。
 */

// 緯度,経度,空港名,国名
export const FICTIONAL_CSV_DATA = [
    // ユーラシア・シベリア・ヒマラヤ
    "61.0,100.0,Siberia Taiga Base,Russia",
    "66.0,130.0,Yakutsk Ice Strip,Russia",
    "56.0,159.0,Kamchatka Volcano Air,Russia",
    "43.0,105.0,Gobi Desert Hub,Mongolia",
    "29.0,83.0,Himalaya Yeti Hub,Nepal",
    "35.0,90.0,Tibet Plateau Field,China",
    "45.0,60.0,Aral Sea Port,Kazakhstan",

    // アフリカ・中東（サハラ、コンゴ、アラビア）
    "22.0,10.0,Sahara Oasis Field,Libya",
    "18.0,-5.0,Mali Golden Strip,Mali",
    "12.0,20.0,Chad Safari Base,Chad",
    "-1.0,22.0,Congo Jungle Strip,DRC",
    "-15.0,20.0,Angola Diamond Hub,Angola",
    "21.0,50.0,Arabian Camel Air,Saudi Arabia",
    "-18.0,47.0,Madagascar Baobab,Madagascar",

    // 南北アメリカ（カナダ北部、アマゾン、アンデス、パタゴニア）
    "65.0,-100.0,Nunavut Maple Hub,Canada",
    "60.0,-85.0,Hudson Bay Strip,Canada",
    "55.0,-110.0,Saskatchewan Pine Field,Canada",
    "40.0,-108.0,Rocky Mountain Air,USA",
    "31.0,-100.0,Texas BBQ Airport,USA",
    "25.0,-105.0,Sonora Cactus Air,Mexico",
    "-3.0,-65.0,Amazon Anaconda Air,Brazil",
    "-10.0,-55.0,Mato Grosso Strip,Brazil",
    "-15.0,-72.0,Andes Llama Hub,Peru",
    "-45.0,-68.0,Patagonia Ice Strip,Argentina",
    "-0.5,-90.5,Galapagos Turtle Air,Ecuador",
    "72.0,-40.0,Greenland Glacier,Greenland",

    // オセアニア・太平洋・大西洋
    "-25.0,130.0,Outback Red Sand,Australia",
    "-20.0,140.0,Queensland Outback Hub,Australia",
    "-30.0,120.0,Western Gold Field,Australia",
    "-42.0,146.0,Tasmania Devil Air,Australia",
    "-15.0,150.0,Coral Reef Strip,Coral Sea",
    "-10.0,160.0,Solomon Pearl Air,Solomon Islands",
    "0.0,170.0,Equator Line Base,Pacific Ocean",
    "37.7,-25.6,Azores Blue Field,Portugal",
    "28.2,-16.5,Canary Sun Base,Spain",
    "-27.1,-109.3,Easter Island Hub,Chile",

    // ヨーロッパ北辺
    "57.0,-4.0,Scottish Whiskey Air,UK",
    "65.0,15.0,Nordic Salmon Strip,Norway",
    "68.0,25.0,Lapland Aurora Air,Finland",
    
    // インド洋・南極周辺
    "-30.0,80.0,Indian Ocean Strip,Oceania",
    "-50.0,70.0,Kerguelen Penguin Air,French Southern",
    "-60.0,-60.0,Drake Passage Base,Antarctica"
].join('|');

