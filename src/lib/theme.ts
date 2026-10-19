import { createTheme, type CSSVariablesResolver, type MantineColorsTuple } from '@mantine/core';

/** iStoc marka turuncusu (#FF8600) etrafında üretilmiş ton dizisi. */
const istoc: MantineColorsTuple = [
  '#fff4e6',
  '#ffe4c2',
  '#ffcc8f',
  '#ffb257',
  '#ff9c2b',
  '#ff8600',
  '#e07500',
  '#b35d00',
  '#9c4a00',
  '#6b3300',
];

export const theme = createTheme({
  fontFamily: 'var(--font-sans)',
  fontFamilyMonospace: 'var(--font-mono)',
  headings: {
    fontFamily: 'var(--font-sans)',
    fontWeight: '700',
  },
  primaryColor: 'istoc',
  primaryShade: { light: 8, dark: 4 },
  colors: { istoc },
  // Çevreleyen odak halkası yasak: gösterge global.css'teki merkezi klavye modundan gelir.
  focusRing: 'never',
  // Basılıyken kutu kaydırma (translateY) yok.
  activeClassName: '',
  // En küçük okunabilir metin 14 CSS px: xs ve sm aynı tabana çekildi.
  fontSizes: {
    xs: 'var(--text-sm)',
    sm: 'var(--text-sm)',
    md: 'var(--text-md)',
    lg: 'var(--text-lg)',
    xl: 'var(--text-xl)',
  },
  radius: {
    xs: 'var(--radius-sm)',
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-pill)',
  },
  defaultRadius: 'md',
  spacing: {
    xs: 'var(--space-2)',
    sm: 'var(--space-3)',
    md: 'var(--space-4)',
    lg: 'var(--space-6)',
    xl: 'var(--space-8)',
  },
});

/** Mantine yüzey ve metin değişkenlerini projenin semantik tokenlarına bağlar. */
export const cssVariablesResolver: CSSVariablesResolver = () => {
  const shared = {
    '--mantine-color-body': 'var(--surface-page)',
    '--mantine-color-text': 'var(--text-primary)',
    '--mantine-color-dimmed': 'var(--text-secondary)',
    '--mantine-color-anchor': 'var(--text-link)',
    '--mantine-color-default-border': 'var(--rule)',
  };
  return { variables: {}, light: shared, dark: shared };
};
