import { ThemeConfigurator } from '@/components/ThemeConfigurator';

export const metadata = { title: 'Brands' };

export default function BrandsPage() {
  return (
    <main className="page page-wide">
      <p className="eyebrow">One design system</p>
      <h1>Brands</h1>
      <p className="lead">
        DS-Ngr stays the same components and tokens — here you define multiple brands inside that system. Pick colors,
        neutrals, type, shape and density for each brand, check contrast, then export themes for your app or Figma.
      </p>
      <ThemeConfigurator />
    </main>
  );
}
