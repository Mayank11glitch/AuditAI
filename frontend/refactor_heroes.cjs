const fs = require('fs');
const path = require('path');

const targetDirs = ['src/components/ui'];

const replacements = [
    { from: /text-white\b/g, to: 'text-foreground' },
    { from: /text-white\/([0-9]+)/g, to: 'text-foreground/$1' },
    { from: /bg-\[#0a0a0b\]/g, to: 'bg-background' },
    { from: /bg-\[#111113\]/g, to: 'bg-surface' },
    { from: /bg-black\b/g, to: 'bg-background' },
    { from: /bg-white\/5\b/g, to: 'bg-foreground/5' },
    { from: /bg-white\/10\b/g, to: 'bg-foreground/10' },
    { from: /bg-white\/15\b/g, to: 'bg-foreground/15' },
    { from: /bg-white\/20\b/g, to: 'bg-foreground/20' },
    { from: /bg-white\/\[0\.02\]/g, to: 'bg-foreground/[0.02]' },
    { from: /bg-white\/\[0\.03\]/g, to: 'bg-foreground/[0.03]' },
    { from: /bg-white\/\[0\.04\]/g, to: 'bg-foreground/[0.04]' },
    { from: /bg-white\/\[0\.05\]/g, to: 'bg-foreground/[0.05]' },
    { from: /border-white\/([0-9]+)/g, to: 'border-foreground/$1' },
    { from: /border-white\/\[0\.([0-9]+)\]/g, to: 'border-foreground/[0.$1]' },
    { from: /shadow-\[([a-zA-Z0-9_\-,\(\)\. ]+)\]/g, to: 'shadow-lg' },
];

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (file === 'horizon-hero-section.tsx' || file === 'ai-input-hero.tsx' || file === 'animated-shader-hero.tsx') {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            for (const r of replacements) {
                content = content.replace(r.from, r.to);
            }
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated:', fullPath);
            }
        }
    }
}

targetDirs.forEach(dir => processDir(dir));
console.log('Hero Components Swept Successfully!');
