import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Box, Typography, Button, Slider, Paper } from '@mui/material';
import Cropper from 'react-cropper';
import './cropper.css';

const FirstImageTrimmer = ({ image, imageIndex }) => {
  const { setTrimSettings } = useAppContext();
  const cropperRef = useRef(null);
  const [cropData, setCropData] = useState(null);

  // トリミング確定ボタンの処理
  const handleCropConfirm = () => {
    if (cropperRef.current && cropperRef.current.cropper) {
      const cropper = cropperRef.current.cropper;
      const data = cropper.getData();
      
      // トリミング設定を保存（縦幅と縦方向の座標）
      setTrimSettings({
        height: data.height,
        yPosition: data.y,
        width: data.width,
        x: data.x,
        applied: true,
        aspectRatio: data.width / data.height
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
          楽譜部分を四角形で選択してください。このトリミング設定が他の画像にも適用されます。
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