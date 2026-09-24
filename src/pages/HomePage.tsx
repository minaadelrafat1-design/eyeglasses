import { HeroSection, FeaturedSection, CategoriesSection, BrandPromiseSection } from '@/components/shared';

export function HomePage() {
  return (
    <div className="animate-fade-in">
      <HeroSection />
      <FeaturedSection />
      <CategoriesSection />
      <BrandPromiseSection />
    </div>
  );
}
