import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { 
  Box, Typography, Paper, Button, Grid, CircularProgress, Alert
} from '@mui/material';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
  
  // タイトル関連の設定
  const hasTitle = layoutSettings.titleInfo?.title && layoutSettings.titleInfo.title.trim() !== '';
  const titleHeight = hasTitle ? 15 : 0; // タイトル表示用の高さ（mm単位）
  
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
      height = imageHeight * rows * 1.1 + titleHeight; // タイトル高さを追加
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
      spacing: spacing,      titleStyle: {
        fontSize: '14pt',
        fontWeight: 'bold',
        marginBottom: '12px',
        textAlign: 'center',
        width: '100%',
        fontFamily: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', 'Meiryo UI', 'MS Gothic', sans-serif"
      }
    };
  };

  // レイアウト配置方法を修正（タイトル追加）
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
          flexDirection: 'column'
        }}
      >
        {/* タイトル表示部分 */}
        {hasTitle && (
          <Typography 
            variant="h5" 
            component="h2" 
            sx={layout.titleStyle}
          >
            {layoutSettings.titleInfo.title}
          </Typography>
        )}
        
        {/* 画像レイアウト部分 */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'nowrap', 
          flexDirection: 'row',
          alignContent: 'flex-start',
          alignItems: 'flex-start',
          gap: calculateSpacing(1) + 'px',
        }}>
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
      
      // 最大アスペクト比を求める
      const largestRatio = await (async () => {
        let maxR = 0;
        for (const imgSrc of previewImages) {
          const dims = await getImageDimensions(imgSrc);
          const ratio = dims.width / dims.height;
          if (ratio > maxR) maxR = ratio;
        }
        return maxR;
      })();
      
      // アスペクト比を維持して画像を配置するヘルパー関数
      const addImageWithAspectRatio = (pdf, imgSrc, x, y, boxWidth, boxHeight, largestRatio) => {
        return getImageDimensions(imgSrc).then(async ({ width, height, aspectRatio }) => {
          let finalSrc = imgSrc;
          // アスペクト比が最も大きい値より小さい場合は画像を左右に白余白を追加
          if (aspectRatio < largestRatio) {
            const targetWidth = height * largestRatio;
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, targetWidth, height);
            const offsetX = 0; // 左寄せのため、余白は右側に
            ctx.drawImage(await loadImage(imgSrc), offsetX, 0, width, height);
            finalSrc = canvas.toDataURL('image/jpeg');
          }
    
          // ボックスのアスペクト比と最終画像のアスペクト比を比較
          const finalDims = await getImageDimensions(finalSrc);
          const boxAspectRatio = boxWidth / boxHeight;
          let imgWidth, imgHeight;
          if (finalDims.aspectRatio > boxAspectRatio) {
            imgWidth = boxWidth;
            imgHeight = imgWidth / finalDims.aspectRatio;
          } else {
            imgHeight = boxHeight;
            imgWidth = imgHeight * finalDims.aspectRatio;
          }
          const offsetX = 0; // 左寄せに修正（空白は右側に補填）
          const offsetY = (boxHeight - imgHeight) / 2;
          pdf.addImage(finalSrc, 'JPEG', x + offsetX, y + offsetY, imgWidth, imgHeight);
        });
      };
        // タイトルを追加する関数（日本語フォント対応）
      const addTitleToPDF = async (pdf, title, x, y, width) => {
        if (!title || title.trim() === '') return;
        
        try {
          // HTML要素を作成してタイトルをレンダリング
          const titleElement = document.createElement('div');
          titleElement.style.cssText = `
            font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', 'Meiryo UI', 'MS Gothic', sans-serif;
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            color: black;
            background: white;
            padding: 10px;
            width: ${width}mm;
            box-sizing: border-box;
            line-height: 1.2;
          `;
          titleElement.textContent = title;
          
          // 一時的にDOMに追加
          document.body.appendChild(titleElement);
          
          // html2canvasでキャプチャ
          const canvas = await html2canvas(titleElement, {
            backgroundColor: 'white',
            scale: 2, // 高解像度
            useCORS: true,
            allowTaint: true
          });
          
          // DOMから削除
          document.body.removeChild(titleElement);
          
          // キャンバスをPDFに追加
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = width;
          const imgHeight = (canvas.height / canvas.width) * width;
          
          pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
          
          // タイトル分の高さを返す
          return imgHeight + 5; // 5mmのマージンを追加
        } catch (error) {
          console.warn('html2canvasでのタイトル描画に失敗、フォールバックを使用:', error);
          
          // フォールバック: jsPDFのデフォルトフォントを使用
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          
          // センタリング用にテキスト幅を取得
          const textWidth = pdf.getStringUnitWidth(title) * pdf.getFontSize() / pdf.internal.scaleFactor;
          const textX = x + (width - textWidth) / 2;
          
          pdf.text(title, textX, y + 10);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(12);
          
          return 15; // デフォルトのタイトル高さ
        }
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
        const imageHeight = columnWidth / largestRatio;
        const spacing = layoutSettings.spacing === '0' ? 0 : calculateSpacing(imageHeight);
        
        // 画像の総数から必要な高さを計算
        const totalImages = previewImages.length;
        const imagesPerColumn = Math.ceil(totalImages / columns);
        const contentHeight = (imagesPerColumn * imageHeight) + ((imagesPerColumn - 1) * spacing);
        const totalHeight = contentHeight + titleHeight + (margin * 2); // タイトル分の高さを追加
        
        // カスタムサイズの長いページを持つPDFを作成
        pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [baseWidth, totalHeight]
        });
          // タイトルの追加
        let actualTitleHeight = 0;
        if (hasTitle) {
          actualTitleHeight = await addTitleToPDF(pdf, layoutSettings.titleInfo.title, margin, margin, usableWidth);
        }
          // すべての画像の配置を待つために Promise の配列を作成
        const imagePromises = [];
        
        // タイトル分のオフセットを計算
        const titleOffset = actualTitleHeight;
        
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
            const y = margin + titleOffset + row * (imageHeight + spacing);
            
            // アスペクト比を維持して画像を追加
            imagePromises.push(
              addImageWithAspectRatio(pdf, imgSrc, x, y, columnWidth, imageHeight, largestRatio)
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
        const imageHeight = columnWidth / largestRatio;
          // 間隔を計算
        const spacing = layoutSettings.spacing === '0' ? 0 : calculateSpacing(imageHeight);
        
        // タイトル分のオフセットを計算
        let actualTitleHeight = 0;
        
        // 1ページに入る行数を計算（タイトル分を考慮）
        const usableHeight = pdfHeight - (margin * 2) - titleHeight;
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
          
          // タイトルの追加（最初のページのみ）
          if (pageIndex === 0 && hasTitle) {
            actualTitleHeight = await addTitleToPDF(pdf, layoutSettings.titleInfo.title, margin, margin, usableWidth);
          }
          
          // すべての画像の配置を待つために Promise の配列を作成
          const pageImagePromises = [];
            // このページに配置する画像のインデックス範囲
          const startIndex = pageIndex * imagesPerPage;
          const endIndex = Math.min((pageIndex + 1) * imagesPerPage, previewImages.length);
          
          // タイトル分のオフセット（最初のページのみ適用）
          const pageOffset = pageIndex === 0 ? actualTitleHeight : 0;
          
          // 常に上下優先レイアウトで配置
          for (let col = 0; col < columns; col++) {
            // この列に配置する画像を抽出
            for (let i = 0; i < rowsPerPage; i++) {
              const imageIndex = startIndex + i * columns + col;
              if (imageIndex < endIndex && imageIndex < previewImages.length) {
                const imgSrc = previewImages[imageIndex];
                const x = margin + col * columnWidth;
                const y = margin + pageOffset + i * (imageHeight + spacing);
                
                // アスペクト比を維持して画像を追加
                pageImagePromises.push(
                  addImageWithAspectRatio(pdf, imgSrc, x, y, columnWidth, imageHeight, largestRatio)
                );
              }
            }
          }
          
          // このページのすべての画像の配置が完了するのを待つ
          await Promise.all(pageImagePromises);
        }
      }
      
      // ダウンロード - ファイル名にタイトルを含める
      const fileName = hasTitle 
        ? `楽譜_${layoutSettings.titleInfo.title}.pdf`
        : '楽譜レイアウト.pdf';
        
      if (pdf) {
        pdf.save(fileName);
      }
    } catch (err) {
      console.error('PDF生成エラー:', err);
      setError('PDFの生成中にエラーが発生しました: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 画像読み込みヘルパー
  const loadImage = (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });
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
            
            {hasTitle && (
              <Typography variant="body1" sx={{ mt: 2, fontWeight: 'medium' }}>
                タイトル: {layoutSettings.titleInfo.title}
              </Typography>
            )}
            
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
              maxHeight: '700px',
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