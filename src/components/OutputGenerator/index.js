import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { 
  Box, Typography, Paper, Button, FormControl, FormControlLabel, 
  RadioGroup, Radio, Grid, CircularProgress, Alert
} from '@mui/material';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';

// 用紙サイズ定義 (mm単位)
const paperSizes = {
  a3: { width: 297, height: 420 },
  a4: { width: 210, height: 297 },
  a5: { width: 148, height: 210 }
};

// このコメント行を削除しても構いません（使っていない関数）
// const mmToPoint = (mm) => mm * 2.83465;

const OutputGenerator = () => {
  const { images, layoutSettings, trimSettings } = useAppContext();
  const [outputFormat, setOutputFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);
  const outputContainerRef = useRef(null);
  
  // プレビュー用の画像配列を生成部分を修正
useEffect(() => {
    if (images.length > 0 && trimSettings.applied) {
      // 各画像のトリミング適用済みバージョンを生成
      const createTrimmingPreview = async () => {
        const processed = await Promise.all(images.map(async (img, index) => {
          // すでにトリミング済みの場合はそれを使用
          if (img.trimmedPreview) {
            return img.trimmedPreview;
          }
          
          // トリミング処理を適用
          try {
            const imgElement = new Image();
            await new Promise((resolve) => {
              imgElement.onload = resolve;
              imgElement.src = img.preview;
            });
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // トリミングサイズを設定
            canvas.width = trimSettings.width;
            canvas.height = trimSettings.height;
            
            // トリミング位置とサイズで画像を描画
            ctx.drawImage(
              imgElement,
              trimSettings.x, // X座標
              trimSettings.yPosition, // Y座標
              trimSettings.width, // 幅
              trimSettings.height, // 高さ
              0, 0, // キャンバス上の配置位置
              trimSettings.width,
              trimSettings.height
            );
            
            return canvas.toDataURL('image/jpeg');
          } catch (err) {
            console.error('画像トリミングエラー:', err);
            return img.preview; // エラーの場合は元の画像を使用
          }
        }));
        
        setPreviewImages(processed);
      };
      
      createTrimmingPreview();
    }
  }, [images, trimSettings]);

  // 出力形式の変更ハンドラ
  const handleFormatChange = (event) => {
    setOutputFormat(event.target.value);
  };

  // 出力サイズの計算
  const calculateOutputSize = () => {
    let width, height;
    
    if (layoutSettings.outputSize === 'infinite') {
      width = paperSizes.a4.width; // A4幅を基準
      
      // 列数と画像数から必要な高さを概算
      const rows = Math.ceil(images.length / layoutSettings.columns);
      const imageHeight = trimSettings.height * (paperSizes.a4.width / layoutSettings.columns / trimSettings.width);
      height = imageHeight * rows * 1.1; // 10%余裕を持たせる
    } 
    else if (layoutSettings.outputSize === 'custom') {
      width = layoutSettings.customSize.width;
      height = layoutSettings.customSize.height;
    } 
    else {
      const size = paperSizes[layoutSettings.outputSize];
      width = size.width;
      height = size.height;
    }
    
    // 縦向き/横向きの調整
    if (layoutSettings.orientation === 'landscape' && layoutSettings.outputSize !== 'infinite') {
      [width, height] = [height, width];
    }
    
    return { width, height };
  };

  // 間隔の計算
  const calculateSpacing = (imageHeight) => {
    switch (layoutSettings.spacing) {
      case '1/4':
        return imageHeight * 0.25;
      case '1/8':
        return imageHeight * 0.125;
      case '1/16':
        return imageHeight * 0.0625;
      case 'custom':
        return layoutSettings.customSpacing || 0;
      default:
        return 0;
    }
  };

  // プレビュー表示用のスタイル計算
  const getContainerStyle = () => {
    const { width, height } = calculateOutputSize();
    const scale = 0.5; // プレビューのサイズを調整
    
    let style = {
      width: `${width * scale}mm`,
      border: '1px solid #ccc',
      background: 'white',
      position: 'relative',
      margin: '0 auto',
      padding: '10px',
    };
    
    if (layoutSettings.outputSize !== 'infinite') {
      style = {
        ...style,
        height: `${height * scale}mm`,
        overflowY: 'hidden'
      };
    }
    
    return style;
  };

  

  // 画像レイアウトの計算を修正
const getLayoutStyle = () => {
    const { width } = calculateOutputSize();
    const scale = 0.5; // プレビューのサイズを調整
    const containerWidth = width * scale;
    const columns = layoutSettings.columns;
    
    // 隙間を考慮しない画像幅の計算
    const itemWidth = containerWidth / columns;
    
    // アスペクト比から高さを計算
    const aspectRatio = trimSettings.width / trimSettings.height;
    const itemHeight = itemWidth / aspectRatio;
    
    // 間隔を計算するが、プレビューのみに適用（実際の出力には影響させない）
    const spacing = layoutSettings.spacing === '0' ? 0 : calculateSpacing(itemHeight) * scale;
    
    return {
      containerStyle: getContainerStyle(),
      itemStyle: {
        width: `${itemWidth}mm`,
        height: `${itemHeight}mm`,
        background: '#f0f0f0',
        border: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
      },
      imageStyle: {
        width: '100%',
        height: '100%',
        objectFit: 'contain'
      },
      spacing: spacing
    };
  };

  // レイアウト配置方法の決定を修正
const arrangeItems = () => {
    if (images.length === 0 || !trimSettings.applied) {
      return null;
    }
    
    const layout = getLayoutStyle();
    const direction = layoutSettings.direction;
    
    // 画像間の余白をなくす
    const noSpacingStyle = {
      ...layout.itemStyle,
      margin: '0',  // 余白をゼロに
      boxSizing: 'border-box'
    };
    
    return (
      <Box 
        ref={outputContainerRef}
        style={layout.containerStyle} 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          flexDirection: direction === 'vertical' ? 'column' : 'row',
          alignContent: 'flex-start',
          alignItems: 'flex-start',
          gap: calculateSpacing(1) + 'px',  // 必要な場合のみ間隔を追加
        }}
      >
        {previewImages.map((img, index) => (
          <Box key={index} style={noSpacingStyle}>
            <img src={img} alt={`画像 ${index + 1}`} style={layout.imageStyle} />
          </Box>
        ))}
      </Box>
    );
  };

  // PDFファイルの生成を複数ページに対応させる
  const generatePDF = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const { width, height } = calculateOutputSize();
      const orientation = layoutSettings.orientation === 'landscape' ? 'landscape' : 'portrait';
      
      // PDF生成
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: layoutSettings.outputSize === 'custom' ? [width, height] : layoutSettings.outputSize
      });
      
      // 無限長の場合は単一ページで出力
      if (layoutSettings.outputSize === 'infinite') {
        if (outputContainerRef.current) {
          const dataUrl = await toPng(outputContainerRef.current, { 
            pixelRatio: 2,
            backgroundColor: '#ffffff'
          });
          
          const img = new Image();
          await new Promise(resolve => {
            img.onload = resolve;
            img.src = dataUrl;
          });
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const aspect = img.height / img.width;
          const pdfHeight = pdfWidth * aspect;
          
          // PDFのサイズを調整
          pdf.addPage([pdfWidth, pdfHeight], orientation);
          pdf.setPage(2);
          pdf.deletePage(1);
          
          // 画像をPDFに追加
          pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
      } 
      // 固定サイズの場合は複数ページに分割
      else {
        // トリミングされた画像のレイアウト計算
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const pageArea = pdfWidth * pdfHeight;
        
        // 各画像のデータを準備
        const imageItems = await Promise.all(previewImages.map(async (imgSrc) => {
          const img = new Image();
          await new Promise(resolve => {
            img.onload = resolve;
            img.src = imgSrc;
          });
          
          // アスペクト比を維持したサイズ計算
          const imgWidth = pdfWidth / layoutSettings.columns;
          const imgHeight = imgWidth * (img.height / img.width);
          
          return { img: imgSrc, width: imgWidth, height: imgHeight };
        }));
        
        // 画像を配置するためのグリッドを計算
        const imgsPerPage = Math.floor(pageArea / (imageItems[0].width * imageItems[0].height));
        const totalPages = Math.ceil(imageItems.length / imgsPerPage);
        
        // 各ページに画像を配置
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage(layoutSettings.outputSize, orientation);
          }
          
          const startIdx = page * imgsPerPage;
          const endIdx = Math.min(startIdx + imgsPerPage, imageItems.length);
          
          // 現在のページの画像を配置
          for (let i = startIdx; i < endIdx; i++) {
            const item = imageItems[i];
            const col = (i - startIdx) % layoutSettings.columns;
            const row = Math.floor((i - startIdx) / layoutSettings.columns);
            
            const x = col * item.width;
            const y = row * item.height;
            
            pdf.addImage(item.img, 'PNG', x, y, item.width, item.height);
          }
        }
      }
      
      // ダウンロード
      pdf.save('楽譜レイアウト.pdf');
    } catch (err) {
      console.error('PDF生成エラー:', err);
      setError('PDFの生成中にエラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  // 画像ファイルの生成
  const generateImage = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      if (outputContainerRef.current) {
        const dataUrl = await toPng(outputContainerRef.current, { 
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });
        
        // ダウンロードリンクを生成
        const link = document.createElement('a');
        link.download = '楽譜レイアウト.png';
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('画像生成エラー:', err);
      setError('画像の生成中にエラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  // 出力ボタンクリック時の処理
  const handleGenerateOutput = () => {
    if (outputFormat === 'pdf') {
      generatePDF();
    } else {
      generateImage();
    }
  };

  // 画像がない場合の表示
  if (images.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant="h6" color="text.secondary">
          出力する画像がありません。前のステップに戻って画像をアップロードしてください。
        </Typography>
      </Box>
    );
  }

  // トリミング設定が未完了
  if (!trimSettings.applied) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant="h6" color="text.secondary">
          トリミングが未完了です。前のステップに戻ってトリミング設定を行ってください。
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        出力生成
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              出力設定
            </Typography>
            
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                出力形式
              </Typography>
              <RadioGroup row value={outputFormat} onChange={handleFormatChange}>
                <FormControlLabel 
                  value="pdf" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PictureAsPdfIcon sx={{ mr: 0.5 }} fontSize="small" />
                      PDF
                    </Box>
                  } 
                />
                <FormControlLabel 
                  value="image" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ImageIcon sx={{ mr: 0.5 }} fontSize="small" />
                      画像
                    </Box>
                  } 
                />
              </RadioGroup>
            </FormControl>
            
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={isGenerating ? <CircularProgress size={24} color="inherit" /> : <DownloadIcon />}
                onClick={handleGenerateOutput}
                disabled={isGenerating}
                fullWidth
              >
                {isGenerating ? '生成中...' : `${outputFormat === 'pdf' ? 'PDF' : '画像'}としてダウンロード`}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              最終プレビュー
            </Typography>
            
            <Box sx={{ mt: 2, overflow: 'auto', maxHeight: '500px' }}>
              {arrangeItems()}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OutputGenerator;