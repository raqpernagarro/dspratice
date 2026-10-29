import React, { useState, useEffect, useCallback, useId } from 'react';

export const ThemeToggle = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const containerId = useId().replace(/:/g, '-');

    // Toggle data-theme on <html> so [data-theme="dark"] in tokens.css applies
    useEffect(() => {
        const html = document.documentElement;
        const previousTheme = html.getAttribute('data-theme') || 'light';
        html.setAttribute('data-theme', theme);

        return () => {
            html.setAttribute('data-theme', previousTheme);
        };
    }, [theme]);

    // Inject scoped styles to override Storybook's hardcoded text colors
    useEffect(() => {
        const styleId = `theme-toggle-text-fix-${containerId}`;
        let style = document.getElementById(styleId) as HTMLStyleElement | null;
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }

        style.textContent = `
      #${containerId} h3,
      #${containerId} h4,
      #${containerId} p,
      #${containerId} span,
      #${containerId} div,
      #${containerId} td,
      #${containerId} th,
      #${containerId} label {
        color: var(--color-foreground-neutral-primary) !important;
      }
      #${containerId} [class*="docblock-colorpalette"] span,
      #${containerId} [class*="ColorItem"] span {
        color: var(--color-foreground-neutral-secondary) !important;
      }
    `;

        return () => {
            style?.remove();
        };
    }, [containerId]);

    const toggle = useCallback(() => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    }, []);

    return (
        <div
            id={containerId}
            style={{
                padding: '32px 24px',
                margin: '24px 0',
                borderRadius: 'var(--shape-radius-lg)',
                border: '1px solid var(--color-border-neutral-primary)',
                background: 'var(--color-background-neutral-primary)',
                color: 'var(--color-foreground-neutral-primary)',
                transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '24px',
                position: 'sticky',
                top: 24,
                zIndex: 10,
            }}>
                <button
                    onClick={toggle}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: 'var(--color-background-interactive-secondary-default)',
                        color: 'var(--color-foreground-neutral-primary)',
                        border: '1px solid var(--color-border-neutral-primary)',
                        borderRadius: 'var(--shape-radius-full)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                    }}
                >
                    {theme === 'light' ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                            Switch to Dark Mode
                        </>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="23"></line>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                <line x1="1" y1="12" x2="3" y2="12"></line>
                                <line x1="21" y1="12" x2="23" y2="12"></line>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </svg>
                            Switch to Light Mode
                        </>
                    )}
                </button>
            </div>
            {children}
        </div>
    );
};
