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
        renderCanvas(img, rotation, yOffset, leftTrim, rightTrim);
        
        // ハイライト表示を初期化
        updateHighlightPosition(yOffset);
      };
      img.src = image.preview;
    }
  }, [image, trimSettings]);

  // ハイライト位置の更新
const updateHighlightPosition = (offset) => {
  if (highlightRef.current && imageContainerRef.current && imageObj) {
    const containerHeight = imageContainerRef.current.offsetHeight;
    const containerWidth = imageContainerRef.current.offsetWidth;
    
    // 表示スケールの計算
    const scale = containerHeight / imageObj.height;
    
    // 横幅は元画像の幅に合わせる（一枚目の設定に依存しない）
    const highlightWidth = containerWidth; // 横幅は画面幅いっぱい
    const highlightHeight = trimSettings.height * scale; // 縦幅は統一
    
    highlightRef.current.style.width = `${highlightWidth}px`;
    highlightRef.current.style.height = `${highlightHeight}px`;
    
    // Y位置の計算（トリミング設定の位置 + オフセット）
    const topPosition = (trimSettings.yPosition + offset) * scale;
    highlightRef.current.style.top = `${topPosition}px`;
    highlightRef.current.style.left = '0'; // 横方向は左端から
  }
};

  // renderCanvas関数の修正
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
    }
  };

  // Y軸オフセット（縦位置）の調整 - スライダー用
  const handleYOffsetChange = (event, newValue) => {
    setYOffset(newValue);
    updateHighlightPosition(newValue);
    
    if (imageObj) {
      renderCanvas(imageObj, rotation, newValue, leftTrim, rightTrim);
    }
  };

  // 左右トリミングのハンドラを修正
const handleLeftTrimChange = (event, newValue) => {
  // 右側トリミングとの最小間隔を10pxとする
  const maxAllowedLeftTrim = Math.max(0, originalDimensions.width - rightTrim - 10);
  
  // 新しい値をバリデーション
  const validatedValue = Math.min(newValue, maxAllowedLeftTrim);
  
  setLeftTrim(validatedValue);
  if (imageObj) {
    renderCanvas(imageObj, rotation, yOffset, validatedValue, rightTrim);
  }
};

const handleRightTrimChange = (event, newValue) => {
  // 左側トリミングとの最小間隔を10pxとする
  const maxAllowedRightTrim = Math.max(0, originalDimensions.width - leftTrim - 10);
  
  // 新しい値をバリデーション
  const validatedValue = Math.min(newValue, maxAllowedRightTrim);
  
  setRightTrim(validatedValue);
  if (imageObj) {
    renderCanvas(imageObj, rotation, yOffset, leftTrim, validatedValue);
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

  // 最大オフセット値の計算
  const maxYOffset = imageObj ? imageObj.height - trimSettings.height - trimSettings.yPosition : 100;
  const minYOffset = -trimSettings.yPosition;

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          トリミング調整
        </Typography>
        
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
        max={originalDimensions.width ? originalDimensions.width - 10 : 100} // ほぼ全幅まで
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
        max={originalDimensions.width ? originalDimensions.width - 10 : 100} // ほぼ全幅まで
        step={1}
        valueLabelDisplay="auto"
      />
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
              max={originalDimensions.width / 4}
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
              max={originalDimensions.width / 4}
              step={1}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>

        <Button 
          variant="contained" 
          color="primary"
          onClick={handleApplySettings}
          sx={{ mt: 3 }}
          fullWidth
        >
          設定を適用
        </Button>
      </Paper>
    </Box>
  );
};

export default SubsequentImageTrimmer;