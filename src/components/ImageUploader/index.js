import React, { useState, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Box, Typography, IconButton, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const ImageUploader = () => {
  const { images, addImages, removeImage } = useAppContext();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // ファイル選択ダイアログを開く
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  // ドラッグイベント処理
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // ファイル処理共通関数
  const processFiles = (files) => {
    setError(null);
    const validFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 画像ファイル形式チェック
      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        setError('JPEGまたはPNG画像ファイルのみアップロード可能です');
        continue;
      }
      
      // 画像オブジェクト作成
      const imageObj = {
        file: file,
        preview: URL.createObjectURL(file),
        name: file.name,
        settings: {
          rotation: 0,
          trim: { left: 0, right: 0, top: 0, bottom: 0 }
        }
      };
      
      validFiles.push(imageObj);
    }
    
    if (validFiles.length > 0) {
      addImages(validFiles);
    }
  };

  // ドロップ処理
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // ファイル選択処理
  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        楽譜画像のアップロード
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box
        className={`upload-container ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        sx={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        <CloudUploadIcon sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
        <Typography variant="body1">
          クリックまたはドラッグ&amp;ドロップで画像をアップロード
        </Typography>
        <Typography variant="body2" color="textSecondary">
          サポート形式: JPG, PNG
        </Typography>
      </Box>

      {images.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            アップロード画像: {images.length}枚
          </Typography>
          <Box className="image-preview">
            {images.map((image, index) => (
              <Box key={index} className="image-item">
                <img src={image.preview} alt={`アップロード画像 ${index + 1}`} />
                <Box className="remove-image" onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}>
                  <IconButton size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ImageUploader;