import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Box, Typography, Button, Slider, Paper, FormControlLabel, Switch, IconButton, Tooltip, Divider } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import Cropper from 'react-cropper';
import './cropper.css';

const FirstImageTrimmer = ({ image, imageIndex }) => {
  const { setTrimSettings, images, setImages, addYAxisPreset } = useAppContext();
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
  }, [image]);  // トリミング確定ボタンの処理
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

      // 基準y位置をプリセットとして追加
      addYAxisPreset(0, '基準位置（1枚目）');

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
        
        // 選択部分のみを描画（左詰め処理）
        const img = new Image();
        img.onload = () => {
          // 左詰め処理: 選択された内容を左端に移動し、右側に白い余白を補填
          ctx.drawImage(
            img,
            data.x, data.y,  // ソース画像上の開始位置
            data.width, data.height,  // ソース画像上の切り取りサイズ
            0, data.y,  // キャンバス上の描画位置（X座標を0に変更して左詰め）
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
  return (
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
          トリミング範囲の指定
        </Typography>        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          楽譜部分の範囲を選択してください。
          {!allowHorizontalTrim && ' 他の画像には縦方向のトリミングのみが適用されます。'}
          {allowHorizontalTrim && ' 横方向のトリミングを有効にすると、選択された内容を左詰めにして右側に白い余白を補填します。'}
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

      {cropData && (        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            トリミングプレビュー
            {allowHorizontalTrim && (
              <Typography variant="caption" component="span" sx={{ ml: 2, color: 'text.secondary' }}>
                （左詰め処理適用済み）
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