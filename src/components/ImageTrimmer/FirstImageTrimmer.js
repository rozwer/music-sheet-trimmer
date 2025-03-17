import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Box, Typography, Button, Slider, Paper } from '@mui/material';
import Cropper from 'react-cropper';
import './cropper.css';

const FirstImageTrimmer = ({ image, imageIndex }) => {
  const { setTrimSettings } = useAppContext();
  const cropperRef = useRef(null);
  const [cropData, setCropData] = useState(null);
  const [imageWidth, setImageWidth] = useState(null);

  // 画像読み込み後に画像の横幅を取得
  useEffect(() => {
    if (image && image.preview) {
      const img = new Image();
      img.onload = () => {
        setImageWidth(img.width);
      };
      img.src = image.preview;
    }
  }, [image]);

  // トリミング確定ボタンの処理
  const handleCropConfirm = () => {
    if (cropperRef.current && cropperRef.current.cropper) {
      const cropper = cropperRef.current.cropper;
      const data = cropper.getData();
      
      // トリミング設定を保存（縦幅と縦方向の座標のみ）
      setTrimSettings({
        height: data.height,
        yPosition: data.y,
        width: imageWidth, // 元の画像の横幅を使用
        x: 0, // 横方向の開始位置は常に0
        applied: true,
        aspectRatio: null // アスペクト比は固定しない
      });

      // トリミングプレビューの更新
      setCropData(cropper.getCroppedCanvas().toDataURL());
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          トリミング範囲の指定
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          楽譜部分の縦の範囲のみを選択してください。横幅は自動的に画像全体が使用されます。
        </Typography>
        
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
            // 横方向のトリミングを禁止する設定
            cropBoxData={{ width: imageWidth }}
            ready={(e) => {
              const cropper = e.target.cropper;
              if (imageWidth) {
                // 画像の横幅いっぱいに選択範囲を広げる
                cropper.setCropBoxData({ width: imageWidth, left: 0 });
                // 横方向のリサイズを禁止
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
          </Typography>
          <Box 
            sx={{ 
              mt: 2, 
              textAlign: 'center',
              img: {
                maxWidth: '100%',
                maxHeight: '300px',
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