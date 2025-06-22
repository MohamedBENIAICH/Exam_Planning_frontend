import React from "react";

export const Spinner = () => (
  <div style={{ display: "inline-block", width: 24, height: 24 }}>
    <svg
      viewBox="0 0 50 50"
      style={{ width: "100%", height: "100%" }}
      className="animate-spin"
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="5"
        strokeDasharray="31.415, 31.415"
        transform="rotate(72.5046 25 25)"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  </div>
);

export default Spinner;