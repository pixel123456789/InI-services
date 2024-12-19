function Logo(props: IconTypes) {
    return (
        <svg
    xmlns="http://www.w3.org/2000/svg" 
    width="300" 
    height="300" 
    viewBox="0 0 300 300"
>
    <defs>
        <radialGradient id="gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style="stop-color:white;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:1" />
        </radialGradient>
    </defs>
    
    <rect width="100%" height="100%" fill="white" /> <!-- Background for visibility -->
    
    <!-- Outer Circle -->
    <circle cx="150" cy="150" r="100" fill="url(#gradient)" />

    <!-- Inner Circle -->
    <circle cx="150" cy="150" r="75" fill="white" />

    <!-- Decorative Shapes -->
    <path d="M150 60 C 130 40, 170 40, 150 60 Z" fill="#e0e0e0" />
    <path d="M150 60 C 165 70, 135 70, 150 60 Z" fill="#d0d0d0" />

    <!-- Main Icon -->
    <path d="M150 90 L170 140 L130 140 Z" fill="#c0c0c0" />

    <!-- Stylized "i" -->
    <text
        x="150" 
        y="130" 
        text-anchor="middle"
        font-family="Arial, sans-serif" 
        font-size="60" 
        font-weight="bold"
        fill="#444444"
    >
        i
    </text>

    <!-- Subtitle -->
    <text
        x="150" 
        y="180" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="20"
        fill="#444444"
    >
        Services
    </text>
</svg>
    )
}

export { Logo };
