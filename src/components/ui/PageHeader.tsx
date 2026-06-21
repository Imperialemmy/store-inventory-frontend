import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

const PageHeader = ({ eyebrow, title, description, action }: PageHeaderProps) => (
  <header className="page-header">
    <div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p className="page-header__description">{description}</p>}
    </div>
    {action && <div className="page-header__action">{action}</div>}
  </header>
);

export default PageHeader;
