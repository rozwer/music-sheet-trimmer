import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { 
  Box, Typography, Paper, Button, Grid, CircularProgress, Alert
} from '@mui/material';
import { jsPDF } from 'jspdf';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

// 用紙サイズ定義 (mm単位)
const paperSizes = {
  a3: { width: 297, height: 420 },
  a4: { width: 210, height: 297 },
  a5: { width: 148, height: 210 }
};

const OutputGenerator = () => {
  const { images, layoutSettings, trimSettings } = useAppContext();
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
    
    // 無限サイズでない場合は高さも設定
    if (layoutSettings.outputSize !== 'infinite') {
      style = {
        ...style,
        height: `${height * scale}mm`,
      };
    }
    
    return style;
  };

  // 画像レイアウトの計算を修正
  const getLayoutStyle = () => {
    const { width } = calculateOutputSize();
    const scale = 0.5; // プレビューのサイズを調整
    const containerWidth = width * scale;
    const columns = parseInt(layoutSettings.columns) || 1; // 数値型に変換して確実に値を取得
    
    // 列あたりの幅を計算
    const itemWidth = containerWidth / columns;
    
    // アスペクト比から最大の高さを計算（これは枠のサイズとなり、実際の画像はこのサイズを超えない）
    const aspectRatio = trimSettings.width / trimSettings.height;
    const itemHeight = itemWidth / aspectRatio;
    
    // 間隔を計算
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
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        width: 'auto', // 横幅を自動調整
        height: 'auto' // 高さを自動調整
      },
      spacing: spacing
    };
  };

  // レイアウト配置方法を修正（常に上下優先レイアウト）
  const arrangeItems = () => {
    if (images.length === 0 || !trimSettings.applied) {
      return null;
    }
    
    const layout = getLayoutStyle();
    const columns = parseInt(layoutSettings.columns) || 1; // 数値型に変換して確実に値を取得
    
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
          flexWrap: 'nowrap', 
          flexDirection: 'row',
          alignContent: 'flex-start',
          alignItems: 'flex-start',
          gap: calculateSpacing(1) + 'px',  // 必要な場合のみ間隔を追加
        }}
      >
        {/* 常に上下優先レイアウト（列ごとに並べる） */}
        {Array.from({length: columns}, (_, colIndex) => (
          <Box 
            key={`col-${colIndex}`} 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: calculateSpacing(1) + 'px',
            }}
          >
            {previewImages
              .filter((_, imgIndex) => imgIndex % columns === colIndex)
              .map((img, index) => (
                <Box key={`img-${colIndex}-${index}`} style={noSpacingStyle} className="image-container">
                  <img 
                    src={img} 
                    alt={`画像 ${colIndex * Math.ceil(previewImages.length / columns) + index + 1}`} 
                    style={layout.imageStyle} 
                  />
                </Box>
              ))
            }
          </Box>
        ))}
      </Box>
    );
  };

  // PDFファイルの生成を修正
  const generatePDF = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const { width, height } = calculateOutputSize();
      const orientation = layoutSettings.orientation === 'landscape' ? 'landscape' : 'portrait';
      
      let pdf; // 変数をここで宣言して両方の分岐で使えるようにする
      
      // 各画像のアスペクト比を取得するヘルパー関数
      const getImageDimensions = (imgSrc) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              width: img.width,
              height: img.height,
              aspectRatio: img.width / img.height
            });
          };
          img.src = imgSrc;
        });
      };
      
      // アスペクト比を維持して画像を配置するヘルパー関数
      const addImageWithAspectRatio = (pdf, imgSrc, x, y, boxWidth, boxHeight) => {
        return getImageDimensions(imgSrc).then(({ aspectRatio }) => {
          let imgWidth, imgHeight;
          
          // ボックスのアスペクト比と画像のアスペクト比を比較
          const boxAspectRatio = boxWidth / boxHeight;
          
          if (aspectRatio > boxAspectRatio) {
            // 画像が横長の場合、幅に合わせる
            imgWidth = boxWidth;
            imgHeight = imgWidth / aspectRatio;
          } else {
            // 画像が縦長の場合、高さに合わせる
            imgHeight = boxHeight;
            imgWidth = imgHeight * aspectRatio;
          }
          
          // 中央揃えのためのオフセットを計算
          const offsetX = (boxWidth - imgWidth) / 2;
          const offsetY = (boxHeight - imgHeight) / 2;
          
          // 画像を中央に配置
          pdf.addImage(
            imgSrc,
            'JPEG',
            x + offsetX,
            y + offsetY,
            imgWidth,
            imgHeight
          );
        });
      };
      
      // 無限長の場合は1つの長いページとして出力
      if (layoutSettings.outputSize === 'infinite') {
        // 基準となる幅をA4に設定
        const baseWidth = paperSizes.a4.width;
        
        // 余白設定
        const margin = 10;
        
        // 使用可能な幅を計算
        const usableWidth = baseWidth - (margin * 2);
        
        // 列数
        const columns = parseInt(layoutSettings.columns) || 1;
        
        // 画像サイズとアスペクト比を計算
        const columnWidth = usableWidth / columns;
        const aspectRatio = trimSettings.width / trimSettings.height;
        const imageHeight = columnWidth / aspectRatio;
        const spacing = layoutSettings.spacing === '0' ? 0 : calculateSpacing(imageHeight);
        
        // 画像の総数から必要な高さを計算
        const totalImages = previewImages.length;
        const imagesPerColumn = Math.ceil(totalImages / columns);
        const totalHeight = (imagesPerColumn * imageHeight) + ((imagesPerColumn - 1) * spacing) + (margin * 2);
        
        // カスタムサイズの長いページを持つPDFを作成
        pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [baseWidth, totalHeight]
        });
        
        // すべての画像の配置を待つために Promise の配列を作成
        const imagePromises = [];
        
        // 列ごとに画像を配置（上下優先レイアウト）
        for (let col = 0; col < columns; col++) {
          // この列に配置する画像を抽出
          const colImages = [];
          for (let i = col; i < totalImages; i += columns) {
            colImages.push(previewImages[i]);
          }
          
          // 列の画像を上から下へ配置
          for (let row = 0; row < colImages.length; row++) {
            const imgSrc = colImages[row];
            const x = margin + col * columnWidth;
            const y = margin + row * (imageHeight + spacing);
            
            // アスペクト比を維持して画像を追加
            imagePromises.push(
              addImageWithAspectRatio(pdf, imgSrc, x, y, columnWidth, imageHeight)
            );
          }
        }
        
        // すべての画像の配置が完了するのを待つ
        await Promise.all(imagePromises);
      } 
      // 固定サイズの場合の処理を修正
      else {
        // PDF生成
        pdf = new jsPDF({
          orientation,
          unit: 'mm',
          format: layoutSettings.outputSize === 'custom' ? [width, height] : layoutSettings.outputSize
        });
        
        // PDFのページサイズを取得
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // 列数
        const columns = parseInt(layoutSettings.columns) || 1;
        
        // 画像サイズとアスペクト比を計算
        const margin = 10; // ページ余白（mm）
        const usableWidth = pdfWidth - (margin * 2);
        const columnWidth = usableWidth / columns;
        
        // アスペクト比を計算
        const aspectRatio = trimSettings.width / trimSettings.height;
        const imageHeight = columnWidth / aspectRatio;
        
        // 間隔を計算
        const spacing = layoutSettings.spacing === '0' ? 0 : calculateSpacing(imageHeight);
        
        // 1ページに入る行数を計算
        const usableHeight = pdfHeight - (margin * 2);
        const rowsPerPage = Math.floor(usableHeight / (imageHeight + spacing));
        const imagesPerPage = rowsPerPage * columns;
        
        // 必要なページ数を計算
        const totalPages = Math.ceil(previewImages.length / imagesPerPage);
        
        // 各ページに画像を配置
        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
          // 2ページ目以降は新しいページを追加
          if (pageIndex > 0) {
            pdf.addPage();
          }
          
          // すべての画像の配置を待つために Promise の配列を作成
          const pageImagePromises = [];
          
          // このページに配置する画像のインデックス範囲
          const startIndex = pageIndex * imagesPerPage;
          const endIndex = Math.min((pageIndex + 1) * imagesPerPage, previewImages.length);
          
          // 常に上下優先レイアウトで配置
          for (let col = 0; col < columns; col++) {
            // この列に配置する画像を抽出
            for (let i = 0; i < rowsPerPage; i++) {
              const imageIndex = startIndex + i * columns + col;
              if (imageIndex < endIndex && imageIndex < previewImages.length) {
                const imgSrc = previewImages[imageIndex];
                const x = margin + col * columnWidth;
                const y = margin + i * (imageHeight + spacing);
                
                // アスペクト比を維持して画像を追加
                pageImagePromises.push(
                  addImageWithAspectRatio(pdf, imgSrc, x, y, columnWidth, imageHeight)
                );
              }
            }
          }
          
          // このページのすべての画像の配置が完了するのを待つ
          await Promise.all(pageImagePromises);
        }
      }
      
      // ダウンロード
      if (pdf) {
        pdf.save('楽譜レイアウト.pdf');
      }
    } catch (err) {
      console.error('PDF生成エラー:', err);
      setError('PDFの生成中にエラーが発生しました: ' + err.message);
    } finally {
      setIsGenerating(false);
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
            
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={isGenerating ? <CircularProgress size={24} color="inherit" /> : <PictureAsPdfIcon />}
                onClick={generatePDF}
                disabled={isGenerating}
                fullWidth
              >
                {isGenerating ? 'PDF生成中...' : 'PDFとしてダウンロード'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              最終プレビュー
            </Typography>
            
            <Box sx={{ 
              mt: 2, 
              overflow: 'auto', 
              maxHeight: '700px', // 高さを拡大
              border: '1px solid #eee',
              overflowX: 'auto',
              overflowY: 'auto'
            }}>
              {arrangeItems()}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OutputGenerator;