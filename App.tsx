import React, { useState, useCallback } from 'react';
import { FormState, GeneratedImage, Quality } from './types';
import { INITIAL_FORM_STATE } from './constants';
import { generateCharacterImages } from './services/geminiService';
import Header from './components/Header';
import ControlsPanel from './components/ControlsPanel';
import GalleryPanel from './components/GalleryPanel';
import Footer from './components/Footer';

declare global {
    interface Window {
        JSZip: any;
    }
}

const App: React.FC = () => {
    const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateFormState = useCallback((updates: Partial<FormState>) => {
        setFormState(prev => ({ ...prev, ...updates }));
    }, []);

    const handleGenerate = async () => {
        setError(null);
        if (formState.images.length === 0) {
            setError("Vui lòng tải lên ít nhất một ảnh tham khảo.");
            return;
        }
        if (!formState.characterDesc.trim()) {
            setError("Mô tả nhân vật và trang phục không được để trống.");
            return;
        }

        setIsLoading(true);
        try {
            const imageResults = await generateCharacterImages(formState);
            const imagesWithIds = imageResults.map((src, index) => ({
                id: `img-${Date.now()}-${index}`,
                src
            }));
            setGeneratedImages(imagesWithIds);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartOver = () => {
        setFormState(INITIAL_FORM_STATE);
        setGeneratedImages([]);
        setError(null);
    };

    const handleDownloadAll = async () => {
        if (generatedImages.length === 0) return;
        const zip = new window.JSZip();
        
        const imagePromises = generatedImages.map(async (image, index) => {
            const response = await fetch(image.src);
            const blob = await response.blob();
            zip.file(`fashion_image_${index + 1}.png`, blob);
        });

        await Promise.all(imagePromises);

        zip.generateAsync({ type: "blob" }).then((content: Blob) => {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ai-lux-fashion-images.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    };

    const handleUpdateImage = (imageId: string, newSrc: string) => {
        setGeneratedImages(prevImages =>
            prevImages.map(img =>
                img.id === imageId ? { ...img, src: newSrc, isEnhancing: false } : img
            )
        );
    };

    const handleSetImageEnhancing = (imageId: string, isEnhancing: boolean) => {
        setGeneratedImages(prevImages =>
            prevImages.map(img =>
                img.id === imageId ? { ...img, isEnhancing } : img
            )
        );
    };
    
    return (
        <div className="bg-page-bg text-body-text font-sans min-h-screen flex flex-col items-center p-4 sm:p-6">
            <div className="w-full max-w-[1280px]">
                <Header />
                <main className="grid grid-cols-1 lg:grid-cols-2 justify-center gap-6 mt-8 items-start">
                    <ControlsPanel
                        formState={formState}
                        onStateChange={updateFormState}
                        onGenerate={handleGenerate}
                        onStartOver={handleStartOver}
                        isLoading={isLoading}
                        error={error}
                    />
                    <GalleryPanel
                        images={generatedImages}
                        onDownloadAll={handleDownloadAll}
                        onUpdateImage={handleUpdateImage}
                        onSetImageEnhancing={handleSetImageEnhancing}
                    />
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default App;
