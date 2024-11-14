import { IconEnum } from '@/enum/icon.enum';
import { IconType } from 'react-icons';
import { BiHome, BiSearch } from 'react-icons/bi';
import { HiOutlineEye } from 'react-icons/hi';
import { IoMdRefresh } from 'react-icons/io';
import { LuQrCode } from 'react-icons/lu';

interface IconProps {
    name: IconEnum;
    size?: number;
    color?: string;
    className?: string;
}

const iconMap: Record<IconEnum, IconType> = {
    code: LuQrCode,
    eye: HiOutlineEye,
    home: BiHome,
    refresh: IoMdRefresh,
    search: BiSearch,
};

export const Icon: React.FC<IconProps> = ({
    name,
    size = 24,
    color = 'currentColor',
    className,
}) => {
    const IconComponent = iconMap[name];
    return <IconComponent size={size} color={color} className={className} />;
};
