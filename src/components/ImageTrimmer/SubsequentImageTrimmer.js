import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Box, Typography, Button, Slider, Paper, IconButton, Grid } from '@mui/material';
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
        
        // 既存の設定があれば使用
        const existingSettings = image.settings || {};
        if (existingSettings.leftTrim !== undefined) {
          setLeftTrim(existingSettings.leftTrim);
          setRightTrim(existingSettings.rightTrim);
          setYOffset(existingSettings.yOffset || 0);
          setRotation(existingSettings.rotation || 0);
        }
        
        renderCanvas(img, existingSettings.rotation || 0, existingSettings.yOffset || 0, 
          existingSettings.leftTrim || 0, existingSettings.rightTrim || 0);
        
        // ハイライト表示を初期化
        updateHighlightPosition(
          existingSettings.yOffset || 0, 
          existingSettings.leftTrim || 0, 
          existingSettings.rightTrim || 0
        );
      };
      img.src = image.preview;
    }
  }, [image, trimSettings]);

  // 自動保存機能の実装
  const autoSaveSettings = (newRotation, newYOffset, newLeftTrim, newRightTrim) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    
    const updatedImages = [...images];
    updatedImages[imageIndex] = {
      ...updatedImages[imageIndex],
      trimmedPreview: dataUrl,
      settings: {
        rotation: newRotation,
        yOffset: newYOffset,
        leftTrim: newLeftTrim,
        rightTrim: newRightTrim
      }
    };
    setImages(updatedImages);
  };
  
  // コンポーネントのアンマウント時や変更時に設定を保存
  useEffect(() => {
    return () => {
      // コンポーネントのアンマウント時に最終設定を保存
      if (canvasRef.current && imageObj) {
        autoSaveSettings(rotation, yOffset, leftTrim, rightTrim);
      }
    };
  }, [imageIndex]);

  // ハイライト位置の更新
  const updateHighlightPosition = (offset, left = leftTrim, right = rightTrim) => {
    if (highlightRef.current && imageContainerRef.current && imageObj) {
      const containerHeight = imageContainerRef.current.offsetHeight;
      const containerWidth = imageContainerRef.current.offsetWidth;
      
      // 表示スケールの計算
      const scaleHeight = containerHeight / imageObj.height;
      const scaleWidth = containerWidth / imageObj.width;
      
      // 有効な幅を計算（左右トリムを考慮）
      const effectiveWidth = imageObj.width - left - right;
      
      // ハイライトサイズを設定
      const highlightWidth = effectiveWidth * scaleWidth;
      const highlightHeight = trimSettings.height * scaleHeight;
      
      highlightRef.current.style.width = `${highlightWidth}px`;
      highlightRef.current.style.height = `${highlightHeight}px`;
      
      // 位置の計算（トリミング設定の位置 + オフセット）
      const topPosition = (trimSettings.yPosition + offset) * scaleHeight;
      const leftPosition = left * scaleWidth;
      
      highlightRef.current.style.top = `${topPosition}px`;
      highlightRef.current.style.left = `${leftPosition}px`; // 左トリム位置から開始
    }
  };

  // キャンバスでの描画処理
  const renderCanvas = (img, rotation, yOffset, leftTrim, rightTrim) => {
    if (!canvasRef.current || !img) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 縦幅のみ一枚目から引き継ぎ、横幅は画像幅から左右のトリムを引いた値を使用
    const effectiveWidth = img.width - leftTrim - rightTrim; // 一枚目のwidthは使わない
    const effectiveHeight = trimSettings.height; // 縦幅は統一
    
    // キャンバスサイズの設定
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
    
    // トリミング位置の計算：横方向は左端からの相対位置、縦方向は一枚目の設定+オフセット
    ctx.drawImage(
      img,
      leftTrim, // 一枚目のx座標は使わず、左トリム値からスタート
      trimSettings.yPosition + yOffset, // 縦座標は一枚目の設定を引き継ぎ
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
  const handleRotate = (degrees) => {
    const newRotation = (rotation + degrees) % 360;
    setRotation(newRotation);
    
    if (imageObj) {
      renderCanvas(imageObj, newRotation, yOffset, leftTrim, rightTrim);
      // 設定変更時に自動適用
      autoSaveSettings(newRotation, yOffset, leftTrim, rightTrim);
    }
  };

  // Y軸オフセット（縦位置）の調整 - スライダー用
  const handleYOffsetChange = (event, newValue) => {
    setYOffset(newValue);
    updateHighlightPosition(newValue, leftTrim, rightTrim);
    
    if (imageObj) {
      renderCanvas(imageObj, rotation, newValue, leftTrim, rightTrim);
      // 設定変更時に自動適用
      autoSaveSettings(rotation, newValue, leftTrim, rightTrim);
    }
  };

  // 左右トリミングの調整
  const handleLeftTrimChange = (event, newValue) => {
    const maxAllowedLeftTrim = Math.max(0, originalDimensions.width - rightTrim - 10);
    const validatedValue = Math.min(newValue, maxAllowedLeftTrim);
    
    setLeftTrim(validatedValue);
    
    // ハイライトの更新を追加
    updateHighlightPosition(yOffset, validatedValue, rightTrim);
    
    if (imageObj) {
      renderCanvas(imageObj, rotation, yOffset, validatedValue, rightTrim);
      // 設定変更時に自動適用
      autoSaveSettings(rotation, yOffset, validatedValue, rightTrim);
    }
  };

  const handleRightTrimChange = (event, newValue) => {
    const maxAllowedRightTrim = Math.max(0, originalDimensions.width - leftTrim - 10);
    const validatedValue = Math.min(newValue, maxAllowedRightTrim);
    
    setRightTrim(validatedValue);
    
    // ハイライトの更新を追加
    updateHighlightPosition(yOffset, leftTrim, validatedValue);
    
    if (imageObj) {
      renderCanvas(imageObj, rotation, yOffset, leftTrim, validatedValue);
      // 設定変更時に自動適用
      autoSaveSettings(rotation, yOffset, leftTrim, validatedValue);
    }
  };

  // マウスドラッグ開始
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartY(e.clientY);
  };

  // タッチドラッグ開始
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStartY(e.touches[0].clientY);
    }
  };

  // マウスドラッグ中
  const handleMouseMove = (e) => {
    if (!isDragging || !imageContainerRef.current || !highlightRef.current || !imageObj) return;
    processDragMove(e.clientY);
  };

  // タッチドラッグ中
  const handleTouchMove = (e) => {
    if (!isDragging || !imageContainerRef.current || !highlightRef.current || !imageObj || !e.touches[0]) return;
    processDragMove(e.touches[0].clientY);
  };

  // ドラッグ移動の共通処理
  const processDragMove = (clientY) => {
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const highlightRect = highlightRef.current.getBoundingClientRect();
    
    // 移動距離の計算
    const deltaY = clientY - dragStartY;
    setDragStartY(clientY);
    
    // 現在の位置を取得
    const currentTopPixel = parseFloat(highlightRef.current.style.top || '0px');
    
    // 新しい位置を計算（境界チェック付き）
    let newTopPixel = currentTopPixel + deltaY;
    const maxTop = containerRect.height - highlightRect.height;
    newTopPixel = Math.max(0, Math.min(newTopPixel, maxTop));
    
    // ハイライトの位置を更新
    highlightRef.current.style.top = `${newTopPixel}px`;
    
    // 元の画像サイズに基づいてYオフセットを計算
    const scale = containerRect.height / imageObj.height;
    const newYOffset = (newTopPixel / scale) - trimSettings.yPosition;
    
    // 状態とキャンバスを更新
    setYOffset(newYOffset);
    renderCanvas(imageObj, rotation, newYOffset, leftTrim, rightTrim);
    // ドラッグ操作時も自動適用
    autoSaveSettings(rotation, newYOffset, leftTrim, rightTrim);
  };

  // ドラッグ終了
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // イベントリスナーの設定
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
      window.addEventListener('touchcancel', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchcancel', handleDragEnd);
    };
  }, [isDragging]);

  // タッチイベントでのスクロール防止
  useEffect(() => {
    const preventDefaultTouch = (e) => {
      if (isDragging) {
        e.preventDefault();
      }
    };

    // タッチイベントでのスクロール防止設定
    document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', preventDefaultTouch);
    };
  }, [isDragging]);

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

  // 最大オフセット値の計算
  const maxYOffset = imageObj ? imageObj.height - trimSettings.height - trimSettings.yPosition : 100;
  const minYOffset = -trimSettings.yPosition;

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          トリミング調整（変更は自動保存されます）
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
                height: '350px',
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
                  background: 'rgba(0, 123, 255, 0.3)',
                  border: '2px dashed #0077ff',
                  cursor: 'move',
                  zIndex: 10,
                  boxSizing: 'border-box',
                  touchAction: 'none' // タッチ操作時の挙動制御
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
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
                  maxHeight: '350px',
                  border: '1px solid #ddd'
                }}
              />
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography id="y-offset-slider" gutterBottom>
            縦位置調整（スライダー）
          </Typography>
          <Slider
            aria-labelledby="y-offset-slider"
            value={yOffset}
            onChange={handleYOffsetChange}
            min={minYOffset}
            max={maxYOffset}
            step={1}
            valueLabelDisplay="auto"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, mt: 3 }}>
          <Typography id="rotation-label" sx={{ mr: 2 }}>回転:</Typography>
          <IconButton onClick={() => handleRotate(-90)} color="primary" size="small">
            <RotateLeftIcon />
          </IconButton>
          <Typography sx={{ mx: 1 }}>{rotation}°</Typography>
          <IconButton onClick={() => handleRotate(90)} color="primary" size="small">
            <RotateRightIcon />
          </IconButton>
        </Box>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Typography id="left-trim-slider" gutterBottom>
              左端トリミング
            </Typography>
            <Slider
              aria-labelledby="left-trim-slider"
              value={leftTrim}
              onChange={handleLeftTrimChange}
              min={0}
              max={originalDimensions.width ? Math.max(0, originalDimensions.width - rightTrim - 10) : 100}
              step={1}
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography id="right-trim-slider" gutterBottom>
              右端トリミング
            </Typography>
            <Slider
              aria-labelledby="right-trim-slider"
              value={rightTrim}
              onChange={handleRightTrimChange}
              min={0}
              max={originalDimensions.width ? Math.max(0, originalDimensions.width - leftTrim - 10) : 100}
              step={1}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default SubsequentImageTrimmer;