import React from 'react';

interface ImageModalProps {
    src: string;
    onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ src, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <button 
                className="absolute top-4 right-4 text-white text-3xl z-50"
                onClick={onClose}
                aria-label="Close image view"
            >
                &times;
            </button>
            <div 
                className="relative max-w-[90vw] max-h-[90vh]"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
            >
                <img src={src} alt="Full size preview" className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg" />
            </div>
        </div>
    );
};

export default ImageModal;
