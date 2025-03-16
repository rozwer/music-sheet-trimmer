import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Box, Typography, Button, Slider, Paper, IconButton, Grid } from '@mui/material';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { rotateImage } from '../../utils/imageUtils';

const SubsequentImageTrimmer = ({ image, imageIndex, trimSettings }) => {
  const { images, setImages } = useAppContext();
  const canvasRef = useRef(null);
  
  const [rotation, setRotation] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [leftTrim, setLeftTrim] = useState(0);
  const [rightTrim, setRightTrim] = useState(0);
  const [imageObj, setImageObj] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });

  // 画像のロードと初期設定
  useEffect(() => {
    if (image && trimSettings.applied) {
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setImageObj(img);
        renderCanvas(img, rotation, yOffset, leftTrim, rightTrim);
      };
      img.src = image.preview;
    }
  }, [image, trimSettings]);

  // renderCanvas関数内を修正
const renderCanvas = (img, rotation, yOffset, leftTrim, rightTrim) => {
    if (!canvasRef.current || !img) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // トリミング後のサイズをキャンバスサイズとして使用
    const effectiveWidth = trimSettings.width - leftTrim - rightTrim;
    const effectiveHeight = trimSettings.height;
    
    // キャンバスサイズの設定（トリミング後のサイズに合わせる）
    if (rotation === 90 || rotation === 270) {
      canvas.width = effectiveHeight;
      canvas.height = effectiveWidth;
    } else {
      canvas.width = effectiveWidth;
      canvas.height = effectiveHeight;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 回転とトリミングの適用
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // 1枚目で設定された範囲でトリミング（左右のトリミングを考慮）
    ctx.drawImage(
      img,
      trimSettings.x + leftTrim,
      trimSettings.yPosition + yOffset,
      effectiveWidth,
      effectiveHeight,
      -effectiveWidth / 2,
      -effectiveHeight / 2,
      effectiveWidth,
      effectiveHeight
    );
    
    ctx.restore();
  };

  // 画像の回転処理
  const handleRotate = async (degrees) => {
    const newRotation = (rotation + degrees) % 360;
    setRotation(newRotation);
    
    // 画像設定の更新
    const updatedImages = [...images];
    updatedImages[imageIndex] = {
      ...updatedImages[imageIndex],
      settings: {
        ...updatedImages[imageIndex].settings,
        rotation: newRotation
      }
    };
    setImages(updatedImages);
    
    if (imageObj) {
      renderCanvas(imageObj, newRotation, yOffset, leftTrim, rightTrim);
    }
  };

  // Y軸オフセット（縦位置）の調整
  const handleYOffsetChange = (event, newValue) => {
    setYOffset(newValue);
    if (imageObj) {
      renderCanvas(imageObj, rotation, newValue, leftTrim, rightTrim);
    }
  };

  // 左端トリミングの調整
  const handleLeftTrimChange = (event, newValue) => {
    setLeftTrim(newValue);
    if (imageObj) {
      renderCanvas(imageObj, rotation, yOffset, newValue, rightTrim);
    }
  };

  // 右端トリミングの調整
  const handleRightTrimChange = (event, newValue) => {
    setRightTrim(newValue);
    if (imageObj) {
      renderCanvas(imageObj, rotation, yOffset, leftTrim, newValue);
    }
  };

  const handleApplySettings = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    
    const updatedImages = [...images];
    updatedImages[imageIndex] = {
      ...updatedImages[imageIndex],
      trimmedPreview: dataUrl,  // ここでトリミングした画像を保存
      settings: {
        rotation,
        yOffset,
        leftTrim,
        rightTrim
      }
    };
    setImages(updatedImages);
  };

  // トリミング設定が未適用の場合
  if (!trimSettings.applied) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="body1">
          先に1枚目の画像でトリミング設定を行ってください。
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          トリミング調整
        </Typography>
        
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <canvas 
            ref={canvasRef} 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '400px',
              border: '1px solid #ddd'
            }}
          />
        </Box>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <Typography id="rotation-label" sx={{ mr: 2 }}>回転:</Typography>
              <IconButton onClick={() => handleRotate(-90)} color="primary" size="small">
                <RotateLeftIcon />
              </IconButton>
              <Typography sx={{ mx: 1 }}>{rotation}°</Typography>
              <IconButton onClick={() => handleRotate(90)} color="primary" size="small">
                <RotateRightIcon />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography id="y-offset-slider" gutterBottom>
              縦位置調整
            </Typography>
            <Slider
              aria-labelledby="y-offset-slider"
              value={yOffset}
              onChange={handleYOffsetChange}
              min={-100}
              max={100}
              step={1}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography id="left-trim-slider" gutterBottom>
              左端トリミング
            </Typography>
            <Slider
              aria-labelledby="left-trim-slider"
              value={leftTrim}
              onChange={handleLeftTrimChange}
              min={0}
              max={originalDimensions.width / 2}
              step={1}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography id="right-trim-slider" gutterBottom>
              右端トリミング
            </Typography>
            <Slider
              aria-labelledby="right-trim-slider"
              value={rightTrim}
              onChange={handleRightTrimChange}
              min={0}
              max={originalDimensions.width / 2}
              step={1}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>

        <Button 
          variant="contained" 
          color="primary"
          onClick={handleApplySettings}
          sx={{ mt: 2 }}
        >
          設定を適用
        </Button>
      </Paper>
    </Box>
  );
};

export default SubsequentImageTrimmer;