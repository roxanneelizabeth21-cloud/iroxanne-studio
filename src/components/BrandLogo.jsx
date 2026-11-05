// iRoxanne Studio logo.
// The public site always paints a light cream surface (see .studio-public in
// studio.css), even when the visitor's device is in dark mode. So the light
// logo is the default everywhere. `swapInDark` is only for admin screens that
// have a real dark theme (the Business / Marketing switcher).
const LIGHT_LOGO = '/branding/iRoxanne-Studio-light.svg';
const DARK_LOGO = '/branding/iRoxanne-Studio-dark.svg';

export default function BrandLogo({ className = '', height = 'h-10', swapInDark = false }) {
  if (!swapInDark) {
    return (
      <img
        src={LIGHT_LOGO}
        alt="iRoxanne Studio"
        draggable="false"
        className={`${height} w-auto object-contain ${className}`}
      />
    );
  }

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