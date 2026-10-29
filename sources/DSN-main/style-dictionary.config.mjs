import StyleDictionary from 'style-dictionary';
import fs from 'fs';

// --- Custom Transforms ---

function hexToRgb(hex) {
    const normalized = hex.replace('#', '');
    if (normalized.length !== 6) {
        return null;
    }

    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    if ([r, g, b].some((v) => Number.isNaN(v))) {
        return null;
    }
    return `${r}, ${g}, ${b}`;
}

StyleDictionary.registerTransform({
    name: 'figma/color',
    type: 'value',
    filter: (token) => token.$type === 'color' || token.type === 'color',
    transform: (token) => {
        const val = token.$value || token.value;
        if (typeof val === 'object' && val !== null) {
            const { hex, alpha } = val;
            if (alpha === 1 || alpha === undefined) return hex;
            const rgb = typeof hex === 'string' ? hexToRgb(hex) : null;
            if (rgb) return `rgba(${rgb}, ${alpha})`;
            return hex;
        }
        return val;
    }
});

StyleDictionary.registerTransform({
    name: 'figma/px',
    type: 'value',
    filter: (token) => (token.$type === 'number' || token.type === 'number'),
    transform: (token) => {
        const val = token.$value || token.value;
        if (typeof val === 'number') {
            return `${val}px`;
        }
        return val;
    }
});

StyleDictionary.registerTransform({
    name: 'dsn/name',
    type: 'name',
    transform: (token) => {
        let path = [...token.path];
        if (token.filePath.includes('sizing')) {
            path = ['size', ...path];
        }
        return path
            .join('-')
            .replace(/,/g, '-')
            .replace(/\./g, '-')
            .replace(/ /g, '-')
            .toLowerCase();
    }
});

// --- Output Helpers ---

function emitVarBlock(vars, indent = '  ') {
    return Object.entries(vars)
        .map(([name, value]) => `${indent}--${name}: ${value};`)
        .join('\n');
}

const COMPAT_ALIASES = {
    // Primitive compatibility aliases used by composite tokens
    'primitive-neutral-white': 'var(--colors-neutral-white)',
    'primitive-neutral-100': 'var(--colors-neutral-100)',
    'primitive-alpha-dark-5': 'var(--colors-alpha-dark-5)',

    // Core color compatibility aliases
    'color-text-primary': 'var(--text-primary)',
    'color-text-primary-inverted': 'var(--text-inverted-primary)',
    'color-text-secondary': 'var(--text-secondary)',
    'color-text-tertiary': 'var(--text-tertiary)',
    'color-text-disabled': 'var(--text-disabled)',
    'color-text-placeholder': 'var(--text-placeholder)',
    'color-text-danger-default': 'var(--text-interactive-danger-default)',
    'color-text-danger-hover': 'var(--text-interactive-danger-hover)',
    'color-text-danger-pressed': 'var(--text-interactive-danger-pressed)',
    'color-text-success-default': 'var(--text-feedback-success)',
    'color-border-default': 'var(--color-border-neutral-primary)',
    'color-border-alpha': 'var(--color-border-neutral-secondary)',
    'color-border-selected-default': 'var(--color-border-interactive-primary-selected)',
    'color-border-input-error': 'var(--color-border-error-strong)',
    'color-border-text-input-default': 'var(--color-border-neutral-primary)',
    'color-surface-input-bg': 'var(--surface-input-default)',
    'color-surface-hover': 'var(--surface-input-hover)',
    'color-surface-pressed': 'var(--surface-input-pressed)',
    'color-tag-bg-progress-default': 'var(--surface-tag-progress)',

    // Background/state compatibility aliases
    'background-feedback-critical': 'var(--color-background-error-strong)',
    'background-success-default': 'var(--color-background-success-soft-default)',
    'background-selected-soft-default': 'var(--color-background-interactive-secondary-selected)',
    'background-selected-soft-accent': 'var(--color-background-interactive-secondary-selected)',
    'background-interactive-secondary-hover': 'var(--surface-input-hover)',
    'background-interactive-secondary-pressed': 'var(--surface-input-pressed)',

    // Sizing/spacing contract used by existing components
    'control-height-standard': 'var(--size-control-height-md, 32px)',
    'control-height-nested': 'var(--size-control-height-sm, 24px)',
    'control-radius-standard': 'var(--shape-radius-control-md, 16px)',
    'control-radius-small': 'var(--shape-radius-control-sm, 12px)',
    'control-button-space-standard': 'var(--space-2xs, 4px)',
    'control-button-inset-standard': 'var(--space-xs, 8px)',
    'control-button-inset-small': 'var(--space-2xs, 4px)',
    'control-button-group-larger': 'var(--space-xs, 8px)',
    'control-button-group-smaller': 'var(--space-2xs, 4px)',
    'control-chip-inset-standard': 'var(--space-xs, 8px)',
    'control-chip-inset-small': 'var(--space-2xs, 4px)',
    'control-chip-space-standard': 'var(--space-2xs, 4px)',
    'control-chip-space-small': '0px',

    'border-width-default': 'var(--size-border-sm, 1px)',
    'border-width-medium': '1.5px',
    'border-width-thick': '2px',
    'border-width-focus': '2px',
    'border-none': '0px',
    'border-ui-icon': 'var(--size-border-icon, 1.25px)',

    'inset-none': '0px',
    'inset-micro': '2px',
    'inset-tiny': '4px',
    'inset-small': '8px',
    'inset-medium': '12px',
    'inset-large': '16px',
    'inset-xlarge': '24px',
    'inset-icon-wrapper-standard': 'var(--space-2xs, 4px)',
    'inset-label-wrapper-standard': 'var(--space-2xs, 4px)',

    // Typography compatibility aliases
    'font-family-default': "'Equip', 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    'font-size-micro': '12px',
    'font-size-label': '14px',
    'font-size-body-s': '14px',
    'font-size-body-l': '16px',
    'font-size-display-s': '24px',
    'font-size-display-m': '32px',
    'font-size-display-l': '40px',
    'font-size-display-xl': '48px',
    'font-size-display-2xl': '52px',
    'font-size-display-3xl': '60px',
    'font-line-height-micro': '16px',
    'font-line-height-label': '16px',
    'font-line-height-body-s': '20px',
    'font-line-height-body-l': '24px',
    'font-line-height-display-s': '32px',
    'font-line-height-display-m': '40px',
    'font-line-height-display-l': '48px',
    'font-line-height-display-xl': '56px',
    'font-line-height-display-2xl': '64px',
    'font-line-height-display-3xl': '72px',
    'font-weight-regular': '400',
    'font-weight-medium': '500',
    'font-weight-semibold': '600',
    'font-letter-spacing-normal': '0',
    'font-letter-spacing-tight': '-0.3px',

    // Transition aliases
    'transition-fast': '100ms ease',
    'transition-medium': '150ms ease',
    'transition-slow': '200ms ease',

    'space-none': '0px',
    'space-2xsmall': '2px',
    'space-micro': '2px',
    'space-tiny': '4px',
    'space-small': '8px',
    'space-compact': '12px',
    'space-medium': '16px',
    'space-comfortable': '20px',
    'space-large': '24px',
    'space-spacious': '32px',
    'space-generous': '40px',
    'space-ample': '48px',
    'space-grand': '64px',
    'space-toolbar-standard': 'var(--space-md, 16px)',

    'gap-button-small': '0px',
    'gap-avatar-group': '-4px',

    'size-avatar-xxs': '16px',
    'size-avatar-xs': '24px',
    'size-avatar-sm': '32px',
    'size-avatar-lg': '48px',
    'size-avatar-xl': '64px',
    'size-avatar-xxl': '128px',

    'dimensions-width-standard': 'var(--primitive-size-320, 320px)',
    'dimensions-width-popover': 'var(--popover-width-md, 256px)',

    'nav-topbar-height': 'var(--topbar-height, 48px)',
    'nav-heading-height': 'var(--section-header-height-sm, 32px)',
    'nav-toolbar-height': 'var(--toolbar-height, 48px)',
    'nav-toolbar-inset': 'var(--space-md, 16px)',
    'nav-sidebar-width': 'var(--sidebar-width-expanded-min, 256px)',

    'radius-none': '0px',
    'radius-small': '4px',
    'radius-medium': '6px',
    'radius-large': '8px',
    'radius-xlarge': '12px',
    'radius-full': '9999px',

    'tag-inset': 'var(--space-2xs, 4px)',
    'tag-radius': 'var(--tag-radius, 16px)',

    // Effects compatibility aliases
    'effects-offset-1': 'var(--primitive-size-1, 1px)',
    'effects-offset-2': '2px',
    'effects-offset-4': '4px',
    'effects-blur-subtle': 'var(--effect-blur-sm, 2px)',
    'effects-blur-soft': 'var(--effects-blur-subtle)',
    'effects-spread-positive-1': 'var(--primitive-size-1, 1px)',
    'effects-spread-negative-2': '-2px',
    'effects-elevation-button-default-blur': 'var(--effect-blur-sm, 2px)',
    'effects-emboss-position-y-negative': '-1px',
    'effects-emboss-position-y-default': '1px',
    'effects-separators-emboss-light': 'var(--colors-neutral-white)',
    'effects-emboss-button-secondary-top': 'var(--colors-neutral-white)',
    'effects-emboss-button-secondary-bottom': 'var(--colors-alpha-dark-5)',
    'effects-elevation-medium': 'var(--effects-shadow-outter-soft)',
    'effects-shadows-default': 'var(--effects-shadow-outter-soft)',
    'effects-shadows-effect-shadow-contrast-border': 'var(--effects-shadow-outter-soft)',
    'Effects-Shadows-default': 'var(--color-shadow-default)',
    'Effects-Shadows-effect-shadow-contrast-border': 'var(--color-shadow-contrast-border)',
};

const COMPAT_COMPOSITES = {
    'box-shadow-button-primary-default': [
        'inset 0 var(--effects-offset-1) 0 0 var(--effects-shadow-inner-light-soft)',
        'inset 0 var(--primitive-size-negative-1) 0 0 var(--effects-shadow-inner-dark-soft)',
        '0 0 0 var(--effects-spread-positive-1) var(--effects-shadow-outter-strong)',
        '0 var(--effects-offset-1) var(--effects-blur-subtle) 0 var(--effects-shadow-outter-soft)',
    ].join(', '),
    'box-shadow-button-primary-hover': [
        'inset 0 var(--effects-offset-1) 0 0 var(--effects-shadow-inner-light-soft)',
        'inset 0 var(--primitive-size-negative-1) 0 0 var(--effects-shadow-inner-dark-soft)',
        '0 0 0 var(--effects-spread-positive-1) var(--effects-shadow-outter-strong)',
        '0 2px var(--effect-blur-sm) 0 var(--effects-shadow-outter-soft)',
    ].join(', '),
    'box-shadow-button-pressed': [
        '0 var(--effects-offset-1) 0 0 var(--color-shadow-separator-emboss-light)',
        'inset 0 0 0 var(--effects-spread-positive-1) var(--color-shadow-default)',
    ].join(', '),
    'box-shadow-button-secondary-default': [
        'inset 0 var(--effects-offset-1) 0 0 var(--color-shadow-emboss-button-secondary-top)',
        'inset 0 var(--primitive-size-negative-1) 0 0 var(--color-shadow-emboss-button-secondary-bottom)',
        '0 0 0 var(--effects-spread-positive-1) var(--effects-shadow-outter-soft)',
        '0 var(--effects-offset-1) var(--effect-blur-sm) 0 var(--effects-shadow-inner-dark-soft)',
    ].join(', '),
    'box-shadow-button-secondary-hover': [
        'inset 0 var(--effects-offset-1) 0 0 var(--color-shadow-emboss-button-secondary-top)',
        'inset 0 var(--primitive-size-negative-1) 0 0 var(--color-shadow-emboss-button-secondary-bottom)',
        '0 0 0 var(--effects-spread-positive-1) var(--effects-shadow-outter-strong)',
        '0 var(--effects-offset-1) var(--effect-blur-sm) 0 var(--effects-shadow-outter-soft)',
    ].join(', '),
    'box-shadow-button-focus': [
        'inset 0 0 0 1px var(--color-border-interactive-focus)',
        'inset 0 0 0 2px var(--color-shadow-focus-inset)',
    ].join(', '),
    'box-shadow-button-destructive-focus': [
        'inset 0 0 0 1px var(--color-border-interactive-destructive-focus)',
        'inset 0 0 0 2px var(--color-shadow-focus-inset)',
    ].join(', '),
    'box-shadow-button-group': [
        '0 0 0 1px var(--effects-shadow-outter-soft)',
        '0 1px 2px 0 var(--effects-shadow-outter-soft)',
    ].join(', '),
    'box-shadow-input': [
        '0px 1px 0px 0px var(--color-shadow-separator-emboss-light)',
        'inset 0px 0px 0px 1px var(--effects-shadow-outter-soft)',
        'inset 0px 1px 1px 0px var(--effects-shadow-inner-dark-soft)',
    ].join(', '),
    'box-shadow-switcher-track-off': [
        '0px 1px 0px 0px var(--color-shadow-separator-emboss-light)',
        'inset 0px 0px 0px 1px var(--effects-shadow-outter-soft)',
        'inset 0px 1px 1px 0px var(--effects-shadow-inner-dark-soft)',
    ].join(', '),
    'box-shadow-switcher-thumb': [
        '0px 0px 0px 1px var(--effects-shadow-outter-soft)',
        '0px 2px 8px 0px var(--effects-shadow-outter-soft)',
        'inset 0px 1px 0px 0px var(--primitive-neutral-white)',
        'inset 0px -1px 0px 0px var(--surface-tag-neutral)',
    ].join(', '),
};

// --- Multi-Pass Build Strategy ---

async function runBuild() {
    const commonSource = ['Design Tokens/primitives.tokens.json', 'Design Tokens/sizing.tokens.json'];

    // 1. Build Light Theme
    const lightSd = new StyleDictionary({
        source: [...commonSource, 'Design Tokens/color-light.tokens.json'],
        platforms: {
            json: {
                transformGroup: 'css',
                transforms: ['attribute/cti', 'dsn/name', 'figma/color', 'figma/px'],
                buildPath: 'temp/',
                files: [{ destination: 'light.json', format: 'json/flat' }]
            }
        }
    });
    await lightSd.buildAllPlatforms();

    // 2. Build Dark Theme
    const darkSd = new StyleDictionary({
        source: [...commonSource, 'Design Tokens/color-dark.tokens.json'],
        platforms: {
            json: {
                transformGroup: 'css',
                transforms: ['attribute/cti', 'dsn/name', 'figma/color', 'figma/px'],
                buildPath: 'temp/',
                files: [{ destination: 'dark.json', format: 'json/flat' }]
            }
        }
    });
    await darkSd.buildAllPlatforms();

    // 3. Merge and Generate CSS
    const lightTokens = JSON.parse(fs.readFileSync('temp/light.json', 'utf8'));
    const darkTokens = JSON.parse(fs.readFileSync('temp/dark.json', 'utf8'));

    let cssOutput = '/* Generated by Style Dictionary - DO NOT EDIT MANUALLY */\n\n:root {\n';

    // Light / Primitives
    cssOutput += `${emitVarBlock(lightTokens)}\n\n`;
    cssOutput += '  /* Compatibility aliases (existing component contract) */\n';
    cssOutput += `${emitVarBlock(COMPAT_ALIASES)}\n\n`;
    cssOutput += '  /* Composite tokens used by components */\n';
    cssOutput += `${emitVarBlock(COMPAT_COMPOSITES)}\n`;
    cssOutput += '}\n\n[data-theme="dark"] {\n';

    // Dark overrides (only include if different from light OR if it's a semantic color)
    for (const [name, value] of Object.entries(darkTokens)) {
        if (lightTokens[name] !== value || name.startsWith('background') || name.startsWith('text') || name.startsWith('surface')) {
            cssOutput += `  --${name}: ${value};\n`;
        }
    }

    cssOutput += '  /* Dark-mode semantic exception from token source */\n';
    cssOutput += '  --tag-border-success: var(--color-background-success-soft-default);\n';
    cssOutput += '}\n';
    fs.writeFileSync('tokens.css', cssOutput);

    // Cleanup
    fs.rmSync('temp/', { recursive: true, force: true });

    console.log('✔︎ tokens.css generated successfully');
}

await runBuild();

export default {};
