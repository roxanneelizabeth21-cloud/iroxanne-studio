// iRoxanne Studio logo with automatic light/dark mode support.
const LIGHT_LOGO = '/branding/iRoxanne-Studio-light.svg';
const DARK_LOGO = '/branding/iRoxanne-Studio-dark.svg';

export default function BrandLogo({ className = '', height = 'h-10' }) {
  return (
    <>
      <img
        src={LIGHT_LOGO}
        alt="iRoxanne Studio"
        draggable="false"
        className={`${height} w-auto object-contain dark:hidden ${className}`}
      />
      <img
        src={DARK_LOGO}
        alt="iRoxanne Studio"
        draggable="false"
        className={`${height} w-auto object-contain hidden dark:block ${className}`}
      />
    </>
  );
}