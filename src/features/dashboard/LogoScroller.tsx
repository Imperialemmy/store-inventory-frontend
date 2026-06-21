import { Package } from "lucide-react";

interface LogoScrollerProps {
  logos: string[];
  label: string;
}

const LogoScroller = ({ logos, label }: LogoScrollerProps) => (
  <div className="logo-stack" aria-hidden="true">
    {logos.length > 0 ? (
      logos.slice(0, 3).map((src, index) => (
        <img
          key={src}
          src={src.startsWith("/") ? src : `/${src}`}
          alt=""
          className={`logo-stack__image logo-stack__image--${index + 1}`}
        />
      ))
    ) : (
      <span className="logo-stack__placeholder"><Package size={32} /><small>{label}</small></span>
    )}
  </div>
);

export default LogoScroller;
