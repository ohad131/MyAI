/**
 * LiquidSvgFilters
 * 
 * Injects hidden SVG filter definitions into the DOM.
 * These filters are referenced by CSS `filter: url(#...)` on
 * liquid chrome buttons and glass panels.
 * 
 * Filters:
 *   #liquid-morph   — subtle turbulence displacement for buttons
 *   #liquid-glass   — stronger displacement for glass panels
 */
export default function LiquidSvgFilters() {
  return (
    <svg
      style={{
        position: "fixed",
        width: 0,
        height: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: -1,
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Button liquid morph — very subtle, preserves readability */}
        <filter id="liquid-morph" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.025 0.018"
            numOctaves="3"
            seed="8"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="3"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Glass panel liquid distortion — stronger, shows through */}
        <filter id="liquid-glass" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.008"
            numOctaves="4"
            seed="5"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Chrome shine — used for button highlights */}
        <linearGradient id="chrome-shine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.8)" />
          <stop offset="25%"  stopColor="rgba(255,255,255,0.1)" />
          <stop offset="50%"  stopColor="rgba(0,0,0,0.2)" />
          <stop offset="75%"  stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
