import { GoogleGenAI, Modality } from "@google/genai";
import { FormState, Quality } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

export const describeImages = async (files: File[]): Promise<string> => {
    if (files.length === 0) return "";

    const describePromises = files.map(async (file) => {
        const base64Image = await fileToBase64(file);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType: file.type } },
                    { text: "Mô tả chi tiết về người và trang phục trong ảnh này bằng tiếng Việt để sử dụng trong một prompt tạo ảnh thời trang. Tập trung vào kiểu dáng, màu sắc, chất liệu và phong cách." },
                ],
            },
        });
        return response.text.trim();
    });

    const descriptions = await Promise.all(describePromises);
    return descriptions.join('\n\n');
};


const getInfluencePrompt = (strength: number): string => {
    if (strength <= 20) return "Hình ảnh được tạo ra nên được lấy cảm hứng một cách lỏng lẻo từ nhân vật trong ảnh tham khảo.";
    if (strength <= 40) return "Hình ảnh được tạo ra nên được lấy cảm hứng từ nhân vật trong ảnh tham khảo.";
    if (strength <= 60) return "Hình ảnh được tạo ra phải dựa trên nhân vật trong ảnh tham khảo.";
    if (strength <= 80) return "Hình ảnh được tạo ra phải khớp gần đúng với nhân vật trong ảnh tham khảo.";
    return "Hình ảnh được tạo ra phải là một phiên bản siêu thực của nhân vật trong ảnh tham khảo, duy trì tất cả các đặc điểm chính.";
};

export const generateCharacterImages = async (formState: FormState): Promise<string[]> => {
    if (formState.images.length === 0) {
        throw new Error("Không có ảnh tham khảo nào được cung cấp.");
    }

    const imageParts = await Promise.all(formState.images.map(async (file) => {
        const base64Image = await fileToBase64(file);
        return { inlineData: { data: base64Image, mimeType: file.type } };
    }));

    const characterDesc = formState.characterDesc;
    const sceneDesc = formState.sceneDesc;

    let prompt = `${characterDesc}. ${sceneDesc}. Tạo hai ảnh của cùng một nhân vật từ hai góc chụp khác nhau. Giữ nguyên cảm xúc và thần thái của nét mặt cũng như chi tiết trang phục từ ảnh tham khảo.`;

    if (formState.influenceEnabled) {
        prompt += ` ${getInfluencePrompt(formState.influenceStrength)}`;
    }
    
    if (formState.removeBackground) {
        prompt += ` Nhân vật nên được tách biệt trên nền trong suốt hoặc nền studio đơn giản.`
    }

    prompt += " Hình ảnh cuối cùng phải có độ chi tiết cao, siêu thực, với ánh sáng ban ngày tự nhiên, chất lượng điện ảnh HDR và độ sâu trường ảnh nông.";
    
    const generationPromises = Array(2).fill(0).map(() => 
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    ...imageParts,
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        })
    );

    const responses = await Promise.all(generationPromises);
    
    const imageUrls: string[] = [];
    responses.forEach(response => {
        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64Bytes = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType;
                    imageUrls.push(`data:${mimeType};base64,${base64Bytes}`);
                    break; // Take the first image part from each response
                }
            }
        }
    });

    if (imageUrls.length === 0) {
        throw new Error("AI không thể tạo ảnh. Vui lòng thử thay đổi mô tả của bạn.");
    }

    return imageUrls;
};

export const enhanceImage = async (base64Data: string, mimeType: string): Promise<string> => {
    const prompt = "Nâng cao chất lượng hình ảnh này. Tăng độ sắc nét, độ sống động của màu sắc và thêm các chi tiết đẹp cho khuôn mặt và quần áo của chủ thể. Làm cho hình ảnh rõ ràng và chân thực hơn mà không thay đổi chủ thể hoặc bố cục cốt lõi. Giữ nguyên tỷ lệ khung hình.";

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType: mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const newBase64Bytes = part.inlineData.data;
                const newMimeType = part.inlineData.mimeType;
                return `data:${newMimeType};base64,${newBase64Bytes}`;
            }
        }
    }

    throw new Error("Không thể nâng cao chất lượng ảnh.");
};