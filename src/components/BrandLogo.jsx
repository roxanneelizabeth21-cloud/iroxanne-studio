// iRoxanne Studio logo with automatic light/dark mode support.
const LIGHT_LOGO = 'https://media.base44.com/images/public/6a94dbc673f0d144b6ed36bb/23cf45e98_iRoxanne-Studio-light.svg';
const DARK_LOGO = 'https://media.base44.com/images/public/6a94dbc673f0d144b6ed36bb/50013a3eb_iRoxanne-Studio-dark.svg';

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