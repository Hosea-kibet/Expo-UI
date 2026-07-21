import { BrandPreloader } from "@/src/components/brand-preloader";

export function RouteSplashLoader({ ariaLabel }: { ariaLabel: string }) {
  return (
    <BrandPreloader
      id="route-splash-loader"
      className="preloader route-splash-loader"
      ariaLabel={ariaLabel}
    />
  );
}
