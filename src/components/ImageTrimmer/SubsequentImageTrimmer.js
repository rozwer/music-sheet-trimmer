import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Box, Typography, Button, Slider, Paper, IconButton, Grid, Tooltip } from '@mui/material';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';

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
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 状態変数の現在の値をRefで追跡（クリーンアップ関数で最新値を使用するため）
  const stateRef = useRef({
    rotation,
    yOffset,
    leftTrim,
    rightTrim,
    imageObj,
    hasInteracted,
    imageIndex
  });

  // refを最新の状態に保つ
  useEffect(() => {
    stateRef.current = {
      rotation,
      yOffset,
      leftTrim,
      rightTrim,
      imageObj,
      hasInteracted,
      imageIndex
    };
  }, [rotation, yOffset, leftTrim, rightTrim, imageObj, hasInteracted, imageIndex]);

  // 自動保存機能をuseCallbackでメモ化
  const autoSaveSettings = useCallback((newRotation, newYOffset, newLeftTrim, newRightTrim) => {
    if (!canvasRef.current || !stateRef.current.imageObj) return;
    
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
        rightTrim: newRightTrim,
        lastSaved: new Date().getTime() // 保存時刻を追加
      }
    };
    setImages(updatedImages);
  }, [images, setImages, imageIndex]);
  
  // 画像のロードと初期設定
  useEffect(() => {
    // 画像が変更されたとき
    if (image && trimSettings.applied) {
      setIsInitialLoad(true);
      setHasInteracted(false);
      
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setImageObj(img);

        // 既存の設定を読み込む
        const existingSettings = image.settings || {};
        const newLeftTrim = existingSettings.leftTrim || 0;
        const newRightTrim = existingSettings.rightTrim || 0;
        const newYOffset = existingSettings.yOffset || 0;
        const newRotation = existingSettings.rotation || 0;
        
        // 状態を更新
        setLeftTrim(newLeftTrim);
        setRightTrim(newRightTrim);
        setYOffset(newYOffset);
        setRotation(newRotation);

        // キャンバスとハイライトを更新
        setTimeout(() => {
          renderCanvas(
            img,
            newRotation,
            newYOffset,
            newLeftTrim,
            newRightTrim
          );
          updateHighlightPosition(
            newYOffset,
            newLeftTrim,
            newRightTrim
          );
          setIsInitialLoad(false);
        }, 0);
      };
      img.src = image.preview;
    }
  }, [image, trimSettings, imageIndex]);

  // 現在の画像からコンポーネントがアンマウントされるとき、または別の画像に切り替わるときに設定を保存
  useEffect(() => {
    return () => {
      const currentState = stateRef.current;
      if (canvasRef.current && currentState.imageObj && (currentState.hasInteracted || images[imageIndex]?.trimmedPreview === undefined)) {
        autoSaveSettings(
          currentState.rotation,
          currentState.yOffset, 
          currentState.leftTrim, 
          currentState.rightTrim
        );
      }
    };
  }, [autoSaveSettings, imageIndex, images]);

  // キャンバスでの描画処理
  const renderCanvas = useCallback((img, rotation, yOffset, leftTrim, rightTrim) => {
    if (!canvasRef.current || !img) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 縦幅のみ一枚目から引き継ぎ、横幅は画像幅から左右のトリムを引いた値を使用
    const effectiveWidth = img.width - leftTrim - rightTrim;
    const effectiveHeight = trimSettings.height;
    
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
    
    // トリミング位置の計算
    ctx.drawImage(
      img,
      leftTrim,
      trimSettings.yPosition + yOffset,
      effectiveWidth,
      effectiveHeight,
      -effectiveWidth / 2,
      -effectiveHeight / 2,
      effectiveWidth,
      effectiveHeight
    );
    
    ctx.restore();
  }, [trimSettings]);

  // ハイライト位置の更新
  const updateHighlightPosition = useCallback((offset, left = leftTrim, right = rightTrim) => {
    if (highlightRef.current && imageContainerRef.current && imageObj) {
      const container = imageContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // 画像要素を取得
      const imgElement = container.querySelector('img');
      if (!imgElement) return;
      
      const imgRect = imgElement.getBoundingClientRect();
      
      // 画像の実際の表示サイズを取得
      const displayedImageWidth = imgRect.width;
      const displayedImageHeight = imgRect.height;
      
      // 画像のコンテナ内でのオフセットを計算
      const imageLeftOffset = imgRect.left - containerRect.left;
      const imageTopOffset = imgRect.top - containerRect.top;
      
      // 画像の実際のスケールを計算
      const scaleWidth = displayedImageWidth / imageObj.width;
      const scaleHeight = displayedImageHeight / imageObj.height;
      
      // 有効な幅を計算（左右トリムを考慮）
      const effectiveWidth = imageObj.width - left - right;
      
      // ハイライトサイズを設定
      const highlightWidth = effectiveWidth * scaleWidth;
      const highlightHeight = trimSettings.height * scaleHeight;
      
      highlightRef.current.style.width = `${highlightWidth}px`;
      highlightRef.current.style.height = `${highlightHeight}px`;
      
      // 位置の計算（トリミング設定の位置 + オフセット）- 画像のオフセットを考慮
      const topPosition = imageTopOffset + (trimSettings.yPosition + offset) * scaleHeight;
      const leftPosition = imageLeftOffset + left * scaleWidth;
      
      highlightRef.current.style.top = `${topPosition}px`;
      highlightRef.current.style.left = `${leftPosition}px`;
    }
  }, [imageObj, leftTrim, rightTrim, trimSettings]);

  // 値変更後の処理をまとめた関数
  const handleValuesChanged = useCallback((newRotation, newYOffset, newLeftTrim, newRightTrim, forceUpdate = false) => {
    if (!imageObj) return;
    
    renderCanvas(imageObj, newRotation, newYOffset, newLeftTrim, newRightTrim);
    updateHighlightPosition(newYOffset, newLeftTrim, newRightTrim);
    
    // 初期ロード時以外は自動保存
    if (!isInitialLoad || forceUpdate) {
      autoSaveSettings(newRotation, newYOffset, newLeftTrim, newRightTrim);
    }
  }, [imageObj, isInitialLoad, autoSaveSettings, renderCanvas, updateHighlightPosition]);

  // 画像の回転処理
  const handleRotate = (degrees) => {
    setHasInteracted(true);
    const newRotation = (rotation + degrees) % 360;
    setRotation(newRotation);
    handleValuesChanged(newRotation, yOffset, leftTrim, rightTrim);
  };

    // Y軸オフセット（縦位置）の調整 - スライダー用
    const handleYOffsetChange = (event, newValue) => {
      setHasInteracted(true);
      setYOffset(newValue);
      
      // スライダードラッグ中は軽量な更新のみ
      if (event.type === 'mouseup' || event.type === 'touchend') {
        handleValuesChanged(rotation, newValue, leftTrim, rightTrim);
      } else {
        // ドラッグ中は自動保存なしで軽量更新
        renderCanvas(imageObj, rotation, newValue, leftTrim, rightTrim);
        updateHighlightPosition(newValue, leftTrim, rightTrim);
      }
    };

  // 左右トリミングの調整
const handleLeftTrimChange = (event, newValue) => {
  setHasInteracted(true);
  const maxAllowedLeftTrim = Math.max(0, originalDimensions.width - rightTrim - 10);
  const validatedValue = Math.min(newValue, maxAllowedLeftTrim);
  
  setLeftTrim(validatedValue);
  // スライダードラッグ中は軽量な更新のみ
  if (event.type === 'mouseup' || event.type === 'touchend') {
    handleValuesChanged(rotation, yOffset, validatedValue, rightTrim);
  } else {
    // ドラッグ中は自動保存なしで軽量更新
    renderCanvas(imageObj, rotation, yOffset, validatedValue, rightTrim);
    updateHighlightPosition(yOffset, validatedValue, rightTrim);
  }
};

const handleRightTrimChange = (event, newValue) => {
  setHasInteracted(true);
  const maxAllowedRightTrim = Math.max(0, originalDimensions.width - leftTrim - 10);
  const validatedValue = Math.min(newValue, maxAllowedRightTrim);
  
  setRightTrim(validatedValue);
  // スライダードラッグ中は軽量な更新のみ
  if (event.type === 'mouseup' || event.type === 'touchend') {
    handleValuesChanged(rotation, yOffset, leftTrim, validatedValue);
  } else {
    // ドラッグ中は自動保存なしで軽量更新
    renderCanvas(imageObj, rotation, yOffset, leftTrim, validatedValue);
    updateHighlightPosition(yOffset, leftTrim, validatedValue);
  }
};
  // ドラッグ移動の共通処理
  const processDragMove = (clientY) => {
    setHasInteracted(true);
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
    handleValuesChanged(rotation, newYOffset, leftTrim, rightTrim);
  };

  // 画像を複製する
  const duplicateImage = () => {
    const imageToDuplicate = images[imageIndex];
    const duplicatedImage = {
      ...imageToDuplicate,
      name: `${imageToDuplicate.name || 'image'} (複製)`,
      id: `${imageToDuplicate.id || Date.now()}_copy`
    };
    
    const updatedImages = [...images];
    updatedImages.splice(imageIndex + 1, 0, duplicatedImage);
    setImages(updatedImages);
  };

  // 画像を削除する
  const deleteImage = () => {
    if (images.length <= 1) return; // 最後の画像は削除不可
    
    const updatedImages = [...images];
    updatedImages.splice(imageIndex, 1);
    setImages(updatedImages);
  };

  // 残りのドラッグハンドリングコードは変更なし...
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
    // UIコードは変更なし
    <Box>
      {/* 画像操作部分 */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            画像操作
          </Typography>
          <Box>
            <Tooltip title="画像を複製">
              <IconButton 
                onClick={duplicateImage}
                size="small"
                sx={{ mr: 1 }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="画像を削除">
              <IconButton 
                onClick={deleteImage}
                disabled={images.length <= 1}
                size="small"
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

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
                  touchAction: 'none'
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
    onChange={(e, value) => {
      // スライダードラッグ中は状態更新と軽量な描画のみ
      setYOffset(value);
      if (imageObj) {
        renderCanvas(imageObj, rotation, value, leftTrim, rightTrim);
        updateHighlightPosition(value, leftTrim, rightTrim);
      }
    }}
    onChangeCommitted={(e, value) => {
      // スライダー操作完了時に重い処理を実行
      setHasInteracted(true);
      handleValuesChanged(rotation, value, leftTrim, rightTrim);
    }}
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