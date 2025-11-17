import React, { useState } from 'react';
import Card from './Card';
import { GeneratedImage } from '../types';
import { enhanceImage } from '../services/geminiService';
import ImageModal from './ImageModal';
import { DownloadIcon } from './icons/DownloadIcon';
import { ZoomIcon } from './icons/ZoomIcon';
import { EnhanceIcon } from './icons/EnhanceIcon';

interface GalleryPanelProps {
    images: GeneratedImage[];
    onDownloadAll: () => void;
    onUpdateImage: (id: string, newSrc: string) => void;
    onSetImageEnhancing: (id: string, isEnhancing: boolean) => void;
}

const GalleryPanel: React.FC<GalleryPanelProps> = ({ images, onDownloadAll, onUpdateImage, onSetImageEnhancing }) => {
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDownload = (src: string, index: number) => {
        const a = document.createElement('a');
        a.href = src;
        a.download = `ai-lux-fashion-image-${index + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleEnhance = async (image: GeneratedImage) => {
        setError(null);
        onSetImageEnhancing(image.id, true);
        try {
            const [header, base64Data] = image.src.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/png';
            
            const newSrc = await enhanceImage(base64Data, mimeType);
            onUpdateImage(image.id, newSrc);

        } catch (e) {
            console.error("Enhancement failed:", e);
            setError("Nâng cao chất lượng thất bại. Vui lòng thử lại.");
            onSetImageEnhancing(image.id, false);
        }
    };

    const renderGrid = () => {
        if (images.length === 0) {
            return (
                <div className="aspect-[4/3] flex items-center justify-center text-muted-text">
                    <p>Ảnh của bạn sẽ hiện ở đây.</p>
                </div>
            );
        }
        
        return (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {images.map((image, index) => (
                    <div key={image.id} className="relative group aspect-[3/4] rounded-xl overflow-hidden border border-border-color">
                        <img 
                            src={image.src} 
                            alt={`Generated character ${image.id}`} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        />
                        {image.isEnhancing && (
                             <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
                                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-white mt-2 text-sm">Đang nâng cấp...</p>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-10">
                           <button 
                                onClick={() => setViewingImage(image.src)}
                                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 backdrop-blur-sm transition-all"
                                aria-label="Xem ảnh"
                                title="Xem ảnh"
                           >
                               <ZoomIcon />
                           </button>
                           <button 
                                onClick={() => handleEnhance(image)}
                                disabled={image.isEnhancing}
                                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 backdrop-blur-sm transition-all"
                                aria-label="Nâng cao chất lượng"
                                title="Nâng cao chất lượng"
                           >
                               <EnhanceIcon />
                           </button>
                           <button 
                                onClick={() => handleDownload(image.src, index)}
                                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 backdrop-blur-sm transition-all"
                                aria-label="Tải ảnh"
                                title="Tải ảnh"
                           >
                               <DownloadIcon />
                           </button>
                        </div>
                    </div>
                ))}
            </div>
        )
    };

    return (
        <>
            <Card className="min-h-[780px] sticky top-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex-1">
                        {error && <p className="text-error text-sm text-center">{error}</p>}
                    </div>
                    <button 
                        onClick={onDownloadAll}
                        disabled={images.length === 0}
                        className="bg-download-bg border border-border-color rounded-xl px-4 py-2 flex items-center gap-2 text-sm text-body-text hover:border-muted-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <DownloadIcon />
                        Tải tất cả
                    </button>
                </div>
                {renderGrid()}
            </Card>
            {viewingImage && (
                <ImageModal src={viewingImage} onClose={() => setViewingImage(null)} />
            )}
        </>
    );
};

export default GalleryPanel;
