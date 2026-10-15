export default function WidgetShell({ span = '', className = '', title, titleClass = '', action, children }) {
  return (
    <section className={`glass widget ${span} ${className}`}>
      {title && (
        <header className="widget-head">
          <h3 className={titleClass}>{title}</h3>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
