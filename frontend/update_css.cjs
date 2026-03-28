const fs = require('fs');

const cssPath = 'src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Find all --color-* : #HEX inside @theme {}
const themeRegex = /@theme\s*{([\s\S]*?)}/g;
let match = themeRegex.exec(css);
if (!match) {
    console.log("No @theme block found");
    process.exit(1);
}

const themeBody = match[1];
const hexRegex = /--(color-([a-zA-Z0-9-]+)):\s*(#[a-zA-Z0-9]{6});/g;
let variables = [];
let hexMatch;

while ((hexMatch = hexRegex.exec(themeBody)) !== null) {
    variables.push({
        fullName: hexMatch[1],      // e.g. color-surface
        baseName: hexMatch[2],      // e.g. surface
        hex: hexMatch[3]            // e.g. #131313
    });
}

// 2. Generate new @theme content
let newThemeBody = themeBody;
let rootVars = '';
let darkVars = '';

// Function to fake invert a dark hex to a light hex
function invertHex(hex) {
    if (hex.length !== 7) return '#ffffff';
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    
    // Most background grays are 1x, 2x, 3x. 
    // If it's very dark (r<50), invert to very light (>220).
    const isDark = (r * 0.299 + g * 0.587 + b * 0.114) < 128;
    
    // Very simple inversion that keeps the app looking relatively clean:
    if (isDark) {
        if (r < 30) return "#ffffff"; // Pure background -> white
        if (r < 50) return "#f4f4f5"; // Surface -> zinc-100
        if (r < 80) return "#e4e4e7"; // Borders -> zinc-200
        if (r < 120) return "#d4d4d8"; 
        return "#a1a1aa";
    } else {
        // It's a light text color on dark bg -> invert to dark text on light bg
        if (r > 230) return "#18181b"; // Pure white -> zinc-900 (Text)
        if (r > 200) return "#27272a"; 
        if (r > 150) return "#52525b";
        return "#1e1e1e";
    }
}

variables.forEach(v => {
    // Replace hardcoded hex with var(--[baseName])
    newThemeBody = newThemeBody.replace(`--${v.fullName}: ${v.hex};`, `--${v.fullName}: var(--${v.baseName});`);
    rootVars += `  --${v.baseName}: ${invertHex(v.hex)};\n`;
    darkVars += `  --${v.baseName}: ${v.hex};\n`;
});

// Primary brand colors specific overrides for light mode to stay blue/vibrant
rootVars = rootVars.replace(/--primary: #.*?;/, '--primary: #2563eb;'); // text-primary will be blue-600

// 3. Re-inject into CSS file
let newCss = css.replace(themeBody, newThemeBody);

// 4. Inject Into :root and .dark
const rootInjection = `\n:root {\n${rootVars}}\n`;
const darkInjection = `\n.dark {\n${darkVars}}\n`;

// Find existing :root and .dark or just append if safe
if (newCss.includes(':root {')) {
    newCss = newCss.replace(':root {', rootInjection + '\n:root {');
} else {
    newCss += rootInjection;
}

if (newCss.includes('.dark {')) {
    newCss = newCss.replace('.dark {', darkInjection + '\n.dark {');
} else {
    newCss += darkInjection;
}

fs.writeFileSync(cssPath, newCss, 'utf8');
console.log("CSS Successfully updated for Light/Dark tokens!");
