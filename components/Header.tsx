import React from 'react';
import { FashionIcon } from './icons/FashionIcon';

const Header: React.FC = () => {
    return (
        <header className="text-center flex flex-col items-center">
             <FashionIcon />
            <h1 className="text-[40px] font-extrabold text-title-orange mt-2">
                AI LUX Fashion
            </h1>
            <p className="text-sm text-muted-text mt-1">
                Tạo nên phong cách thời trang độc đáo của bạn.
            </p>
        </header>
    );
};

export default Header;