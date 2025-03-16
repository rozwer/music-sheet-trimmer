// 画像操作のユーティリティ関数

/**
 * Base64エンコードされた画像データを取得
 */
export const getBase64FromCanvas = (canvas, format = 'image/jpeg', quality = 0.9) => {
    if (!canvas) return null;
    return canvas.toDataURL(format, quality);
  };
  
  /**
   * 画像を回転させる
   */
  export const rotateImage = (src, degrees) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 回転に応じてキャンバスのサイズを調整
        if (degrees === 90 || degrees === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        
        // キャンバスの中心を原点として回転
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        resolve(canvas.toDataURL());
      };
      img.onerror = reject;
      img.src = src;
    });
  };
  
  /**
   * 画像をロードしてサイズを取得
   */
  export const getImageDimensions = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height
        });
      };
      img.onerror = reject;
      img.src = src;
    });
  };