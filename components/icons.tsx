import React from 'react';

type IconProps = { size?: number; className?: string };

const I = ({ d, size = 16, className, fill }: IconProps & { d: string; fill?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'}
    stroke={fill ? 'none' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    <path d={d} />
  </svg>
);

export const PlusIcon     = (p: IconProps) => <I {...p} d="M12 5v14M5 12h14" />;
export const EditIcon     = (p: IconProps) => <I {...p} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />;
export const CopyIcon     = (p: IconProps) => <I {...p} d="M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M8 4a2 2 0 012-2h4a2 2 0 012 2M8 4h8" />;
export const TrashIcon    = (p: IconProps) => <I {...p} d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />;
export const LinkIcon     = (p: IconProps) => <I {...p} d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />;
export const BarChartIcon = (p: IconProps) => <I {...p} d="M12 20V10M18 20V4M6 20v-4" />;
export const EyeIcon      = (p: IconProps) => <I {...p} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z" />;
export const ArrowLeftIcon = (p: IconProps) => <I {...p} d="M19 12H5M12 5l-7 7 7 7" />;
export const ArrowUpIcon  = (p: IconProps) => <I {...p} d="M12 19V5M5 12l7-7 7 7" />;
export const ArrowDownIcon = (p: IconProps) => <I {...p} d="M12 5v14M5 12l7 7 7-7" />;
export const CheckIcon    = (p: IconProps) => <I {...p} d="M20 6L9 17l-5-5" />;
export const XIcon        = (p: IconProps) => <I {...p} d="M18 6L6 18M6 6l12 12" />;
export const SearchIcon   = (p: IconProps) => <I {...p} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />;
export const GripIcon     = (p: IconProps) => <I {...p} d="M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01" />;
export const TypeIcon     = (p: IconProps) => <I {...p} d="M4 6h16M4 12h16M4 18h7" />;
export const MailIcon     = (p: IconProps) => <I {...p} d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6" />;
export const PhoneIcon    = (p: IconProps) => <I {...p} d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.79a16 16 0 006.29 6.29l1.15-1.25a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />;
export const HashIcon     = (p: IconProps) => <I {...p} d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" />;
export const CalendarIcon = (p: IconProps) => <I {...p} d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />;
export const UploadIcon   = (p: IconProps) => <I {...p} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />;
export const ListIcon     = (p: IconProps) => <I {...p} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />;
export const CheckSquareIcon = (p: IconProps) => <I {...p} d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />;
export const StarIcon     = (p: IconProps) => <I {...p} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />;
export const SliderIcon   = (p: IconProps) => <I {...p} d="M4 5h3M17 5h3M7 5a3 3 0 106 0 3 3 0 00-6 0M4 12h9M17 12h3M13 12a3 3 0 106 0 3 3 0 00-6 0M4 19h3M17 19h3M7 19a3 3 0 106 0 3 3 0 00-6 0" />;
export const LayoutIcon   = (p: IconProps) => <I {...p} d="M3 3h18v7H3zM3 14h8v7H3zM15 14h6v7h-6z" />;
export const MessageIcon  = (p: IconProps) => <I {...p} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />;
export const ImageIcon    = (p: IconProps) => <I {...p} d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21" />;
export const ChevronDownIcon = (p: IconProps) => <I {...p} d="M6 9l6 6 6-6" />;
export const ClockIcon    = (p: IconProps) => <I {...p} d="M12 2a10 10 0 100 20A10 10 0 0012 2zM12 6v6l4 2" />;
export const UsersIcon    = (p: IconProps) => <I {...p} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />;
export const TrendingUpIcon = (p: IconProps) => <I {...p} d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />;
export const AlertIcon    = (p: IconProps) => <I {...p} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />;
export const DownloadIcon = (p: IconProps) => <I {...p} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />;
export const SaveIcon     = (p: IconProps) => <I {...p} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8" />;
export const GlobeIcon    = (p: IconProps) => <I {...p} d="M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />;
export const PaletteIcon  = (p: IconProps) => <I {...p} d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10 1.1 0 2-.9 2-2 0-.54-.21-1.04-.54-1.41-.32-.36-.52-.85-.52-1.38 0-1.1.9-2 2-2h2.34c3.09 0 5.71-2.57 5.71-5.71C22.99 6.04 17.99 2 12 2z" />;
