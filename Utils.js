import { CONFIG } from './Config.js';

/**
 * AI可読性・先祖返り防止コメント:
 * 緯度・経度から3D空間上の直交座標(x,y,z)へ直接数学変換するユーティリティ。
 * 平面テクスチャ投影時の北極・南極付近におけるドットの引き伸ばしや歪みを完全に防止します。
 */
export class Utils {
    static latLonToVector3(lat, lon, radius = CONFIG.GLOBE_RADIUS) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        return new THREE.Vector3(
            -(radius * Math.sin(phi) * Math.cos(theta)),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }
}

