import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Box, Typography, Button, Slider, Paper, FormControlLabel, Switch } from '@mui/material';
import Cropper from 'react-cropper';
import './cropper.css';

const FirstImageTrimmer = ({ image, imageIndex }) => {
  const { setTrimSettings, images, setImages } = useAppContext();
  const cropperRef = useRef(null);
  const [cropData, setCropData] = useState(null);
  const [imageWidth, setImageWidth] = useState(null);
  const [allowHorizontalTrim, setAllowHorizontalTrim] = useState(false);
  const [imageInfo, setImageInfo] = useState({width: 0, height: 0});

  // 画像読み込み後に画像のサイズを取得
  useEffect(() => {
    if (image && image.preview) {
      const img = new Image();
      img.onload = () => {
        setImageWidth(img.width);
        setImageInfo({width: img.width, height: img.height});
      };
      img.src = image.preview;
    }
  }, [image]);

  // トリミング確定ボタンの処理
  const handleCropConfirm = () => {
    if (cropperRef.current && cropperRef.current.cropper) {
      const cropper = cropperRef.current.cropper;
      const data = cropper.getData();
      
      // トリミング設定を保存（縦方向のみ他の画像に適用される）
      setTrimSettings({
        height: data.height,
        yPosition: data.y,
        width: imageWidth, // 元の画像の横幅を使用
        x: 0, // 横方向の開始位置は常に0（他の画像用）
        applied: true,
        aspectRatio: null, // アスペクト比は固定しない
        horizontalTrimmed: allowHorizontalTrim, // 横方向のトリミングを適用するかどうか
        horizontalData: allowHorizontalTrim ? { x: data.x, width: data.width } : null // 横方向のトリミング情報
      });

      // トリミングプレビュー用のキャンバス作成
      let processedPreview;
      
      if (allowHorizontalTrim) {
        // 横方向のトリミングを適用（画像サイズは維持したまま、トリミング範囲外を白で塗りつぶす）
        const canvas = document.createElement('canvas');
        canvas.width = imageWidth; // 元の画像と同じ幅を維持
        canvas.height = imageInfo.height; // 元の画像と同じ高さを維持
        
        const ctx = canvas.getContext('2d');
        // 全体を白で塗りつぶし
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 選択部分のみを描画
        const img = new Image();
        img.onload = () => {
          // トリミング対象部分のみを描画
          ctx.drawImage(
            img,
            data.x, data.y,  // ソース画像上の開始位置
            data.width, data.height,  // ソース画像上の切り取りサイズ
            data.x, data.y,  // キャンバス上の描画位置（元の位置と同じ）
            data.width, data.height  // キャンバス上の描画サイズ
          );
          
          // データURLを生成
          processedPreview = canvas.toDataURL();
          setCropData(processedPreview);
          
          // 元の画像を白塗りトリミング処理した画像に置き換え
          if (image && imageIndex === 0) {
            const updatedImages = [...images];
            updatedImages[0] = {
              ...image,
              preview: processedPreview,
              whiteMaskedPreview: true // この画像が白塗り処理済みであることを示すフラグ
            };
            setImages(updatedImages);
          }
        };
        img.src = image.preview;
      } else {
        // 縦方向のみのトリミングを適用（横は元の幅のまま）
        const fullWidthCanvas = document.createElement('canvas');
        fullWidthCanvas.width = imageWidth;
        fullWidthCanvas.height = data.height;
        
        const ctx = fullWidthCanvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, fullWidthCanvas.width, fullWidthCanvas.height);
        
        // 元の画像を描画
        const tmpImg = new Image();
        tmpImg.onload = () => {
          ctx.drawImage(
            tmpImg,
            0, data.y, // 元画像の開始位置
            imageWidth, data.height, // 元画像の切り取りサイズ
            0, 0, // キャンバスの描画開始位置
            imageWidth, data.height // キャンバスの描画サイズ
          );
          processedPreview = fullWidthCanvas.toDataURL();
          setCropData(processedPreview);
        };
        tmpImg.src = image.preview;
      }
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          トリミング範囲の指定
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          楽譜部分の範囲を選択してください。
          {!allowHorizontalTrim && ' 他の画像には縦方向のトリミングのみが適用されます。'}
        </Typography>
        
        <FormControlLabel 
          control={
            <Switch 
              checked={allowHorizontalTrim} 
              onChange={(e) => setAllowHorizontalTrim(e.target.checked)}
              color="primary"
            />
          }
          label="横方向のトリミングを有効にする（この画像のみに適用）"
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ width: '100%', height: 'auto', mb: 2 }}>
          <Cropper
            ref={cropperRef}
            src={image.preview}
            style={{ height: 400, width: '100%' }}
            guides={true}
            viewMode={1}
            minCropBoxHeight={10}
            minCropBoxWidth={10}
            background={false}
            responsive={true}
            checkOrientation={false}
            cropBoxMovable={true}
            cropBoxResizable={true}
            dragMode="crop"
            zoomable={false}
            ready={(e) => {
              const cropper = e.target.cropper;
              if (imageWidth && !allowHorizontalTrim) {
                // 横方向のトリミングが無効の場合、画像の横幅いっぱいに選択範囲を広げる
                cropper.setCropBoxData({ width: imageWidth, left: 0 });
                
                // 横方向のリサイズハンドルを非表示にする
                const cropBox = document.querySelector('.cropper-crop-box');
                if (cropBox) {
                  const handles = cropBox.querySelectorAll('.cropper-line, .cropper-point');
                  handles.forEach(handle => {
                    if (handle.className.includes('e') || handle.className.includes('w')) {
                      handle.style.display = 'none';
                    }
                  });
                }
              }
            }}
          />
        </Box>

        <Button 
          variant="contained" 
          color="primary"
          onClick={handleCropConfirm}
          sx={{ mt: 2 }}
        >
          トリミング設定を確定
        </Button>
      </Paper>

      {cropData && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            トリミングプレビュー
            {allowHorizontalTrim && (
              <Typography variant="caption" component="span" sx={{ ml: 2, color: 'text.secondary' }}>
                （横方向のトリミングはこの画像のみに適用されます）
              </Typography>
            )}
          </Typography>
          <Box 
            sx={{ 
              mt: 2, 
              textAlign: 'center',
              img: {
                maxWidth: '100%',
                maxHeight: '300px',
                border: '1px solid #eee'
              }
            }}
          >
            <img src={cropData} alt="トリミングプレビュー" />
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default FirstImageTrimmer;