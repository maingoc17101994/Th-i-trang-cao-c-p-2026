import React, { useCallback, useRef, useState } from 'react';
import { FormState, Quality } from '../types';
import { QUALITY_OPTIONS } from '../constants';
import { describeImages } from '../services/geminiService';
import Card from './Card';
import { UploadIcon } from './icons/UploadIcon';
import { XIcon } from './icons/XIcon';

// --- ToggleSwitch ---
interface ToggleSwitchProps {
    label: string;
    helperText: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}
const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, helperText, checked, onChange }) => (
    <div>
        <div className="flex items-center justify-between">
            <label className="text-body-text font-medium">{label}</label>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`${
                    checked ? 'bg-primary-orange' : 'bg-toggle-off'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-orange focus:ring-offset-2 focus:ring-offset-panel-bg`}
            >
                <span
                    aria-hidden="true"
                    className={`${
                        checked ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-thumb shadow ring-0 transition duration-200 ease-in-out`}
                />
            </button>
        </div>
        <p className="text-muted-text text-xs mt-1">{helperText}</p>
    </div>
);

// --- InfluenceSlider ---
interface InfluenceSliderProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
    strength: number;
    onStrengthChange: (strength: number) => void;
}
const InfluenceSlider: React.FC<InfluenceSliderProps> = ({ enabled, onEnabledChange, strength, onStrengthChange }) => (
    <div>
        <div className="flex items-center justify-between">
            <label className="text-body-text font-medium">Mức độ ảnh hưởng</label>
            <button
                type="button"
                onClick={() => onEnabledChange(!enabled)}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                    enabled ? 'bg-primary-orange text-panel-bg' : 'bg-toggle-off text-body-text'
                }`}
            >
                {enabled ? 'BẬT' : 'TẮT'}
            </button>
        </div>
        <div className={`mt-3 ${!enabled ? 'opacity-50' : ''}`}>
            <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={strength}
                disabled={!enabled}
                onChange={(e) => onStrengthChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-toggle-off rounded-lg appearance-none cursor-pointer accent-primary-orange"
            />
            <p className="text-muted-text text-xs mt-1 text-right">Độ mạnh: {strength}%</p>
        </div>
    </div>
);


// --- Main ControlsPanel ---
interface ControlsPanelProps {
    formState: FormState;
    onStateChange: (updates: Partial<FormState>) => void;
    onGenerate: () => void;
    onStartOver: () => void;
    isLoading: boolean;
    error: string | null;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({ formState, onStateChange, onGenerate, onStartOver, isLoading, error }) => {
    const [isDescribing, setIsDescribing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    
    const handleFilesChange = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        
        const fileArray = Array.from(files);
        onStateChange({ images: [...formState.images, ...fileArray] });

        setIsDescribing(true);
        try {
            const newDescription = await describeImages(fileArray);
            onStateChange({ 
                characterDesc: formState.characterDesc 
                    ? `${formState.characterDesc}\n\n${newDescription}`
                    : newDescription
            });
        } catch (e) {
            console.error("Failed to describe image:", e);
        } finally {
            setIsDescribing(false);
        }
    };

    const removeImage = (indexToRemove: number) => {
        const newImages = formState.images.filter((_, index) => index !== indexToRemove);
        onStateChange({ images: newImages });
        // Note: For simplicity, we don't remove the auto-generated description for the removed image.
        // A more complex implementation could track descriptions per image.
    };

    return (
        <Card className="flex flex-col gap-6">
            <div>
                <h2 className="text-lg font-bold">1. Tải lên ảnh tham khảo</h2>
                <div className="mt-4 p-4 w-full min-h-[160px] bg-input-bg border-2 border-dashed border-border-color rounded-xl flex flex-col items-center justify-center">
                    {formState.images.length === 0 ? (
                        <button onClick={() => inputRef.current?.click()} className="flex flex-col items-center justify-center text-muted-text hover:text-body-text transition-colors">
                            <UploadIcon />
                            <p className="text-body-text font-semibold mt-2">Nhấn để tải ảnh lên</p>
                            <p className="text-muted-text text-xs mt-1">Bạn có thể chọn nhiều ảnh</p>
                        </button>
                    ) : (
                        <div className="w-full flex flex-col items-center">
                             <div className="flex flex-wrap gap-3 justify-center">
                                {formState.images.map((file, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`preview ${index}`}
                                            className="w-20 h-20 object-cover rounded-md border border-border-color"
                                            onLoad={e => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                                        />
                                        <button 
                                            onClick={() => removeImage(index)}
                                            className="absolute top-0 right-0 -mt-1 -mr-1 bg-error rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Remove image"
                                        >
                                            <XIcon />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => inputRef.current?.click()} className="mt-4 text-sm font-bold text-primary-orange hover:underline">
                                Tải thêm ảnh
                            </button>
                        </div>
                    )}
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        ref={inputRef} 
                        className="hidden" 
                        onChange={(e) => handleFilesChange(e.target.files)} 
                    />
                </div>
                 <div className="mt-4 flex flex-col gap-4">
                    <ToggleSwitch
                        label="Xóa nền"
                        helperText="Xóa nền khỏi ảnh tham khảo trước khi tạo."
                        checked={formState.removeBackground}
                        onChange={removeBackground => onStateChange({ removeBackground })}
                    />
                    <InfluenceSlider
                        enabled={formState.influenceEnabled}
                        onEnabledChange={influenceEnabled => onStateChange({ influenceEnabled })}
                        strength={formState.influenceStrength}
                        onStrengthChange={influenceStrength => onStateChange({ influenceStrength })}
                    />
                </div>
            </div>

            <hr className="border-t border-border-color" />

            <div className="relative">
                <h2 className="text-lg font-bold">2. Mô tả nhân vật và trang phục</h2>
                 {isDescribing && (
                    <div className="absolute top-9 right-3">
                         <svg className="animate-spin h-5 w-5 text-primary-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
                <textarea
                    value={formState.characterDesc}
                    onChange={e => onStateChange({ characterDesc: e.target.value })}
                    placeholder="AI sẽ tự động điền vào đây sau khi bạn tải ảnh lên..."
                    className="mt-4 w-full h-[120px] bg-input-bg border border-border-color rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-orange"
                    readOnly={isDescribing}
                />
            </div>

            <hr className="border-t border-border-color" />

            <div>
                <h2 className="text-lg font-bold">3. Mô tả hành động và dáng đi</h2>
                 <textarea
                    value={formState.sceneDesc}
                    onChange={e => onStateChange({ sceneDesc: e.target.value })}
                    placeholder="...theo sự sáng tạo của bạn."
                    className="mt-4 w-full h-[80px] bg-input-bg border border-border-color rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-orange"
                />
            </div>
            
            <hr className="border-t border-border-color" />
            
            <div>
                 <h2 className="text-lg font-bold">4. Chất lượng đầu ra</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                     {QUALITY_OPTIONS.map(option => (
                         <button
                            key={option.id}
                            type="button"
                            onClick={() => onStateChange({ quality: option.id })}
                            className={`p-3 rounded-xl border transition-all duration-200 text-center ${
                                formState.quality === option.id 
                                ? 'border-primary-orange bg-primary-orange/10 shadow-glow-orange' 
                                : 'border-border-color bg-input-bg hover:border-muted-text'
                            }`}
                         >
                            <span className="font-semibold text-sm text-body-text">{option.label}</span>
                            <span className="block text-xs text-muted-text mt-1">{option.caption}</span>
                         </button>
                     ))}
                 </div>
            </div>

            {error && <p className="text-error text-sm text-center">{error}</p>}

            <div className="flex items-center gap-4 mt-2">
                <button
                    onClick={onGenerate}
                    disabled={isLoading || isDescribing}
                    className="h-[52px] w-full bg-primary-orange hover:bg-primary-orange-hover active:bg-primary-orange-active rounded-xl text-panel-bg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : 'Tạo ảnh'}
                </button>
                <button
                    onClick={onStartOver}
                    className="flex-shrink-0 px-4 py-2 text-sm text-muted-text hover:text-body-text transition-colors"
                >
                    Làm lại
                </button>
            </div>

        </Card>
    );
};

export default ControlsPanel;