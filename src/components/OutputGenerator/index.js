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
          
          // アスペクト比から適切なPDFサイズを計算
          const imageAspect = img.height / img.width;
          const pdfWidth = paperSizes.a4.width; // A4幅を基準
          const pdfHeight = pdfWidth * imageAspect;
          
          // 直接適切なサイズでPDFを初期化
          pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [pdfWidth, pdfHeight]
          });
          
          // 画像をPDFに追加（サイズいっぱいに配置）
          pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
      } 
      // 固定サイズの場合は複数ページに対応
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
        
        // 目標アスペクト比を計算（トリミング設定から）
        const targetAspectRatio = trimSettings.width / trimSettings.height;
        
        // 各画像のデータを準備し、必要に応じて横に空白を追加
        const imageItems = await Promise.all(previewImages.map(async (imgSrc) => {
          const img = new Image();
          await new Promise(resolve => {
            img.onload = resolve;
            img.src = imgSrc;
          });
          
          // 画像の実際のアスペクト比を計算
          const actualAspectRatio = img.width / img.height;
          
          // アスペクト比を比較して、必要に応じて横に空白を追加
          if (Math.abs(actualAspectRatio - targetAspectRatio) < 0.01) {
            // アスペクト比がほぼ同じ場合は変更なし
            return { 
              src: imgSrc,
              aspectRatio: actualAspectRatio,
              needsPadding: false
            };
          } else if (actualAspectRatio < targetAspectRatio) {
            // 画像が縦長すぎる場合、横に空白を追加
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 元の高さを保持し、目標アスペクト比に合わせた幅を計算
            const canvasHeight = img.height;
            const canvasWidth = canvasHeight * targetAspectRatio;
            
            // キャンバスサイズを設定
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            
            // 背景を白で塗りつぶす
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            // 画像を中央に配置
            const xOffset = (canvasWidth - img.width) / 2;
            ctx.drawImage(img, xOffset, 0, img.width, img.height);
            
            // 新しい画像をデータURLとして取得
            const paddedImageSrc = canvas.toDataURL('image/jpeg', 0.95);
            
            return { 
              src: paddedImageSrc,
              aspectRatio: targetAspectRatio,
              needsPadding: true
            };
          } else {
            // 画像が横長すぎる場合（これは既にトリミングで処理されているはずなので、念のため）
            return { 
              src: imgSrc,
              aspectRatio: actualAspectRatio,
              needsPadding: false
            };
          }
        }));
        
        // レイアウト計算
        const columns = parseInt(layoutSettings.columns) || 1; // 数値型に変換して確実に値を取得
        const margin = 10; // ページ余白（mm）
        
        // 列の幅を計算（余白を考慮）
        const usableWidth = pdfWidth - (margin * 2);
        const columnWidth = usableWidth / columns;
        
        // 最大サイズを設定
        const maxWidth = columnWidth;
        const maxHeight = maxWidth / targetAspectRatio;
        
        // 間隔を計算
        const spacing = layoutSettings.spacing === '0' ? 0 : calculateSpacing(maxHeight);
        
        // 1ページに配置可能な行数を計算
        const usableHeight = pdfHeight - (margin * 2);
        const rowsPerPage = Math.floor(usableHeight / (maxHeight + spacing));
        const imagesPerPage = rowsPerPage * columns;
        
        // 必要なページ数を計算
        const totalPages = Math.ceil(imageItems.length / imagesPerPage);
        
        // 各ページに画像を配置（最初のページは保持）
        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
          // 2ページ目以降は新しいページを追加
          if (pageIndex > 0) {
            pdf.addPage();
          }
          
          // このページに配置する画像のインデックス範囲
          const startIndex = pageIndex * imagesPerPage;
          const endIndex = Math.min((pageIndex + 1) * imagesPerPage, imageItems.length);
          
          // このページに配置する画像
          const pageImages = imageItems.slice(startIndex, endIndex);
          
          // 常に上下優先レイアウトで配置
          for (let col = 0; col < columns; col++) {
            const colImages = [];
            // この列に配置する画像を抽出
            for (let i = col; i < pageImages.length; i += columns) {
              colImages.push(pageImages[i]);
            }
            
            // 列の画像を上から下へ配置
            for (let row = 0; row < colImages.length; row++) {
              const image = colImages[row];
              const x = margin + col * columnWidth;
              const y = margin + row * (maxHeight + spacing);
              
              // 画像を追加（アスペクト比を維持）
              pdf.addImage(
                image.src,
                'JPEG',
                x,
                y,
                maxWidth,
                maxHeight
              );
            }
          }
        }
      }
      
      // ダウンロード（両方の分岐で pdf が定義されていることを確認）
      if (pdf) {
        pdf.save('楽譜レイアウト.pdf');
      }
    } catch (err) {
      console.error('PDF生成エラー:', err);
      setError('PDFの生成中にエラーが発生しました。');
    } finally {
      setIsGenerating(false);
    }
  };

  // 画像ファイルの生成を修正
  const generateImage = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      if (outputContainerRef.current) {
        // 高解像度で画像を生成
        const dataUrl = await toPng(outputContainerRef.current, { 
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          canvasWidth: outputContainerRef.current.offsetWidth * 2,
          canvasHeight: outputContainerRef.current.offsetHeight * 2
        });
        
        // ダウンロードリンクを作成して明示的にクリック
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = '楽譜レイアウト.png';
        document.body.appendChild(link); // DOMに追加
        link.click();
        document.body.removeChild(link); // クリック後に削除
      }
    } catch (err) {
      console.error('画像生成エラー:', err);
      setError('画像の生成中にエラーが発生しました。エラー詳細: ' + err.message);
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