import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Box, Typography, Button, Paper, IconButton, Grid } from '@mui/material';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';

const SubsequentImageTrimmer = ({ image, imageIndex, trimSettings }) => {
  const { images, setImages } = useAppContext();
  const canvasRef = useRef(null);
  const imageContainerRef = useRef(null);
  const highlightRef = useRef(null);
  
  const [rotation, setRotation] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [leftTrim, setLeftTrim] = useState(0);
  const [rightTrim, setRightTrim] = useState(0);
  const [imageObj, setImageObj] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  
  // 画像のロードと初期設定
  useEffect(() => {
    if (image && trimSettings.applied) {
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setImageObj(img);
        renderCanvas(img, rotation, yOffset, leftTrim, rightTrim);
        
        // ハイライト表示を初期化
        if (highlightRef.current && imageContainerRef.current) {
          const containerHeight = imageContainerRef.current.offsetHeight;
          const highlightHeight = (trimSettings.height / img.height) * containerHeight;
          highlightRef.current.style.height = `${highlightHeight}px`;
          highlightRef.current.style.top = `${(trimSettings.yPosition / img.height) * containerHeight + yOffset}px`;
        }
      };
      img.src = image.preview;
    }
  }, [image, trimSettings]);

  // キャンバスでの描画処理
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
    
    // 1枚目で設定された範囲でトリミング（左右のトリミングとYオフセットを考慮）
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

  // ドラッグ開始処理
  const handleDragStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartY(e.clientY);
  };

  // ドラッグ中の処理
  const handleDrag = (e) => {
    if (!isDragging || !imageContainerRef.current || !highlightRef.current) return;
    
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const highlightRect = highlightRef.current.getBoundingClientRect();
    const containerHeight = containerRect.height;
    
    // 移動距離の計算（スクリーン座標）
    const deltaY = e.clientY - dragStartY;
    setDragStartY(e.clientY);
    
    // 現在の位置を取得（トップ位置をピクセルから比率に変換）
    const currentTopPixel = parseFloat(highlightRef.current.style.top || '0px');
    const currentTop = currentTopPixel;
    
    // 新しい位置を計算（境界チェック付き）
    let newTopPixel = currentTop + deltaY;
    
    // 画像の境界をチェック
    const maxTop = containerHeight - highlightRect.height;
    newTopPixel = Math.max(0, Math.min(newTopPixel, maxTop));
    
    // ハイライトの位置を更新
    highlightRef.current.style.top = `${newTopPixel}px`;
    
    // 画像の実サイズに基づいてyOffsetを計算
    const newYOffset = (newTopPixel / containerHeight) * originalDimensions.height - trimSettings.yPosition;
    setYOffset(newYOffset);
    
    // キャンバスの更新
    if (imageObj) {
      renderCanvas(imageObj, rotation, newYOffset, leftTrim, rightTrim);
    }
  };

  // ドラッグ終了処理
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // マウスイベントの追加
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  // 左右トリミングの処理（そのまま残す）
  const handleLeftTrimChange = (value) => {
    setLeftTrim(value);
    if (imageObj) {
      renderCanvas(imageObj, rotation, yOffset, value, rightTrim);
    }
  };

  const handleRightTrimChange = (value) => {
    setRightTrim(value);
    if (imageObj) {
      renderCanvas(imageObj, rotation, yOffset, leftTrim, value);
    }
  };

  // 設定を確定して画像データを更新
  const handleApplySettings = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    
    const updatedImages = [...images];
    updatedImages[imageIndex] = {
      ...updatedImages[imageIndex],
      trimmedPreview: dataUrl,
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
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" gutterBottom>
              元の画像（ハイライト部分をドラッグして位置調整）:
            </Typography>
            <Box 
              ref={imageContainerRef}
              sx={{ 
                position: 'relative', 
                height: '400px',
                border: '1px solid #ddd',
                overflow: 'hidden',
                mb: 2,
                '& img': {
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto'
                }
              }}
            >
              <img src={image.preview} alt="トリミング元画像" />
              <Box 
                ref={highlightRef}
                sx={{ 
                  position: 'absolute',
                  left: 0,
                  width: '100%',
                  background: 'rgba(0, 123, 255, 0.3)',
                  border: '2px dashed #0077ff',
                  cursor: 'move',
                  zIndex: 10,
                  boxSizing: 'border-box'
                }}
                onMouseDown={handleDragStart}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="body2" gutterBottom>
              プレビュー:
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
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <Typography id="rotation-label" sx={{ mr: 2 }}>回転:</Typography>
          <IconButton onClick={() => handleRotate(-90)} color="primary" size="small">
            <RotateLeftIcon />
          </IconButton>
          <Typography sx={{ mx: 1 }}>{rotation}°</Typography>
          <IconButton onClick={() => handleRotate(90)} color="primary" size="small">
            <RotateRightIcon />
          </IconButton>
        </Box>

        <Button 
          variant="contained" 
          color="primary"
          onClick={handleApplySettings}
          sx={{ mt: 2 }}
          fullWidth
        >
          設定を適用
        </Button>
      </Paper>
    </Box>
  );
};

export default SubsequentImageTrimmer;